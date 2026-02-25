// src/modules/auth/auth.service.ts

/**
 * @fileoverview Service para autenticación y gestión de sesiones
 * @module modules/auth
 *
 * ✅ FASE 1: Cache de usuario autenticado en login/refresh (TTL 55min)
 * ✅ FASE 2: Logging de cache hit/miss para monitoreo
 *
 * ⚠️ REGLAS:
 * - SIEMPRE inyectar SanitizerService y HandleErrorService
 * - Sanitizar todos los inputs
 * - Usar HandleErrorService para errores consistentes
 * - NO tiene try-catch en métodos públicos (AllExceptionsFilter lo maneja)
 * - Contiene TODA la lógica de negocio
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { ERROR_CODES, RESPONSE_MESSAGES, ROLES } from '@constants';
import { EmailProducer } from '@modules/queue';
import { UserService } from '@modules/user';
import { LoggerService, LogContext } from '@modules/logger';
import { HandleErrorService, SanitizerService } from '@shared/common';
import { RedisService } from '@shared/redis';
import { UtilsService } from '@shared/utils';

// ============================================
// CACHE CONSTANTS
// ============================================

/**
 * TTL del cache de usuario autenticado: 55 minutos
 * (5 min menos que JWT de 60min para evitar edge cases)
 */
const AUTH_USER_CACHE_TTL = 3300;

/** Prefijo para cache de usuario autenticado */
const AUTH_CACHE_PREFIX = 'auth';

/** Prefijo para cache de sesión (usado en JwtStrategy) */
const SESSION_CACHE_PREFIX = 'session';

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
    private readonly redisService: RedisService, // ✅ Cache de autenticación
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * Login de usuario
   *
   * ✅ FASE 4: ACTUALIZADO para incluir companyId y schema en JWT
   */
  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent?: string,
    location?: string,
  ): Promise<IAuthResponse> {
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
    await this.userService.updateLastLogin(user.id, ipAddress);

    // 8. Cargar usuario completo con company y roles para el token (CON CACHE)
    // ✅ FASE 2: Usa helper con logging de cache hit/miss
    const fullUser = await this.getCachedUserWithCompany(user.id, 'login');

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
      fullUser.roles.map((r: { name: string }) => r.name),
      fullUser.company_id,
      fullUser.company?.schema || null,
      this.getPrimaryStoreId(fullUser),
    );

    // 10. Crear sesión (usa TTL del refresh token, no del access token)
    await this.createSession(
      fullUser.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresIn,
      ipAddress,
      userAgent,
      location,
      tokens.jti,
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
  async register(
    dto: RegisterDto,
    ipAddress: string,
    userAgent?: string,
    location?: string,
  ): Promise<IAuthResponse> {
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
      null, // ✅ sin tienda asignada en registro
    );

    // 7. Crear sesión (usa TTL del refresh token, no del access token)
    await this.createSession(
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiresIn,
      ipAddress,
      userAgent,
      location,
      tokens.jti,
    );

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
    // 1. Decodificar token para obtener jti y schema
    const decoded = this.jwtService.decode(dto.refreshToken);
    if (!decoded || !decoded.jti) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID,
      );
    }

    const knownSchema = decoded?.schema || null;

    // 2. Buscar sesión por JTI (identificador único del token)
    const session = await this.authRepository.findByTokenJti(decoded.jti);

    if (!session) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID,
      );
    }

    // 3. Detección de reuse: si el token ya fue consumido o revocado => atacante
    if (session.consumed_at || session.is_revoked) {
      // Token fue reusado - revocar TODA la familia de tokens
      if (session.refresh_token_family) {
        await this.authRepository.revokeByFamily(
          session.refresh_token_family,
          'Token reuse detected - family revoked',
        );
      }
      this.logWarn(
        `Token reuse detected for user: ${session.user_id}, family: ${session.refresh_token_family}`,
      );
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID,
      );
    }

    // 4. Verificar que la sesión sea válida (no expirada)
    if (!session.isValid()) {
      await this.authRepository.revokeSession(session.id, 'Sesión inválida');
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.SESSION_EXPIRED,
        ERROR_CODES.AUTH_SESSION_EXPIRED,
      );
    }

    // 5. Verificar estado del usuario y cargar company (CON CACHE + SCHEMA)
    const user = await this.getCachedUserWithCompany(session.user_id, 'refresh', knownSchema);
    if (!user) {
      await this.authRepository.revokeSession(session.id);
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.USER_NOT_FOUND,
        ERROR_CODES.AUTH_USER_NOT_FOUND,
      );
    }

    this.validateUserStatus(user);

    // 6. Generar nuevos tokens con companyId y schema (rotación)
    const newTokens = await this.generateTokens(
      user.id,
      user.email,
      user.roles.map((r: { name: string }) => r.name),
      user.company_id,
      user.company?.schema || null,
      this.getPrimaryStoreId(user),
    );

    // 7. Consumir el token actual (marcarlo como usado)
    await this.authRepository.consumeSession(session.id);

    // 8. Crear nueva sesión en la misma familia con el nuevo token
    await this.createSession(
      user.id,
      newTokens.refreshToken,
      newTokens.refreshTokenExpiresIn,
      session.ip_address,
      session.user_agent || undefined,
      session.location || undefined,
      newTokens.jti,
      session.refresh_token_family || undefined, // Misma familia
      session.id, // Parent = sesión actual consumida
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
  async logout(userId: string, refreshToken: string): Promise<ILogoutResponse> {
    // 1. Buscar sesión por refresh token (hasheado)
    const hashedToken = this.hashToken(refreshToken);
    const session = await this.authRepository.findByRefreshToken(hashedToken);

    if (!session) {
      this.handleError.notFound('Sesión', 'no encontrada');
    }

    // 2. Validar ownership: la sesión debe pertenecer al usuario autenticado
    if (session.user_id !== userId) {
      this.handleError.forbidden('No tienes permiso para cerrar esta sesión');
    }

    // 3. Revocar la sesión
    await this.authRepository.revokeSession(session.id, 'User logout');

    this.logger.log(`User logged out: ${userId}`);

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

    // ✅ FASE 1: Invalidar cache de autenticación
    await this.invalidateUserAuthCache(userId);

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

    // ✅ FASE 1: Invalidar cache de autenticación
    await this.invalidateUserAuthCache(userId);

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

      // 5. Guardar hash del token (nunca texto plano)
      await this.userService.savePasswordResetToken(user.id, this.hashToken(resetToken));

      // ✅ Log con email enmascarado (GDPR/Privacidad)
      const maskedEmail = this.utils.string.maskEmail(email);
      this.logger.log(`Password reset requested for: ${maskedEmail} - Email enqueued`);
    } else {
      // ✅ Por seguridad, no revelar que el usuario no existe
      // Log enmascarado para proteger privacidad
      const maskedEmail = this.utils.string.maskEmail(email);
      this.logWarn(`Password reset attempted for non-existent user: ${maskedEmail}`);
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
    // 1. Verificar y decodificar token (firma JWT)
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

    // 2. Verificar que el token no haya expirado (JWT)
    if (payload.exp * 1000 < Date.now()) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_EXPIRED,
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
      );
    }

    // 3. Validar contra persistencia (one-time use)
    const resetData = await this.userService.getPasswordResetData(payload.userId);

    if (!resetData || !resetData.password_reset_token) {
      // Token ya fue usado o no existe
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_TOKEN_INVALID,
      );
    }

    // 4. Comparar hash del token recibido con el almacenado
    const hashedToken = this.hashToken(dto.token);
    if (hashedToken !== resetData.password_reset_token) {
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_INVALID,
        ERROR_CODES.AUTH_TOKEN_INVALID,
      );
    }

    // 5. Verificar expiración en BD (doble check)
    if (resetData.password_reset_expires && resetData.password_reset_expires < new Date()) {
      await this.userService.invalidatePasswordResetToken(payload.userId);
      this.handleError.unauthorized(
        RESPONSE_MESSAGES.AUTH.TOKEN_EXPIRED,
        ERROR_CODES.AUTH_TOKEN_EXPIRED,
      );
    }

    // 6. Actualizar contraseña
    await this.userService.updatePassword(payload.userId, dto.password);

    // 7. Invalidar token de reset (one-time use - atómico)
    await this.userService.invalidatePasswordResetToken(payload.userId);

    // 5. Revocar todas las sesiones por seguridad
    await this.authRepository.revokeAllByUserId(payload.userId, 'Password reset');

    // ✅ FASE 1: Invalidar cache de autenticación
    await this.invalidateUserAuthCache(payload.userId);

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
   * Hashea un token usando SHA-256 para almacenamiento seguro
   */
  private hashToken(token: string): string {
    return this.utils.crypto.sha256(token);
  }

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
   * @param storeId - ID de tienda principal (opcional) para compatibilidad con agentes
   */
  private async generateTokens(
    userId: string,
    email: string,
    roles: string[],
    companyId: string | null = null, // ✅ Nuevo parámetro
    schema: string | null = null, // ✅ Nuevo parámetro
    storeId: string | null = null, // ✅ Compatibilidad con agente
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshTokenExpiresIn: number;
    jti: string;
  }> {
    // ✅ Payload con companyId y schema para multi-tenancy
    const payload: IJwtPayload = {
      sub: userId,
      email,
      roles,
      companyId,
      schema,
      // Claim canónico de tienda según estándar interno (camelCase)
      storeId: storeId,
    };

    const accessTokenExpiresIn = this.configService.get<number>('jwt.expiresIn') || 900; // 15 min
    const refreshTokenExpiresIn = this.configService.get<number>('jwt.refreshExpiresIn') || 604800; // 7 days

    // Generar JTI único para el refresh token (detección de reuse)
    const jti = this.utils.generateId();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(
        { ...payload, jti },
        {
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
      refreshTokenExpiresIn,
      jti,
    };
  }

  /**
   * Crear sesión en base de datos
   */
  private async createSession(
    userId: string,
    refreshToken: string,
    refreshTokenExpiresIn: number,
    ipAddress: string,
    userAgent?: string,
    location?: string,
    tokenJti?: string,
    refreshTokenFamily?: string,
    parentSessionId?: string,
  ): Promise<SessionEntity> {
    const expiresAt = new Date(Date.now() + refreshTokenExpiresIn * 1000);

    return await this.authRepository.createSession({
      user_id: userId,
      refresh_token: this.hashToken(refreshToken),
      refresh_token_family: refreshTokenFamily || this.utils.generateId(),
      token_jti: tokenJti || null,
      parent_session_id: parentSessionId || null,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent || null,
      location: location || null,
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
   * Obtiene una tienda principal para exponerla en el JWT de compatibilidad.
   * Si el usuario no tiene tiendas asignadas retorna null.
   */
  private getPrimaryStoreId(user: any): string | null {
    const firstStore = user?.assigned_stores?.[0];
    return firstStore?.id || null;
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
      createdAt: session.createdAt,
      lastActivityAt: session.last_activity_at,
      expiresAt: session.expires_at,
      isCurrent: false, // El controller determinará cuál es la actual
    };
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Obtiene usuario completo con cache y logging de hit/miss
   *
   * ✅ FASE 3 (Sesión 22): ACTUALIZADO para incluir schema en cache key
   *
   * Estrategia de migración:
   * 1. Si tenemos schema conocido, intentar cache con key nueva (auth:{schema}:user:{id})
   * 2. Si no hay cache, buscar en BD
   * 3. Cachear con schema obtenido de los datos
   * 4. Durante migración: también intentar leer key legacy (auth:user:{id}:full)
   *
   * Key nueva: auth:{schema}:user:{userId}
   * Key legacy: auth:user:{userId}:full
   *
   * @param userId - ID del usuario
   * @param context - Contexto para el log (ej: 'login', 'refresh')
   * @param knownSchema - Schema conocido (opcional, de JWT en refresh)
   * @returns Usuario completo con company y roles
   */
  private async getCachedUserWithCompany(
    userId: string,
    context: string = 'auth',
    knownSchema?: string | null,
  ): Promise<any> {
    // =============================================
    // 1. Si tenemos schema, intentar cache con key nueva
    // =============================================
    if (knownSchema) {
      const newCacheKey = this.redisService.buildKey(
        AUTH_CACHE_PREFIX,
        knownSchema,
        'user',
        userId,
      );
      const cached = await this.redisService.getJson(newCacheKey);

      if (cached) {
        this.logger.debug(`[${context}] Cache HIT for user: ${userId} (schema: ${knownSchema})`);
        return cached;
      }
    }

    // =============================================
    // 2. Intentar leer key legacy (migración gradual)
    // =============================================
    const legacyCacheKey = this.redisService.buildKey(AUTH_CACHE_PREFIX, 'user', userId, 'full');
    const legacyCached = await this.redisService.getJson(legacyCacheKey);

    if (legacyCached) {
      this.logger.debug(`[${context}] Cache HIT (legacy key) for user: ${userId}`);

      // Migrar a nueva key si tenemos schema en los datos
      const legacySchema = legacyCached?.company?.schema;
      if (legacySchema) {
        const newCacheKey = this.redisService.buildKey(
          AUTH_CACHE_PREFIX,
          legacySchema,
          'user',
          userId,
        );
        await this.redisService.setJson(newCacheKey, legacyCached, { ttl: AUTH_USER_CACHE_TTL });
        // Eliminar key legacy
        await this.redisService.del(legacyCacheKey);
        this.logger.debug(
          `[${context}] Migrated cache key to new format (schema: ${legacySchema})`,
        );
      }

      return legacyCached;
    }

    // =============================================
    // 3. Cache MISS - Buscar en BD
    // =============================================
    this.logger.debug(`[${context}] Cache MISS for user: ${userId} - fetching from DB`);

    const user = await this.userService.findByIdWithCompanyAndRoles(userId);

    if (!user) {
      return null;
    }

    // =============================================
    // 4. Cachear con schema obtenido de los datos
    // =============================================
    const userSchema = user.company?.schema || 'public';
    const newCacheKey = this.redisService.buildKey(AUTH_CACHE_PREFIX, userSchema, 'user', userId);

    await this.redisService.setJson(newCacheKey, user, { ttl: AUTH_USER_CACHE_TTL });
    this.logger.debug(
      `[${context}] Cached user: ${userId} (schema: ${userSchema}, TTL: ${AUTH_USER_CACHE_TTL}s)`,
    );

    return user;
  }

  /**
   * Invalida el cache de autenticación de un usuario
   *
   * ✅ FASE 3 (Sesión 22): ACTUALIZADO para invalidar keys con schema
   *
   * Llamar cuando:
   * - Cambia password
   * - Reset password
   * - Logout all
   * - Cambian roles/permisos
   * - Cambia estado del usuario
   *
   * @param userId - ID del usuario
   * @param schema - Schema del tenant (opcional, para cache específico)
   */
  private async invalidateUserAuthCache(userId: string, schema?: string | null): Promise<void> {
    const keysToDelete: string[] = [];

    // =============================================
    // 1. Key legacy (para migración)
    // =============================================
    keysToDelete.push(this.redisService.buildKey(AUTH_CACHE_PREFIX, 'user', userId, 'full'));

    // =============================================
    // 2. Key nueva con schema específico
    // =============================================
    if (schema) {
      keysToDelete.push(this.redisService.buildKey(AUTH_CACHE_PREFIX, schema, 'user', userId));
      keysToDelete.push(this.redisService.buildKey(SESSION_CACHE_PREFIX, schema, 'user', userId));
    }

    // =============================================
    // 3. Eliminar keys conocidas
    // =============================================
    if (keysToDelete.length > 0) {
      const deleted = await this.redisService.del(...keysToDelete);
      if (deleted > 0) {
        this.logger.debug(`Invalidated ${deleted} auth cache keys for user: ${userId}`);
      }
    }

    // =============================================
    // 4. Si no tenemos schema, invalidar por patrón
    // =============================================
    if (!schema) {
      // Patrón para auth keys nuevas: auth:*:user:{userId}
      const authPattern = this.redisService.buildPattern(AUTH_CACHE_PREFIX, '*', 'user', userId);
      const deletedAuth = await this.redisService.invalidatePattern(authPattern);

      // Patrón para session keys: session:*:user:{userId}
      const sessionPattern = this.redisService.buildPattern(
        SESSION_CACHE_PREFIX,
        '*',
        'user',
        userId,
      );
      const deletedSession = await this.redisService.invalidatePattern(sessionPattern);

      const totalDeleted = deletedAuth + deletedSession;
      if (totalDeleted > 0) {
        this.logger.debug(
          `Invalidated ${totalDeleted} cache keys by pattern for user: ${userId} (auth: ${deletedAuth}, session: ${deletedSession})`,
        );
      }
    }
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.AUTH,
      service: AuthService.name,
    });
  }

  private logError(message: string): void {
    this.logger.error(message);
    void this.loggerService?.error(message, {
      context: LogContext.AUTH,
      service: AuthService.name,
    });
  }
}

