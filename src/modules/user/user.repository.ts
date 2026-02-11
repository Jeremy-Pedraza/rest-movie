// src/modules/user/user.repository.ts

/**
 * @fileoverview Repository para usuarios
 * @module modules/user
 *
 * ⚠️ REGLAS:
 * - Extiende BaseRepository para infraestructura multi-tenant
 * - Usa createStaticQueryBuilder() para queries en schema public
 * - SIEMPRE usar parámetros con :param syntax (previene SQL injection)
 * - NO usar query() con SQL raw
 * - NO tiene lógica de negocio
 *
 * 📋 ENTIDADES: users, roles, permissions (schema public)
 * - Todas las entidades de usuario están en schema public
 * - Por tanto, usa createStaticQueryBuilder() sin withSchema()
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { BaseRepository } from '@shared/database/base.repository';
import { SchemaContext } from '@shared/database/schema.context';

import { UserEntity, UserStatus } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { IPaginatedResponse } from '@shared/common';

/**
 * UserRepository - Repository para gestión de usuarios
 *
 * Extiende BaseRepository para tener infraestructura multi-tenant lista,
 * pero usa createStaticQueryBuilder() porque users/roles/permissions están en schema public.
 *
 * @example
 * ```typescript
 * // Buscar usuario (usa createStaticQueryBuilder para public)
 * const user = await this.userRepository.findById('user-id');
 * ```
 */
@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    repository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    schemaContext: SchemaContext,
  ) {
    super(repository, schemaContext);
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Crea un nuevo usuario
   * @param dto - Datos del usuario
   * @returns Usuario creado
   */
  async create(dto: CreateUserDto): Promise<UserEntity> {
    const { roleIds, ...userData } = dto;

    // Crear usuario
    const user = this.repository.create(userData);

    // Asignar roles si se especificaron
    if (roleIds && roleIds.length > 0) {
      user.roles = await this.roleRepo.findBy({ id: In(roleIds) });
    } else {
      // Asignar rol 'user' por defecto
      const defaultRole = await this.roleRepo.findOneBy({ name: 'user' });
      if (defaultRole) {
        user.roles = [defaultRole];
      }
    }

    return this.repository.save(user);
  }

  /**
   * Busca un usuario por ID
   * @param id - ID del usuario
   * @returns Usuario encontrado o null
   */
  async findById(id: string): Promise<UserEntity | null> {
    return this.createStaticQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.id = :id', { id })
      .getOne();
  }

  /**
   * Busca un usuario por email
   * @param email - Email del usuario
   * @param includePassword - Incluir contraseña en el resultado
   * @returns Usuario encontrado o null
   */
  async findByEmail(email: string, includePassword = false): Promise<UserEntity | null> {
    const qb = this.createStaticQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('LOWER(user.email) = LOWER(:email)', { email });

    if (includePassword) {
      qb.addSelect('user.password');
    }

    return qb.getOne();
  }

  /**
   * Busca usuarios con filtros y paginación
   * @param query - Filtros de búsqueda
   * @returns Usuarios paginados
   */
  async findAll(query: QueryUserDto): Promise<IPaginatedResponse<UserEntity>> {
    const {
      search,
      status,
      role,
      emailVerified,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.createStaticQueryBuilder('user').leftJoinAndSelect('user.roles', 'roles');

    // Filtro de búsqueda (usar nombres de columna snake_case)
    if (search) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtro por estado
    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    // Filtro por rol
    if (role) {
      qb.andWhere('roles.name = :role', { role });
    }

    // Filtro por email verificado
    if (emailVerified !== undefined) {
      qb.andWhere('user.email_verified = :email_verified', { email_verified: emailVerified });
    }

    // Filtro por fecha
    if (fromDate) {
      qb.andWhere('user.created_at >= :from_date', { from_date: new Date(fromDate) });
    }

    if (toDate) {
      qb.andWhere('user.created_at <= :to_date', { to_date: new Date(toDate) });
    }

    // Ordenamiento - mapeo de camelCase (DTO) a snake_case (entidad)
    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      status: 'status',
      lastLoginAt: 'last_login_at',
    };
    const orderField = sortFieldMap[sortBy] || 'created_at';
    qb.orderBy(`user.${orderField}`, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    // Ejecutar query
    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Actualiza un usuario
   * @param id - ID del usuario
   * @param dto - Datos a actualizar
   * @returns Usuario actualizado
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserEntity | null> {
    const { roleIds, ...userData } = dto;

    // Buscar usuario existente
    const user = await this.findById(id);
    if (!user) return null;

    // Actualizar datos básicos
    Object.assign(user, userData);

    // Actualizar roles si se especificaron
    if (roleIds !== undefined) {
      if (roleIds.length > 0) {
        user.roles = await this.roleRepo.findBy({ id: In(roleIds) });
      } else {
        user.roles = [];
      }
    }

    return this.repository.save(user);
  }

  /**
   * Elimina un usuario (soft delete)
   * @param id - ID del usuario
   * @returns true si se eliminó
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Restaura un usuario eliminado
   * @param id - ID del usuario
   * @returns true si se restauró
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.repository.restore(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Elimina permanentemente un usuario
   * @param id - ID del usuario
   * @returns true si se eliminó
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // SPECIAL QUERIES
  // ============================================

  /**
   * Verifica si un email existe
   * @param email - Email a verificar
   * @param excludeUserId - ID de usuario a excluir
   * @returns true si existe
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const qb = this.createStaticQueryBuilder('user').where('LOWER(user.email) = LOWER(:email)', {
      email,
    });

    if (excludeUserId) {
      qb.andWhere('user.id != :exclude_user_id', { exclude_user_id: excludeUserId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param id - ID del usuario
   * @param hashedPassword - Contraseña hasheada
   * @returns true si se actualizó
   */
  async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Actualiza el status de un usuario
   * @param id - ID del usuario
   * @param status - Nuevo status
   * @returns true si se actualizó
   */
  async updateStatus(id: string, status: UserStatus): Promise<boolean> {
    const result = await this.repository.update(id, { status });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Registra un login exitoso
   * @param id - ID del usuario
   * @param ip - IP del cliente
   */
  async registerLogin(id: string, ip?: string): Promise<void> {
    await this.repository.update(id, {
      last_login_at: new Date(),
      last_login_ip: ip || null,
      failed_login_attempts: 0,
      locked_until: null,
    });
  }

  /**
   * Registra un login fallido
   * @param id - ID del usuario
   */
  async registerFailedLogin(id: string): Promise<void> {
    const user = await this.repository.findOneBy({ id });
    if (!user) return;

    user.registerFailedLogin();
    await this.repository.save(user);
  }

  /**
   * Verifica email de usuario
   * @param id - ID del usuario
   * @returns true si se verificó
   */
  async verifyEmail(id: string): Promise<boolean> {
    const result = await this.repository.update(id, {
      email_verified: true,
      email_verified_at: new Date(),
      email_verification_token: null,
      status: UserStatus.ACTIVE,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Cuenta total de usuarios
   * @returns Total de usuarios
   */
  async count(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Cuenta usuarios por estado
   * @returns Conteo por estado
   */
  async countByStatus(): Promise<Record<UserStatus, number>> {
    const results = await this.createStaticQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany<{ status: UserStatus; count: string }>();

    const counts = {} as Record<UserStatus, number>;
    for (const status of Object.values(UserStatus)) {
      const found = results.find((r) => r.status === status);
      counts[status] = found ? parseInt(found.count, 10) : 0;
    }

    return counts;
  }

  /**
   * Obtiene estadísticas de usuarios para cache warmup
   * @returns Estadísticas de usuarios
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<UserStatus, number>;
    verified: number;
    unverified: number;
  }> {
    const [total, byStatus, verified, unverified] = await Promise.all([
      this.count(),
      this.countByStatus(),
      this.createStaticQueryBuilder('user')
        .where('user.email_verified = :verified', { verified: true })
        .getCount(),
      this.createStaticQueryBuilder('user')
        .where('user.email_verified = :verified', { verified: false })
        .getCount(),
    ]);

    return { total, byStatus, verified, unverified };
  }

  // ============================================
  // AUTH SPECIFIC METHODS
  // ============================================

  /**
   * Busca un usuario por ID incluyendo password
   * @param id - ID del usuario
   * @returns Usuario con password o null
   */
  async findByIdWithPassword(id: string): Promise<UserEntity | null> {
    return this.createStaticQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  /**
   * Busca un usuario por ID incluyendo roles y permisos
   * @param id - ID del usuario
   * @returns Usuario con roles o null
   */
  async findByIdWithRoles(id: string): Promise<UserEntity | null> {
    return this.createStaticQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.id = :id', { id })
      .getOne();
  }

  /**
   * Busca un usuario por ID incluyendo company, roles, permisos y tiendas asignadas
   * ⚠️ Solo para uso interno de autenticación (JwtStrategy)
   *
   * Este método carga toda la información necesaria para construir UserSessionDto:
   * - Datos del usuario
   * - Company (tenant) con schema
   * - Roles con permisos
   * - Tiendas asignadas (para ReportAccessGuard)
   *
   * @param id - ID del usuario
   * @returns Usuario con company, roles, permisos y tiendas asignadas o null
   */
  async findByIdWithCompanyAndRoles(id: string): Promise<UserEntity | null> {
    return this.createStaticQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.assigned_stores', 'assigned_stores')
      .where('user.id = :id', { id })
      .andWhere('user.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Resetea los intentos fallidos de login
   * @param id - ID del usuario
   */
  async resetFailedAttempts(id: string): Promise<void> {
    await this.repository.update(id, {
      failed_login_attempts: 0,
      locked_until: null,
    });
  }

  /**
   * Guarda token de reset de contraseña
   * @param id - ID del usuario
   * @param token - Token de reset
   * @param expiresAt - Fecha de expiración
   */
  async savePasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void> {
    await this.repository.update(id, {
      password_reset_token: token,
      password_reset_expires: expiresAt,
    });
  }

  /**
   * Obtiene los campos de reset token de un usuario
   * @param id - ID del usuario
   * @returns Campos password_reset_token y password_reset_expires
   */
  async getPasswordResetData(
    id: string,
  ): Promise<{ password_reset_token: string | null; password_reset_expires: Date | null } | null> {
    return this.createStaticQueryBuilder('user')
      .select(['user.id', 'user.password_reset_token', 'user.password_reset_expires'])
      .addSelect('user.password_reset_token')
      .addSelect('user.password_reset_expires')
      .where('user.id = :id', { id })
      .getOne();
  }

  /**
   * Invalida el token de reset de contraseña
   * @param id - ID del usuario
   */
  async invalidatePasswordResetToken(id: string): Promise<void> {
    await this.repository.update(id, {
      password_reset_token: null,
      password_reset_expires: null,
    });
  }
  /**
   * Busca un usuario por ID incluyendo tiendas asignadas
   *
   * @description
   * Carga el usuario con todas sus tiendas asignadas (relación ManyToMany).
   * Solo usuarios con rol USER tienen tiendas asignadas.
   *
   * @param id - ID del usuario
   * @returns Usuario con tiendas asignadas o null
   *
   * @example
   * ```typescript
   * const user = await this.userRepository.findByIdWithStores('user-id');
   * console.log(user.assigned_stores); // Array de StoreEntity
   * ```
   */
  async findByIdWithStores(id: string): Promise<UserEntity | null> {
    return this.createStaticQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('user.assigned_stores', 'stores')
      .leftJoinAndSelect('stores.company', 'company')
      .where('user.id = :id', { id })
      .andWhere('user.deleted_at IS NULL')
      .getOne();
  }
}
