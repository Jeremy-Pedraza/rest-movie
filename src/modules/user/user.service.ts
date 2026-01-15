// src/modules/user/user.service.ts

/**
 * @fileoverview Service para usuarios
 * @module modules/user
 *
 * Integra:
 * - SanitizerService: Sanitización de inputs
 * - HandleErrorService: Manejo centralizado de errores
 * - TransactionService: Transacciones de BD (disponible para operaciones complejas)
 * - CacheService: Cache inteligente con tags e invalidación
 */

import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CacheService } from '@modules/cache';
import { HandleErrorService, IPaginatedResponse, SanitizerService } from '@shared/common';
import { TransactionService } from '@shared/database';
import { UtilsService } from '@shared/utils';
import { UpdatePasswordDto, CreateUserDto, QueryUserDto, UpdateUserDto } from './dto';
import { UserEntity, UserStatus } from './entities/user.entity';
import { IUserProfileResponse, IUserResponse } from './interfaces';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
    private readonly transactionService: TransactionService,
    private readonly cacheService: CacheService, // ✅ Cache inteligente
    private readonly utils: UtilsService, // ✅ Utilidades (validación, formateo, crypto)
  ) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Crea un nuevo usuario
   * @param dto - Datos del usuario
   * @returns Usuario creado
   */
  async create(dto: CreateUserDto): Promise<IUserResponse> {
    // ✅ FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(dto.email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    // ✅ FASE 2: Validar fortaleza de password
    const passwordValidation = this.utils.validation.validatePassword(dto.password);
    if (!passwordValidation.isValid) {
      this.handleError.badRequest(
        `Password débil: ${passwordValidation.errors.join(', ')}`,
        'password',
      );
    }

    // Sanitizar inputs
    const sanitizedDto = this.sanitizeCreateDto(dto);

    // Verificar si el email ya existe
    const emailExists = await this.userRepository.emailExists(sanitizedDto.email);
    if (emailExists) {
      this.handleError.conflict('El email ya está registrado', 'email');
    }

    try {
      const user = await this.userRepository.create(sanitizedDto);

      // ✅ FASE 3: Log con email enmascarado (GDPR/Privacidad)
      const maskedEmail = this.utils.string.maskEmail(user.email);
      this.logger.log(`User created: ${user.id} (${maskedEmail})`);

      // Invalidar cache de stats al crear usuario
      await this.cacheService.invalidateTags(['users', 'user-stats']);

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
   * ✅ Con cache: 1h TTL, tags: ['users', 'user:{id}']
   */
  async findById(id: string): Promise<IUserResponse> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    // remember() = obtener del cache o ejecutar callback
    return await this.cacheService.remember(
      `user:${id}`, // Key
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
        tags: ['users', `user:${id}`], // Tags para invalidación
      },
    );
  }

  /**
   * Busca un usuario por email
   * @param email - Email del usuario
   * @returns Usuario encontrado
   */
  async findByEmail(email: string): Promise<IUserResponse> {
    // ✅ FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    const sanitizedEmail = this.sanitizer.sanitizeEmail(email);
    const user = await this.userRepository.findByEmail(sanitizedEmail);
    if (!user) {
      this.handleError.notFound('Usuario');
    }
    return this.toUserResponse(user);
  }

  /**
   * Busca usuarios con filtros y paginación
   * @param query - Filtros de búsqueda
   * @returns Usuarios paginados
   */
  async findAll(query: QueryUserDto): Promise<IPaginatedResponse<IUserResponse>> {
    // ✅ FASE 3: Sanitizar + Normalizar búsqueda para mejores resultados
    if (query.search) {
      query.search = this.sanitizer.sanitizeString(query.search);
      // Normalizar: quitar acentos, convertir a minúsculas, limpiar espacios
      query.search = this.utils.string.normalizeForSearch(query.search);
    }

    const result = await this.userRepository.findAll(query);

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
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    // ✅ FASE 1: Validar email si se está actualizando
    if (dto.email && !this.utils.validation.isEmail(dto.email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    // Verificar que el usuario existe
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      this.handleError.notFound('Usuario', id);
    }

    // Sanitizar inputs
    const sanitizedDto = this.sanitizeUpdateDto(dto);

    // Verificar email duplicado si se está cambiando
    if (sanitizedDto.email && sanitizedDto.email !== existingUser.email) {
      const emailExists = await this.userRepository.emailExists(sanitizedDto.email, id);
      if (emailExists) {
        this.handleError.conflict('El email ya está registrado', 'email');
      }
    }

    try {
      const user = await this.userRepository.update(id, sanitizedDto);
      if (!user) {
        this.handleError.notFound('Usuario', id);
      }
      this.logger.log(`User updated: ${user.id}`);

      // Invalidar cache del usuario actualizado + stats
      await this.cacheService.invalidateTags([`user:${id}`, 'users', 'user-stats']);

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
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
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

    // Invalidar cache del usuario eliminado + stats
    await this.cacheService.invalidateTags([`user:${id}`, 'users', 'user-stats']);
  }

  /**
   * Restaura un usuario eliminado
   * @param id - ID del usuario
   */
  async restore(id: string): Promise<IUserResponse> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
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

    // Invalidar cache del usuario restaurado + stats
    await this.cacheService.invalidateTags([`user:${id}`, 'users', 'user-stats']);

    return this.toUserResponse(user);
  }

  // ============================================
  // PASSWORD OPERATIONS
  // ============================================

  /**
   * Cambia la contraseña de un usuario
   * @param id - ID del usuario
   * @param dto - Datos de cambio de contraseña
   */
  async changePassword(id: string, dto: UpdatePasswordDto): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    // ✅ FASE 2: Validar fortaleza de nueva password
    const passwordValidation = this.utils.validation.validatePassword(dto.newPassword);
    if (!passwordValidation.isValid) {
      this.handleError.badRequest(
        `Password débil: ${passwordValidation.errors.join(', ')}`,
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

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      this.handleError.badRequest('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    const updated = await this.userRepository.updatePassword(id, hashedPassword);
    if (!updated) {
      this.handleError.badRequest('No se pudo actualizar la contraseña');
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
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
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
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    // Sanitizar inputs del perfil
    const sanitizedDto = {
      ...dto,
      firstName: dto.firstName ? this.sanitizer.sanitizeString(dto.firstName) : undefined,
      lastName: dto.lastName ? this.sanitizer.sanitizeString(dto.lastName) : undefined,
      phone: dto.phone ? this.sanitizer.sanitizePhone(dto.phone) : undefined,
    };

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
   * Obtiene estadísticas de usuarios
   * @returns Estadísticas
   *
   * ✅ Con cache: 5min TTL, tags: ['user-stats', 'users']
   */
  async getStats(): Promise<Record<string, unknown>> {
    return await this.cacheService.remember(
      'user:stats',
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
        tags: ['user-stats', 'users'], // Tags para invalidación
      },
    );
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Sanitiza los datos de creación de usuario
   */
  private sanitizeCreateDto(dto: CreateUserDto): CreateUserDto {
    return {
      ...dto,
      email: this.sanitizer.sanitizeEmail(dto.email),
      firstName: this.sanitizer.sanitizeString(dto.firstName),
      lastName: this.sanitizer.sanitizeString(dto.lastName),
      phone: dto.phone ? this.sanitizer.sanitizePhone(dto.phone) : undefined,
    };
  }

  /**
   * Sanitiza los datos de actualización de usuario
   */
  private sanitizeUpdateDto(dto: UpdateUserDto): UpdateUserDto {
    const sanitized: UpdateUserDto = { ...dto };

    if (dto.email) {
      sanitized.email = this.sanitizer.sanitizeEmail(dto.email);
    }
    if (dto.firstName) {
      sanitized.firstName = this.sanitizer.sanitizeString(dto.firstName);
    }
    if (dto.lastName) {
      sanitized.lastName = this.sanitizer.sanitizeString(dto.lastName);
    }
    if (dto.phone) {
      sanitized.phone = this.sanitizer.sanitizePhone(dto.phone);
    }

    return sanitized;
  }

  /**
   * Actualiza el status con validación previa
   */
  private async updateStatusWithValidation(
    id: string,
    status: UserStatus,
    action: string,
  ): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);
    }

    await this.userRepository.updateStatus(id, status);
    this.logger.log(`User ${action}: ${id}`);

    // Invalidar cache del usuario + stats (cambió el status)
    await this.cacheService.invalidateTags([`user:${id}`, 'users', 'user-stats']);
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
      createdAt: user.created_at,
      updatedAt: user.updated_at,
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
   * ⚠️ Solo para uso interno de autenticación
   * @param email - Email del usuario
   * @returns Usuario con password o null
   */
  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    // ✅ FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    const sanitizedEmail = this.sanitizer.sanitizeEmail(email);
    return await this.userRepository.findByEmail(sanitizedEmail, true);
  }

  /**
   * Busca un usuario por ID incluyendo password
   * ⚠️ Solo para uso interno de autenticación
   * @param id - ID del usuario
   * @returns Usuario con password o null
   */
  async findByIdWithPassword(id: string): Promise<UserEntity | null> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    return await this.userRepository.findByIdWithPassword(id);
  }

  /**
   * Busca un usuario por ID incluyendo roles completos
   * @param id - ID del usuario
   * @returns Usuario con roles y permisos o null
   */
  async findByIdWithRoles(id: string): Promise<UserEntity | null> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    return await this.userRepository.findByIdWithRoles(id);
  }

  /**
   * Busca un usuario por ID incluyendo company, roles y permisos completos
   * ⚠️ Solo para uso interno de autenticación (JwtStrategy)
   *
   * @param id - ID del usuario
   * @returns Usuario con company, roles y permisos o null
   */
  async findByIdWithCompanyAndRoles(id: string): Promise<UserEntity | null> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    return await this.userRepository.findByIdWithCompanyAndRoles(id);
  }

  /**
   * Verifica si un email existe
   * @param email - Email a verificar
   * @returns true si existe
   */
  async existsByEmail(email: string): Promise<boolean> {
    // ✅ FASE 1: Validar email antes de sanitizar
    if (!this.utils.validation.isEmail(email)) {
      this.handleError.badRequest('Email inválido', 'email');
    }

    const sanitizedEmail = this.sanitizer.sanitizeEmail(email);
    return await this.userRepository.emailExists(sanitizedEmail);
  }

  /**
   * Incrementa los intentos fallidos de login
   * @param id - ID del usuario
   */
  async incrementFailedAttempts(id: string): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    await this.userRepository.registerFailedLogin(id);
    this.logger.warn(`Failed login attempt registered for user: ${id}`);
  }

  /**
   * Resetea los intentos fallidos de login
   * @param id - ID del usuario
   */
  async resetFailedAttempts(id: string): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    await this.userRepository.resetFailedAttempts(id);
  }

  /**
   * Actualiza la fecha de último login
   * @param id - ID del usuario
   * @param ip - IP del cliente (opcional)
   */
  async updateLastLogin(id: string, ip?: string): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    await this.userRepository.registerLogin(id, ip);
  }

  /**
   * Actualiza la contraseña de un usuario
   * ⚠️ Esta función NO valida la contraseña actual
   * @param id - ID del usuario
   * @param newPassword - Nueva contraseña en texto plano (será hasheada)
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    // ✅ FASE 2: Validar fortaleza de password
    const passwordValidation = this.utils.validation.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      this.handleError.badRequest(
        `Password débil: ${passwordValidation.errors.join(', ')}`,
        'password',
      );
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updated = await this.userRepository.updatePassword(id, hashedPassword);
    if (!updated) {
      this.handleError.notFound('Usuario', id);
    }

    this.logger.log(`Password updated for user: ${id}`);
  }

  /**
   * Guarda token de reset de contraseña
   * @param id - ID del usuario
   * @param token - Token de reset (JWT)
   */
  async savePasswordResetToken(id: string, token: string): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    // El token expira en 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.userRepository.savePasswordResetToken(id, token, expiresAt);
    this.logger.log(`Password reset token saved for user: ${id}`);
  }

  /**
   * Invalida el token de reset de contraseña
   * @param id - ID del usuario
   */
  async invalidatePasswordResetToken(id: string): Promise<void> {
    // ✅ FASE 1: Validar UUID
    if (!this.utils.validation.isUUID(id)) {
      this.handleError.badRequest('ID de usuario inválido', 'id');
    }

    await this.userRepository.invalidatePasswordResetToken(id);
    this.logger.log(`Password reset token invalidated for user: ${id}`);
  }
}
