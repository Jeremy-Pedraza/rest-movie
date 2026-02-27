// src/modules/user/user.service.ts

/**
 * @fileoverview Service para usuarios
 * @module modules/user
 *
 * Integra:
 * - SanitizerService: SanitizaciÃ³n de inputs
 * - HandleErrorService: Manejo centralizado de errores
 * - TransactionService: Transacciones de BD (disponible para operaciones complejas)
 * - CacheService: Cache inteligente con tags e invalidaciÃ³n
 * - SchemaContext: Contexto multi-tenant para cache keys (SesiÃ³n 22)
 *
 * âœ… FASE 4 (SesiÃ³n 22): Cache keys incluyen schema para multi-tenant
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { CacheService } from '@modules/cache';
import { LoggerService, LogContext } from '@modules/logger';
import { HandleErrorService, IPaginatedResponse, SanitizerService } from '@shared/common';
import { SchemaContext, TransactionService } from '@shared/database';
import { UtilsService } from '@shared/utils';
import { UpdatePasswordDto, CreateUserDto, QueryUserDto, UpdateUserDto } from './dto';
import { UserEntity, UserStatus } from './entities/user.entity';
import { IUserProfileResponse, IUserResponse } from './interfaces';
import { UserRepository } from './user.repository';
import {
  sanitizeCreateUserDto,
  sanitizeUpdateUserDto,
  sanitizeUserProfileDto,
} from './sanitizers/user.sanitizer';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly handleError: HandleErrorService,
    private readonly userRepository: UserRepository,
    private readonly utilsService: UtilsService,
    private readonly sanitizer: SanitizerService,
    private readonly cacheService: CacheService, // âœ… Cache inteligente
    private readonly utils: UtilsService, // âœ… Utilidades (validaciÃ³n, formateo, crypto)
    private readonly schemaContext: SchemaContext, // âœ… FASE 4: Contexto multi-tenant
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  // ============================================
  // CACHE HELPERS (FASE 4 - SesiÃ³n 22)
  // ============================================

  /**
   * Obtiene el schema actual para cache keys
   * @returns Schema actual o 'public'
   */
  private getCurrentSchema(): string {
    return this.schemaContext.getSchema();
  }

  /**
   * Construye cache key con schema
   * @param parts - Partes de la key
   * @returns Key con formato: user:{schema}:{parts}
   */
  private buildCacheKey(...parts: string[]): string {
    const schema = this.getCurrentSchema();
    return `user:${schema}:${parts.join(':')}`;
  }

  /**
   * Construye tag con schema
   * @param tag - Nombre del tag
   * @returns Tag con formato: {tag}:{schema}
   */
  private buildTag(tag: string): string {
    const schema = this.getCurrentSchema();
    return `${tag}:${schema}`;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Crea un nuevo usuario
   * @param dto - Datos del usuario
   * @returns Usuario creado
   */
  async create(dto: CreateUserDto): Promise<IUserResponse> {
    // âœ… FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(dto.email)) {
      this.handleError.badRequest('Email invÃ¡lido', 'email');
    }

    // âœ… FASE 2: Validar fortaleza de password
    const passwordValidation = this.utils.validation.validatePassword(dto.password);
    if (!passwordValidation.isValid) {
      this.handleError.badRequest(
        `Password dÃ©bil: ${passwordValidation.errors.join(', ')}`,
        'password',
      );
    }

    // Sanitizar inputs
    const sanitizedDto = this.sanitizeCreateDto(dto);

    // Verificar si el email ya existe
    const emailExists = await this.userRepository.emailExists(sanitizedDto.email);
    if (emailExists) {
      this.handleError.conflict('El email ya estÃ¡ registrado', 'email');
    }

    try {
      const user = await this.userRepository.create(sanitizedDto);

      // âœ… FASE 3: Log con email enmascarado (GDPR/Privacidad)
      const maskedEmail = this.utils.string.maskEmail(user.email);
      this.logger.log(`User created: ${user.id} (${maskedEmail})`);

      // âœ… FASE 4: Invalidar cache de stats con tags que incluyen schema
      await this.cacheService.invalidateTags([this.buildTag('users'), this.buildTag('user-stats')]);

      return this.toUserResponse(user);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando usuario');
    }
  }

  /**
   * Busca un usuario por ID
   * @param id - ID del usuario
   * @returns Usuario encontrado
   *
   * âœ… FASE 4 (SesiÃ³n 22): Cache key incluye schema: user:{schema}:{id}
   * TTL: 1h, Tags: ['users:{schema}', 'user:{schema}:{id}']
   */
  async findById(id: string): Promise<IUserResponse> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    const schema = this.getCurrentSchema();

    // âœ… FASE 4: Key con schema para aislamiento multi-tenant
    const cacheKey = this.buildCacheKey(id);

    // remember() = obtener del cache o ejecutar callback
    return await this.cacheService.remember(
      cacheKey,
      async () => {
        // Callback si no existe
        const user = await this.userRepository.findById(id);
        if (!user) {
          this.handleError.notFound('Usuario', id);
        }
        return this.toUserResponse(user);
      },
      {
        ttl: 3600, // 1 hora
        tags: [
          this.buildTag('users'), // users:{schema}
          `user:${schema}:${id}`, // user:{schema}:{id}
        ],
      },
    );
  }

  /**
   * Busca un usuario por email
   * @param email - Email del usuario
   * @returns Usuario encontrado
   */
  async findByEmail(email: string): Promise<IUserResponse> {
    // âœ… FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(email)) {
      this.handleError.badRequest('Email invÃ¡lido', 'email');
    }

    const sanitizedEmail = this.sanitizer.sanitizeEmail(email);
    const user = await this.userRepository.findByEmail(sanitizedEmail);
    if (!user) {
      this.handleError.notFound('Usuario');
    }
    return this.toUserResponse(user);
  }

  /**
   * Busca usuarios con filtros y paginaciÃ³n
   * @param query - Filtros de bÃºsqueda
   * @returns Usuarios paginados
   */
  async findAll(query: QueryUserDto): Promise<IPaginatedResponse<IUserResponse>> {
    // âœ… FASE 3: Sanitizar + Normalizar bÃºsqueda para mejores resultados
    if (query.search) {
      query.search = this.sanitizer.sanitizeString(query.search);
      // Normalizar: quitar acentos, convertir a minÃºsculas, limpiar espacios
      query.search = this.utils.string.normalizeForSearch(query.search);
    }

    let result = await this.userRepository.findAll(query);
    result = this.utilsService.removeTimestamps(result);
    return {
      data: result.data.map((user) => this.toUserResponse(user)),
      meta: result.meta,
    };
  }

  /**
   * Actualiza un usuario
   * @param id - ID del usuario
   * @param dto - Datos a actualizar
   * @returns Usuario actualizado
   */
  async update(id: string, dto: UpdateUserDto): Promise<IUserResponse> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    // âœ… FASE 1: Validar email si se estÃ¡ actualizando
    if (dto.email && !this.utils.validation.isEmail(dto.email)) {
      this.handleError.badRequest('Email invÃ¡lido', 'email');
    }

    // Verificar que el usuario existe
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      this.handleError.notFound('Usuario', id);
    }

    // Sanitizar inputs
    const sanitizedDto = this.sanitizeUpdateDto(dto);

    // Verificar email duplicado si se estÃ¡ cambiando
    if (sanitizedDto.email && sanitizedDto.email !== existingUser.email) {
      const emailExists = await this.userRepository.emailExists(sanitizedDto.email, id);
      if (emailExists) {
        this.handleError.conflict('El email ya estÃ¡ registrado', 'email');
      }
    }

    try {
      const user = await this.userRepository.update(id, sanitizedDto);
      if (!user) {
        this.handleError.notFound('Usuario', id);
      }
      this.logger.log(`User updated: ${user.id}`);

      // âœ… FASE 4: Invalidar cache con tags que incluyen schema
      const schema = this.getCurrentSchema();
      await this.cacheService.invalidateTags([
        `user:${schema}:${id}`, // user:{schema}:{id}
        this.buildTag('users'), // users:{schema}
        this.buildTag('user-stats'), // user-stats:{schema}
      ]);

      return this.toUserResponse(user);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando usuario');
    }
  }

  /**
   * Elimina un usuario (soft delete)
   * @param id - ID del usuario
   */
  async softDelete(id: string): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);
    }

    const deleted = await this.userRepository.softDelete(id);
    if (!deleted) {
      this.handleError.badRequest('No se pudo eliminar el usuario');
    }

    this.logger.log(`User soft deleted: ${id}`);

    // âœ… FASE 4: Invalidar cache con tags que incluyen schema
    const schema = this.getCurrentSchema();
    await this.cacheService.invalidateTags([
      `user:${schema}:${id}`, // user:{schema}:{id}
      this.buildTag('users'), // users:{schema}
      this.buildTag('user-stats'), // user-stats:{schema}
    ]);
  }

  /**
   * Restaura un usuario eliminado
   * @param id - ID del usuario
   */
  async restore(id: string): Promise<IUserResponse> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    const restored = await this.userRepository.restore(id);
    if (!restored) {
      this.handleError.notFound('Usuario', id);
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);
    }

    this.logger.log(`User restored: ${id}`);

    // âœ… FASE 4: Invalidar cache con tags que incluyen schema
    const schema = this.getCurrentSchema();
    await this.cacheService.invalidateTags([
      `user:${schema}:${id}`, // user:{schema}:{id}
      this.buildTag('users'), // users:{schema}
      this.buildTag('user-stats'), // user-stats:{schema}
    ]);

    return this.toUserResponse(user);
  }

  // ============================================
  // PASSWORD OPERATIONS
  // ============================================

  /**
   * Cambia la contraseÃ±a de un usuario
   * @param id - ID del usuario
   * @param dto - Datos de cambio de contraseÃ±a
   */
  async changePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    // âœ… FASE 2: Validar fortaleza de nueva password
    const passwordValidation = this.utils.validation.validatePassword(dto.newPassword);
    if (!passwordValidation.isValid) {
      this.handleError.badRequest(
        `Password dÃ©bil: ${passwordValidation.errors.join(', ')}`,
        'password',
      );
    }

    // Buscar usuario con password
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      this.handleError.notFound('Usuario', id);
    }

    const user = await this.userRepository.findByEmail(existingUser.email, true);
    if (!user) {
      this.handleError.notFound('Usuario', id);
    }

    // Verificar contraseÃ±a actual
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      this.handleError.badRequest('La contraseÃ±a actual es incorrecta');
    }

    // Hash de la nueva contraseÃ±a
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    const updated = await this.userRepository.updatePassword(id, hashedPassword);
    if (!updated) {
      this.handleError.badRequest('No se pudo actualizar la contraseÃ±a');
    }

    this.logger.log(`Password changed for user: ${id}`);
  }

  // ============================================
  // STATUS OPERATIONS
  // ============================================

  /**
   * Activa un usuario
   * @param id - ID del usuario
   */
  async activate(id: string): Promise<IUserResponse> {
    await this.updateStatusWithValidation(id, UserStatus.ACTIVE, 'activated');
    return this.findById(id);
  }

  /**
   * Desactiva un usuario
   * @param id - ID del usuario
   */
  async deactivate(id: string): Promise<IUserResponse> {
    await this.updateStatusWithValidation(id, UserStatus.INACTIVE, 'deactivated');
    return this.findById(id);
  }

  /**
   * Suspende un usuario
   * @param id - ID del usuario
   */
  async suspend(id: string): Promise<IUserResponse> {
    await this.updateStatusWithValidation(id, UserStatus.SUSPENDED, 'suspended');
    return this.findById(id);
  }

  /**
   * Bloquea un usuario
   * @param id - ID del usuario
   */
  async block(id: string): Promise<IUserResponse> {
    await this.updateStatusWithValidation(id, UserStatus.BLOCKED, 'blocked');
    return this.findById(id);
  }

  // ============================================
  // PROFILE OPERATIONS
  // ============================================

  /**
   * Obtiene el perfil completo de un usuario
   * @param id - ID del usuario
   * @returns Perfil del usuario
   */
  async getProfile(id: string): Promise<IUserProfileResponse> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);
    }
    return this.toUserProfileResponse(user);
  }

  /**
   * Actualiza el perfil de un usuario (solo campos permitidos)
   * @param id - ID del usuario
   * @param dto - Datos a actualizar
   * @returns Perfil actualizado
   */
  async updateProfile(
    id: string,
    dto: Pick<UpdateUserDto, 'firstName' | 'lastName' | 'phone' | 'avatar' | 'preferences'>,
  ): Promise<IUserProfileResponse> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    // Sanitizar inputs del perfil
    const sanitizedDto = this.sanitizeProfileDto(dto);

    const user = await this.userRepository.update(id, sanitizedDto);
    if (!user) {
      this.handleError.notFound('Usuario', id);
    }
    return this.toUserProfileResponse(user);
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Obtiene estadÃ­sticas de usuarios
   * @returns EstadÃ­sticas
   *
   * âœ… FASE 4 (SesiÃ³n 22): Cache key incluye schema: user:{schema}:stats
   * TTL: 5min, Tags: ['user-stats:{schema}', 'users:{schema}']
   */
  async getStats(): Promise<Record<string, unknown>> {
    // âœ… FASE 4: Key con schema para aislamiento multi-tenant
    const cacheKey = this.buildCacheKey('stats');

    return await this.cacheService.remember(
      cacheKey,
      async () => {
        const [total, byStatus] = await Promise.all([
          this.userRepository.count(),
          this.userRepository.countByStatus(),
        ]);

        return {
          total,
          byStatus,
        };
      },
      {
        ttl: 300, // 5 minutos (stats cambian poco)
        tags: [
          this.buildTag('user-stats'), // user-stats:{schema}
          this.buildTag('users'), // users:{schema}
        ],
      },
    );
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Sanitiza los datos de creaciÃ³n de usuario
   */
  private sanitizeCreateDto(dto: CreateUserDto): CreateUserDto {
    return sanitizeCreateUserDto(this.sanitizer, dto);
  }

  /**
   * Sanitiza los datos de actualizaciÃ³n de usuario
   */
  private sanitizeUpdateDto(dto: UpdateUserDto): UpdateUserDto {
    return sanitizeUpdateUserDto(this.sanitizer, dto);
  }

  /**
   * Sanitiza los datos de actualizaciÃ³n de perfil de usuario.
   */
  private sanitizeProfileDto(
    dto: Pick<UpdateUserDto, 'firstName' | 'lastName' | 'phone' | 'avatar' | 'preferences'>,
  ): Pick<UpdateUserDto, 'firstName' | 'lastName' | 'phone' | 'avatar' | 'preferences'> {
    return sanitizeUserProfileDto(this.sanitizer, dto);
  }

  /**
   * Actualiza el status con validaciÃ³n previa
   */
  private async updateStatusWithValidation(
    id: string,
    status: UserStatus,
    action: string,
  ): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);
    }

    await this.userRepository.updateStatus(id, status);
    this.logger.log(`User ${action}: ${id}`);

    // âœ… FASE 4: Invalidar cache con tags que incluyen schema
    const schema = this.getCurrentSchema();
    await this.cacheService.invalidateTags([
      `user:${schema}:${id}`, // user:{schema}:{id}
      this.buildTag('users'), // users:{schema}
      this.buildTag('user-stats'), // user-stats:{schema}
    ]);
  }

  /**
   * Convierte entidad a respuesta de usuario
   */
  private toUserResponse(user: UserEntity): IUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      emailVerified: user.email_verified,
      lastLoginAt: user.last_login_at,
      roles:
        user.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Convierte entidad a respuesta de perfil
   */
  private toUserProfileResponse(user: UserEntity): IUserProfileResponse {
    return {
      ...this.toUserResponse(user),
      metadata: user.metadata,
      preferences: user.preferences,
    };
  }

  // ============================================
  // AUTH SPECIFIC METHODS (para AuthService)
  // ============================================

  /**
   * Busca un usuario por email incluyendo password
   * âš ï¸ Solo para uso interno de autenticaciÃ³n
   * âš ï¸ NO usa cache (se ejecuta antes de establecer contexto)
   * @param email - Email del usuario
   * @returns Usuario con password o null
   */
  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    // âœ… FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(email)) {
      this.handleError.badRequest('Email invÃ¡lido', 'email');
    }

    const sanitizedEmail = this.sanitizer.sanitizeEmail(email);
    return await this.userRepository.findByEmail(sanitizedEmail, true);
  }

  /**
   * Busca un usuario por ID incluyendo password
   * âš ï¸ Solo para uso interno de autenticaciÃ³n
   * âš ï¸ NO usa cache (datos sensibles)
   * @param id - ID del usuario
   * @returns Usuario con password o null
   */
  async findByIdWithPassword(id: string): Promise<UserEntity | null> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    return await this.userRepository.findByIdWithPassword(id);
  }

  /**
   * Busca un usuario por ID incluyendo roles completos
   * âš ï¸ NO usa cache (se usa en auth)
   * @param id - ID del usuario
   * @returns Usuario con roles y permisos o null
   */
  async findByIdWithRoles(id: string): Promise<UserEntity | null> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    return await this.userRepository.findByIdWithRoles(id);
  }

  /**
   * Busca un usuario por ID incluyendo company, roles y permisos completos
   * âš ï¸ Solo para uso interno de autenticaciÃ³n (JwtStrategy)
   * âš ï¸ NO usa cache aquÃ­ (AuthService maneja su propio cache)
   *
   * @param id - ID del usuario
   * @returns Usuario con company, roles y permisos o null
   */
  async findByIdWithCompanyAndRoles(id: string): Promise<UserEntity | null> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    const data = await this.userRepository.findByIdWithCompanyAndRoles(id);
    return data;
  }

  /**
   * Verifica si un email existe
   * @param email - Email a verificar
   * @returns true si existe
   */
  async existsByEmail(email: string): Promise<boolean> {
    // âœ… FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(email)) {
      this.handleError.badRequest('Email invÃ¡lido', 'email');
    }

    const sanitizedEmail = this.sanitizer.sanitizeEmail(email);
    return await this.userRepository.emailExists(sanitizedEmail);
  }

  /**
   * Incrementa los intentos fallidos de login
   * @param id - ID del usuario
   */
  async incrementFailedAttempts(id: string): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    await this.userRepository.registerFailedLogin(id);
    this.logWarn(`Failed login attempt registered for user: ${id}`);
  }

  /**
   * Resetea los intentos fallidos de login
   * @param id - ID del usuario
   */
  async resetFailedAttempts(id: string): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    await this.userRepository.resetFailedAttempts(id);
  }

  /**
   * Actualiza la fecha de Ãºltimo login
   * @param id - ID del usuario
   * @param ip - IP del cliente (opcional)
   */
  async updateLastLogin(id: string, ip?: string): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    await this.userRepository.registerLogin(id, ip);
  }

  /**
   * Actualiza la contraseÃ±a de un usuario
   * âš ï¸ Esta funciÃ³n NO valida la contraseÃ±a actual
   * @param id - ID del usuario
   * @param newPassword - Nueva contraseÃ±a en texto plano (serÃ¡ hasheada)
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    // âœ… FASE 2: Validar fortaleza de password
    const passwordValidation = this.utils.validation.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      this.handleError.badRequest(
        `Password dÃ©bil: ${passwordValidation.errors.join(', ')}`,
        'password',
      );
    }

    // Hash de la nueva contraseÃ±a
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updated = await this.userRepository.updatePassword(id, hashedPassword);
    if (!updated) {
      this.handleError.notFound('Usuario', id);
    }

    this.logger.log(`Password updated for user: ${id}`);
  }

  /**
   * Guarda token de reset de contraseÃ±a
   * @param id - ID del usuario
   * @param token - Token de reset (JWT)
   */
  async savePasswordResetToken(id: string, token: string): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    // El token expira en 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.userRepository.savePasswordResetToken(id, token, expiresAt);
    this.logger.log(`Password reset token saved for user: ${id}`);
  }

  /**
   * Obtiene los datos de reset token de un usuario
   * @param id - ID del usuario
   * @returns Datos del reset token o null
   */
  async getPasswordResetData(
    id: string,
  ): Promise<{ password_reset_token: string | null; password_reset_expires: Date | null } | null> {
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    return await this.userRepository.getPasswordResetData(id);
  }

  /**
   * Invalida el token de reset de contraseÃ±a
   * @param id - ID del usuario
   */
  async invalidatePasswordResetToken(id: string): Promise<void> {
    // âœ… FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario invÃ¡lido', 'id');
    }

    await this.userRepository.invalidatePasswordResetToken(id);
    this.logger.log(`Password reset token invalidated for user: ${id}`);
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.BUSINESS,
      service: UserService.name,
    });
  }

  private logError(message: string): void {
    this.logger.error(message);
    void this.loggerService?.error(message, {
      context: LogContext.BUSINESS,
      service: UserService.name,
    });
  }
}
