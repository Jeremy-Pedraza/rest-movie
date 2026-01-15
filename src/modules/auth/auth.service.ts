// src/modules/auth/auth.service.ts

/**
 * @fileoverview Service para autenticación y gestión de sesiones
 * @module modules/auth
 *
 * ⚠️ REGLAS:
 * - SIEMPRE inyectar SanitizerService y HandleErrorService
 * - Sanitizar todos los inputs
 * - Usar HandleErrorService para errores consistentes
 * - NO tiene try-catch en métodos públicos (AllExceptionsFilter lo maneja)
 * - Contiene TODA la lógica de negocio
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { ERROR_CODES, RESPONSE_MESSAGES, ROLES } from '@constants';
import { EmailProducer } from '@modules/queue';
import { UserService } from '@modules/user';
import { HandleErrorService, SanitizerService } from '@shared/common';
import { UtilsService } from '@shared/utils';

import { AuthRepository } from './auth.repository';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { SessionEntity } from './entities';
import {
  IAuthResponse,
  IForgotPasswordResponse,
  IJwtPayload,
  ILogoutResponse,
  IPasswordChangeResponse,
  IRefreshTokenResponse,
  IResetPasswordResponse,
  ISessionInfo,
} from './interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sanitizer: SanitizerService, // ✅ OBLIGATORIO
    private readonly handleError: HandleErrorService, // ✅ OBLIGATORIO
    private readonly emailProducer: EmailProducer, // ✅ Para envío asíncrono de emails
    private readonly utils: UtilsService, // ✅ Utilidades (validación, formateo, crypto)
  ) {}

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * Login de usuario
   *
   * ✅ FASE 4: ACTUALIZADO para incluir companyId y schema en JWT
   */
  async login(dto: LoginDto, ipAddress: string, userAgent?: string): Promise<IAuthResponse> {
    // 1. ✅ VALIDAR email antes de sanitizar
    if (!this.utils.validation.isEmail(dto.email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    // 2. Sanitizar email
    const email = this.sanitizer.sanitizeEmail(dto.email);

    // 3. Buscar usuario por email (con password para validación)
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS,
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      );
    }

    // 4. Verificar estado del usuario
    this.validateUserStatus(user);

    // 5. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.userService.incrementFailedAttempts(user.id);
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS,
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      );
    }

    // 6. Resetear intentos fallidos
    await this.userService.resetFailedAttempts(user.id);

    // 7. Actualizar último login
    await this.userService.updateLastLogin(user.id);

    // 8. Cargar usuario completo con company y roles para el token
    const fullUser = await this.userService.findByIdWithCompanyAndRoles(user.id);
    if (!fullUser) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.USER_NOT_FOUND,
        ERROR_CODES.AUTH_USER_NOT_FOUND,
      );
    }

    // 9. Generar tokens con companyId y schema
    const tokens = await this.generateTokens(
      fullUser.id,
      fullUser.email,
      fullUser.roles.map((r) => r.name),
      fullUser.company_id,
      fullUser.company?.schema || null,
    );

    // 10. Crear sesión
    await this.createSession(
      fullUser.id,
      tokens.refreshToken,
      tokens.expiresIn,
      ipAddress,
      userAgent,
    );

    // 11. Retornar respuesta (sin password)
    const userResponse = await this.userService.findById(fullUser.id);

    // ✅ Log con email enmascarado (GDPR/Privacidad)
    const maskedEmail = this.utils.string.maskEmail(fullUser.email);
    this.logger.log(`User logged in: ${maskedEmail} (${fullUser.company?.schema || 'public'})`);

    let data = {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: RESPONSE_MESSAGES.AUTH.TOKEN_TYPE,
      expiresIn: tokens.expiresIn,
    };
    data = this.utils.removeTimestamps(data);
    return data;
  }

  /**
   * Registro de nuevo usuario
   *
   * ✅ FASE 4: ACTUALIZADO para generar tokens con companyId/schema
   * NOTA: En registro, el usuario normalmente NO tiene company aún,
   *       por lo que companyId y schema serán null.
   */
  async register(dto: RegisterDto, ipAddress: string, userAgent?: string): Promise<IAuthResponse> {
    // 1. ✅ Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(dto.email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    // 2. ✅ Validar fortaleza de password
    const passwordValidation = this.utils.validation.validatePassword(dto.password);
    if (!passwordValidation.isValid) {
      this.handleError.badRequest(
        `Password débil: ${passwordValidation.errors.join(', ')}`,
        'password',
      );
    }

    // 3. Sanitizar inputs
    const sanitizedDto = {
      email: this.sanitizer.sanitizeEmail(dto.email),
      password: dto.password, // No sanitizar password
      firstName: this.sanitizer.sanitizeString(dto.firstName),
      lastName: this.sanitizer.sanitizeString(dto.lastName),
      phone: dto.phone ? this.sanitizer.sanitizeString(dto.phone) : undefined,
    };

    // 4. Verificar que el email no exista
    const exists = await this.userService.existsByEmail(sanitizedDto.email);
    if (exists) {
      this.handleError.conflict('El email ya está registrado', 'email');
    }

    // 5. Crear usuario con rol USER por defecto
    // Nota: El UserService asignará el rol USER por defecto si no se especifica roleIds
    const user = await this.userService.create({
      ...sanitizedDto,
      // roleIds se manejará internamente en UserService si no se proporciona
    });

    // ✅ 6. Generar tokens (sin company en registro - será null)
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      [ROLES.USER],
      null, // ✅ companyId null en registro
      null, // ✅ schema null en registro
    );

    // 7. Crear sesión
    await this.createSession(user.id, tokens.refreshToken, tokens.expiresIn, ipAddress, userAgent);

    // 8. Encolar email de bienvenida (asíncrono, no bloquea el registro)
    const activationUrl = `${this.configService.get<string>('APP_URL')}/auth/verify-email?token=${tokens.accessToken}`;
    await this.emailProducer.queueEmail({
      to: user.email,
      subject: '¡Bienvenido a Rest App! 🎉',
      content: `
        <h1>¡Bienvenido ${user.firstName}!</h1>
        <p>Gracias por registrarte en Rest App.</p>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Para comenzar, verifica tu email haciendo clic en el siguiente enlace:</p>
        <p><a href="${activationUrl}">Verificar mi email</a></p>
        <p>Si no te registraste en nuestra plataforma, ignora este correo.</p>
        <p>Saludos,<br/>El equipo de Rest App</p>
      `,
      templateData: {
        userName: user.firstName,
        userEmail: user.email,
        activationUrl,
      },
    });

    // ✅ Log con email enmascarado (GDPR/Privacidad)
    const maskedEmail = this.utils.string.maskEmail(user.email);
    this.logger.log(`User registered: ${maskedEmail} - Welcome email enqueued`);
    let data = {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: RESPONSE_MESSAGES.AUTH.TOKEN_TYPE,
      expiresIn: tokens.expiresIn,
    };
    data = this.utils.removeTimestamps(data);
    return data;
  }

  /**
   * Refresh token con rotación
   *
   * ✅ FASE 4: ACTUALIZADO para incluir companyId y schema en tokens nuevos
   */
  async refreshToken(dto: RefreshTokenDto): Promise<IRefreshTokenResponse> {
    // 1. Buscar sesión por refresh token
    const session = await this.authRepository.findByRefreshToken(dto.refreshToken);

    if (!session) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID,
      );
    }

    // 2. Verificar que la sesión sea válida
    if (!session.isValid()) {
      await this.authRepository.revokeSession(session.id, 'Sesión inválida');
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.SESSION_EXPIRED,
        ERROR_CODES.AUTH_SESSION_EXPIRED,
      );
    }

    // 3. Verificar token reuse (seguridad)
    if (session.is_revoked) {
      // Token fue reusado - revocar toda la familia de tokens
      await this.authRepository.revokeAllByUserId(session.user_id, 'Token reuse detected');
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID,
      );
    }

    // ✅ 4. Verificar estado del usuario y cargar company
    const user = await this.userService.findByIdWithCompanyAndRoles(session.user_id);
    if (!user) {
      await this.authRepository.revokeSession(session.id);
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.USER_NOT_FOUND,
        ERROR_CODES.AUTH_USER_NOT_FOUND,
      );
    }

    this.validateUserStatus(user);

    // ✅ 5. Generar nuevos tokens con companyId y schema (rotación)
    const newTokens = await this.generateTokens(
      user.id,
      user.email,
      user.roles.map((r) => r.name),
      user.company_id, // ✅ Incluir companyId
      user.company?.schema || null, // ✅ Incluir schema
    );

    // 6. Actualizar sesión con nuevo refresh token
    await this.authRepository.updateRefreshToken(
      session.id,
      newTokens.refreshToken,
      new Date(Date.now() + newTokens.expiresIn * 1000),
    );

    this.logger.log(`Token refreshed for user: ${user.email}`);

    let data = {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      tokenType: RESPONSE_MESSAGES.AUTH.TOKEN_TYPE,
      expiresIn: newTokens.expiresIn,
    };
    data = this.utils.removeTimestamps(data);
    return data;
  }

  /**
   * Logout - revocar sesión actual
   */
  async logout(refreshToken: string): Promise<ILogoutResponse> {
    const revoked = await this.authRepository.revokeByRefreshToken(refreshToken, 'User logout');

    if (!revoked) {
      this.handleError.notFound('Sesión', refreshToken);
    }

    this.logger.log(`User logged out`);

    return {
      message: 'Sesión cerrada exitosamente',
      loggedOutAt: new Date(),
    };
  }

  /**
   * Logout de todas las sesiones del usuario
   */
  async logoutAll(userId: string): Promise<ILogoutResponse> {
    const revokedCount = await this.authRepository.revokeAllByUserId(userId, 'Logout all sessions');

    this.logger.log(`All sessions logged out for user: ${userId} (${revokedCount} sessions)`);

    return {
      message: `${revokedCount} sesiones cerradas exitosamente`,
      loggedOutAt: new Date(),
    };
  }

  // ============================================
  // GESTIÓN DE CONTRASEÑA
  // ============================================

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<IPasswordChangeResponse> {
    // 1. Obtener usuario con password
    const user = await this.userService.findByIdWithPassword(userId);
    if (!user) {
      this.handleError.notFound('Usuario', userId);
    }

    // 2. Verificar contraseña actual
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      this.handleError.badRequest('La contraseña actual es incorrecta');
    }

    // 3. Verificar que la nueva contraseña sea diferente
    const isSame = await bcrypt.compare(dto.newPassword, user.password);
    if (isSame) {
      this.handleError.badRequest('La nueva contraseña debe ser diferente a la actual');
    }

    // 4. Actualizar contraseña
    await this.userService.updatePassword(userId, dto.newPassword);

    // 5. Revocar todas las sesiones excepto la actual (opcional)
    // Por seguridad, forzar re-login en otros dispositivos
    await this.authRepository.revokeAllByUserId(userId, 'Password changed');

    this.logger.log(`Password changed for user: ${userId}`);

    return {
      message: 'Contraseña cambiada exitosamente',
      changedAt: new Date(),
      shouldLogoutOtherSessions: true,
    };
  }

  /**
   * Solicitar reset de contraseña (forgot password)
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<IForgotPasswordResponse> {
    // 1. ✅ Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(dto.email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    const email = this.sanitizer.sanitizeEmail(dto.email);

    // 2. Buscar usuario (no revelar si existe o no por seguridad)
    const user = await this.userService.findByEmail(email);

    if (user) {
      // 3. Generar token de reset (válido por 1 hora)
      const resetToken = this.generateResetToken(user.id);

      // 4. Encolar email de reset de contraseña (asíncrono)
      const resetUrl = `${this.configService.get<string>('APP_URL')}/auth/reset-password?token=${resetToken}`;
      await this.emailProducer.queueEmailUrgent({
        to: user.email,
        subject: 'Restablecer contraseña - Rest App',
        content: `
          <h1>Restablecer contraseña</h1>
          <p>Hola ${user.firstName},</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <p><a href="${resetUrl}">Restablecer contraseña</a></p>
          <p>Este enlace es válido por 1 hora.</p>
          <p>Si no solicitaste este cambio, ignora este correo.</p>
          <p>Saludos,<br/>El equipo de Rest App</p>
        `,
        templateData: {
          userName: user.firstName,
          resetUrl,
          expirationHours: 1,
        },
      });

      // 5. Guardar token en metadata del usuario o en tabla separada
      await this.userService.savePasswordResetToken(user.id, resetToken);

      // ✅ Log con email enmascarado (GDPR/Privacidad)
      const maskedEmail = this.utils.string.maskEmail(email);
      this.logger.log(`Password reset requested for: ${maskedEmail} - Email enqueued`);
    } else {
      // ✅ Por seguridad, no revelar que el usuario no existe
      // Log enmascarado para proteger privacidad
      const maskedEmail = this.utils.string.maskEmail(email);
      this.logger.warn(`Password reset attempted for non-existent user: ${maskedEmail}`);
    }

    // Siempre retornar success (no revelar si el usuario existe)
    return {
      message: 'Si el email existe, recibirás instrucciones para resetear tu contraseña',
      email,
      requestedAt: new Date(),
    };
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<IResetPasswordResponse> {
    // 1. Verificar y decodificar token
    let payload: { userId: string; exp: number };
    try {
      payload = this.jwtService.verify(dto.token, {
        secret: this.configService.get<string>('jwt.resetSecret'),
      });
    } catch {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_TOKEN_INVALID,
      );
    }

    // 2. Verificar que el token no haya expirado
    if (payload.exp * 1000 < Date.now()) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_EXPIRED,
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
      );
    }

    // 3. Actualizar contraseña
    await this.userService.updatePassword(payload.userId, dto.password);

    // 4. Invalidar token de reset
    await this.userService.invalidatePasswordResetToken(payload.userId);

    // 5. Revocar todas las sesiones por seguridad
    await this.authRepository.revokeAllByUserId(payload.userId, 'Password reset');

    this.logger.log(`Password reset for user: ${payload.userId}`);

    return {
      message: 'Contraseña reseteada exitosamente',
      resetAt: new Date(),
    };
  }

  // ============================================
  // GESTIÓN DE SESIONES
  // ============================================

  /**
   * Obtener sesiones activas del usuario
   */
  async getActiveSessions(userId: string): Promise<ISessionInfo[]> {
    const sessions = await this.authRepository.findActiveByUserId(userId);

    return sessions.map((session) => this.toSessionInfo(session));
  }

  /**
   * Revocar sesión específica
   */
  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    // Verificar que la sesión pertenezca al usuario
    const session = await this.authRepository.findById(sessionId);

    if (!session) {
      this.handleError.notFound('Sesión', sessionId);
    }

    if (session.user_id !== userId) {
      this.handleError.forbidden('No tienes permiso para revocar esta sesión');
    }

    return await this.authRepository.revokeSession(sessionId, 'Revoked by user');
  }

  /**
   * Revocar todas las sesiones excepto la actual
   */
  async revokeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    return await this.authRepository.revokeOtherSessions(
      userId,
      currentSessionId,
      'Other sessions revoked',
    );
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Generar access token y refresh token
   *
   * ✅ FASE 4: ACTUALIZADO para incluir companyId y schema en JWT payload
   *
   * @param userId - ID del usuario
   * @param email - Email del usuario
   * @param roles - Lista de roles
   * @param companyId - ID de la company (null para usuarios sin company)
   * @param schema - Schema de PostgreSQL (null para public/sin tenant)
   */
  private async generateTokens(
    userId: string,
    email: string,
    roles: string[],
    companyId: string | null = null, // ✅ Nuevo parámetro
    schema: string | null = null, // ✅ Nuevo parámetro
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // ✅ Payload con companyId y schema para multi-tenancy
    const payload: IJwtPayload = {
      sub: userId,
      email,
      roles,
      companyId, // ✅ Incluir companyId
      schema, // ✅ Incluir schema
    };

    const accessTokenExpiresIn = this.configService.get<number>('jwt.expiresIn') || 900; // 15 min
    const refreshTokenExpiresIn = this.configService.get<number>('jwt.refreshExpiresIn') || 604800; // 7 days

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(
        { ...payload, tokenId: this.utils.generateId() },
        {
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
    };
  }

  /**
   * Crear sesión en base de datos
   */
  private async createSession(
    userId: string,
    refreshToken: string,
    expiresIn: number,
    ipAddress: string,
    userAgent?: string,
  ): Promise<SessionEntity> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return await this.authRepository.createSession({
      user_id: userId,
      refresh_token: refreshToken,
      refresh_token_family: this.utils.generateId(), // ✅ UUIDv7 para detectar token reuse
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent || null,
      is_active: true,
    });
  }

  /**
   * Generar token de reset de contraseña
   */
  private generateResetToken(userId: string): string {
    return this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get<string>('jwt.resetSecret'),
        expiresIn: '1h',
      },
    );
  }

  /**
   * Validar estado del usuario
   */
  private validateUserStatus(user: {
    isActive: boolean;
    status: string;
    lockedUntil?: Date | null;
  }): void {
    if (!user.isActive) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.USER_INACTIVE,
        ERROR_CODES.AUTH_USER_INACTIVE,
      );
    }

    if (user.status === 'suspended') {
      this.handleError.unauthorized(RESPONSE_MESSAGES.AUTH.FORBIDDEN, ERROR_CODES.AUTH_FORBIDDEN);
    }

    if (user.status === 'blocked') {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.USER_LOCKED,
        ERROR_CODES.AUTH_USER_LOCKED,
      );
    }

    // ✅ Formatear fecha cuando usuario está bloqueado temporalmente
    if (user.lockedUntil && this.utils.date.isFuture(user.lockedUntil)) {
      const formatted = this.utils.date.formatDateTime(user.lockedUntil);
      const timeUntil = this.utils.date.timeUntil(user.lockedUntil);

      this.handleError.unauthorized(
        `Usuario bloqueado hasta ${formatted} (${timeUntil})`,
        ERROR_CODES.AUTH_USER_LOCKED,
      );
    }
  }

  /**
   * Convertir SessionEntity a ISessionInfo
   */
  private toSessionInfo(session: SessionEntity): ISessionInfo {
    return {
      id: session.id,
      userAgent: session.user_agent || 'Unknown',
      ipAddress: session.ip_address,
      createdAt: session.created_at,
      lastActivityAt: session.last_activity_at,
      expiresAt: session.expires_at,
      isCurrent: false, // El controller determinará cuál es la actual
    };
  }
}
