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
import { v4 as uuidv4 } from 'uuid';

import { SanitizerService, HandleErrorService } from '@shared/common';
import { UserService } from '@modules/user';
import { ROLES } from '@constants/roles.constant';

import { AuthRepository } from './auth.repository';
import { SessionEntity } from './entities';
import {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import {
  IAuthResponse,
  IRefreshTokenResponse,
  ILogoutResponse,
  IPasswordChangeResponse,
  IForgotPasswordResponse,
  IResetPasswordResponse,
  ISessionInfo,
  IJwtPayload,
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
  ) {}

  // ============================================
  // AUTENTICACIÓN
  // ============================================

  /**
   * Login de usuario
   */
  async login(dto: LoginDto, ipAddress: string, userAgent?: string): Promise<IAuthResponse> {
    // 1. Sanitizar email
    const email = this.sanitizer.sanitizeEmail(dto.email);

    // 2. Buscar usuario por email
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) {
      this.handleError.unauthorized('Credenciales inválidas', 'AUTH_1001');
    }

    // 3. Verificar estado del usuario
    this.validateUserStatus(user);

    // 4. Verificar contraseña
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.userService.incrementFailedAttempts(user.id);
      this.handleError.unauthorized('Credenciales inválidas', 'AUTH_1001');
    }

    // 5. Resetear intentos fallidos
    await this.userService.resetFailedAttempts(user.id);

    // 6. Actualizar último login
    await this.userService.updateLastLogin(user.id);

    // 7. Generar tokens
    const tokens = await this.generateTokens(user.id, user.email, user.roles);

    // 8. Crear sesión
    await this.createSession(
      user.id,
      tokens.refreshToken,
      tokens.expiresIn,
      ipAddress,
      userAgent,
    );

    // 9. Retornar respuesta (sin password)
    const userResponse = await this.userService.findById(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Registro de nuevo usuario
   */
  async register(
    dto: RegisterDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<IAuthResponse> {
    // 1. Sanitizar inputs
    const sanitizedDto = {
      email: this.sanitizer.sanitizeEmail(dto.email),
      password: dto.password, // No sanitizar password
      firstName: this.sanitizer.sanitizeString(dto.firstName),
      lastName: this.sanitizer.sanitizeString(dto.lastName),
      phone: dto.phone ? this.sanitizer.sanitizeString(dto.phone) : undefined,
    };

    // 2. Verificar que el email no exista
    const exists = await this.userService.existsByEmail(sanitizedDto.email);
    if (exists) {
      this.handleError.conflict('El email ya está registrado', 'email');
    }

    // 3. Crear usuario con rol USER por defecto
    const user = await this.userService.create({
      ...sanitizedDto,
      roles: [ROLES.USER],
    });

    // 4. Generar tokens
    const tokens = await this.generateTokens(user.id, user.email, [ROLES.USER]);

    // 5. Crear sesión
    await this.createSession(
      user.id,
      tokens.refreshToken,
      tokens.expiresIn,
      ipAddress,
      userAgent,
    );

    this.logger.log(`User registered: ${user.email}`);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Refresh token con rotación
   */
  async refreshToken(
    dto: RefreshTokenDto,
    ipAddress: string,
    userAgent?: string,
  ): Promise<IRefreshTokenResponse> {
    // 1. Buscar sesión por refresh token
    const session = await this.authRepository.findByRefreshToken(dto.refreshToken);

    if (!session) {
      this.handleError.unauthorized('Refresh token inválido', 'AUTH_1003');
    }

    // 2. Verificar que la sesión sea válida
    if (!session.isValid()) {
      await this.authRepository.revokeSession(session.id, 'Sesión inválida');
      this.handleError.unauthorized('Sesión expirada o inválida', 'AUTH_1002');
    }

    // 3. Verificar token reuse (seguridad)
    if (session.isRevoked) {
      // Token fue reusado - revocar toda la familia de tokens
      await this.authRepository.revokeAllByUserId(
        session.userId,
        'Token reuse detected',
      );
      this.handleError.unauthorized('Token comprometido detectado', 'AUTH_1003');
    }

    // 4. Verificar estado del usuario
    const user = await this.userService.findByIdWithRoles(session.userId);
    if (!user) {
      await this.authRepository.revokeSession(session.id);
      this.handleError.unauthorized('Usuario no encontrado', 'AUTH_1010');
    }

    this.validateUserStatus(user);

    // 5. Generar nuevos tokens (rotación)
    const newTokens = await this.generateTokens(user.id, user.email, user.roles);

    // 6. Actualizar sesión con nuevo refresh token
    await this.authRepository.updateRefreshToken(
      session.id,
      newTokens.refreshToken,
      new Date(Date.now() + newTokens.expiresIn * 1000),
    );

    this.logger.log(`Token refreshed for user: ${user.email}`);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: newTokens.expiresIn,
    };
  }

  /**
   * Logout - revocar sesión actual
   */
  async logout(refreshToken: string): Promise<ILogoutResponse> {
    const revoked = await this.authRepository.revokeByRefreshToken(
      refreshToken,
      'User logout',
    );

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
    const revokedCount = await this.authRepository.revokeAllByUserId(
      userId,
      'Logout all sessions',
    );

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
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<IPasswordChangeResponse> {
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
    const email = this.sanitizer.sanitizeEmail(dto.email);

    // 1. Buscar usuario (no revelar si existe o no por seguridad)
    const user = await this.userService.findByEmail(email);

    if (user) {
      // 2. Generar token de reset (válido por 1 hora)
      const resetToken = this.generateResetToken(user.id);

      // 3. Aquí iría la lógica para enviar el email con el token
      // await this.notificationService.sendPasswordResetEmail(user.email, resetToken);

      // 4. Guardar token en metadata del usuario o en tabla separada
      await this.userService.savePasswordResetToken(user.id, resetToken);

      this.logger.log(`Password reset requested for: ${email}`);
    } else {
      // Por seguridad, no revelar que el usuario no existe
      this.logger.warn(`Password reset attempted for non-existent user: ${email}`);
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
    } catch (error) {
      this.handleError.unauthorized('Token de reset inválido o expirado', 'AUTH_1003');
    }

    // 2. Verificar que el token no haya expirado
    if (payload.exp * 1000 < Date.now()) {
      this.handleError.unauthorized('Token de reset expirado', 'AUTH_1002');
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

    if (session.userId !== userId) {
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
   */
  private async generateTokens(
    userId: string,
    email: string,
    roles: string[],
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: IJwtPayload = {
      sub: userId,
      email,
      roles,
    };

    const accessTokenExpiresIn = this.configService.get<number>('jwt.expiresIn') || 900; // 15 min
    const refreshTokenExpiresIn = this.configService.get<number>('jwt.refreshExpiresIn') || 604800; // 7 days

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(
        { ...payload, tokenId: uuidv4() },
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
      userId,
      refreshToken,
      refreshTokenFamily: uuidv4(), // Para detectar token reuse
      expiresAt,
      ipAddress,
      userAgent: userAgent || null,
      isActive: true,
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
  private validateUserStatus(user: any): void {
    if (!user.isActive) {
      this.handleError.unauthorized('Usuario inactivo', 'AUTH_1011');
    }

    if (user.status === 'suspended') {
      this.handleError.unauthorized('Usuario suspendido', 'AUTH_1011');
    }

    if (user.status === 'blocked') {
      this.handleError.unauthorized('Usuario bloqueado', 'AUTH_1011');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.handleError.unauthorized(
        `Usuario bloqueado hasta ${user.lockedUntil.toISOString()}`,
        'AUTH_1011',
      );
    }
  }

  /**
   * Convertir SessionEntity a ISessionInfo
   */
  private toSessionInfo(session: SessionEntity): ISessionInfo {
    return {
      id: session.id,
      userAgent: session.userAgent || 'Unknown',
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isCurrent: false, // El controller determinará cuál es la actual
    };
  }
}
