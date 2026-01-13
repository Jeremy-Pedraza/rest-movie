// src/modules/user/user.repository.ts

/**
 * @fileoverview Repository para usuarios
 * @module modules/user
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { UserEntity, UserStatus } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { IPaginatedResponse } from '@shared/common';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
  ) {}

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
    const user = this.userRepo.create(userData);

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

    return this.userRepo.save(user);
  }

  /**
   * Busca un usuario por ID
   * @param id - ID del usuario
   * @returns Usuario encontrado o null
   */
  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepo
      .createQueryBuilder('user')
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
    const qb = this.userRepo
      .createQueryBuilder('user')
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

    const qb = this.userRepo.createQueryBuilder('user').leftJoinAndSelect('user.roles', 'roles');

    // Filtro de búsqueda
    if (search) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
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
      qb.andWhere('user.emailVerified = :emailVerified', { emailVerified });
    }

    // Filtro por fecha
    if (fromDate) {
      qb.andWhere('user.createdAt >= :fromDate', { fromDate: new Date(fromDate) });
    }

    if (toDate) {
      qb.andWhere('user.createdAt <= :toDate', { toDate: new Date(toDate) });
    }

    // Ordenamiento
    const validSortFields = [
      'createdAt',
      'email',
      'firstName',
      'lastName',
      'status',
      'lastLoginAt',
    ];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
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

    return this.userRepo.save(user);
  }

  /**
   * Elimina un usuario (soft delete)
   * @param id - ID del usuario
   * @returns true si se eliminó
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.userRepo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Restaura un usuario eliminado
   * @param id - ID del usuario
   * @returns true si se restauró
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.userRepo.restore(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Elimina permanentemente un usuario
   * @param id - ID del usuario
   * @returns true si se eliminó
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.userRepo.delete(id);
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
    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email });

    if (excludeUserId) {
      qb.andWhere('user.id != :excludeUserId', { excludeUserId });
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
    const result = await this.userRepo.update(id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
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
    const result = await this.userRepo.update(id, { status });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Registra un login exitoso
   * @param id - ID del usuario
   * @param ip - IP del cliente
   */
  async registerLogin(id: string, ip?: string): Promise<void> {
    await this.userRepo.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip || null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  /**
   * Registra un login fallido
   * @param id - ID del usuario
   */
  async registerFailedLogin(id: string): Promise<void> {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) return;

    user.registerFailedLogin();
    await this.userRepo.save(user);
  }

  /**
   * Verifica email de usuario
   * @param id - ID del usuario
   * @returns true si se verificó
   */
  async verifyEmail(id: string): Promise<boolean> {
    const result = await this.userRepo.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      status: UserStatus.ACTIVE,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Cuenta total de usuarios
   * @returns Total de usuarios
   */
  async count(): Promise<number> {
    return this.userRepo.count();
  }

  /**
   * Cuenta usuarios por estado
   * @returns Conteo por estado
   */
  async countByStatus(): Promise<Record<UserStatus, number>> {
    const results = await this.userRepo
      .createQueryBuilder('user')
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
      this.userRepo
        .createQueryBuilder('user')
        .where('user.emailVerified = :verified', { verified: true })
        .getCount(),
      this.userRepo
        .createQueryBuilder('user')
        .where('user.emailVerified = :verified', { verified: false })
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
    return this.userRepo
      .createQueryBuilder('user')
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
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.id = :id', { id })
      .getOne();
  }

  /**
   * Resetea los intentos fallidos de login
   * @param id - ID del usuario
   */
  async resetFailedAttempts(id: string): Promise<void> {
    await this.userRepo.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  /**
   * Guarda token de reset de contraseña
   * @param id - ID del usuario
   * @param token - Token de reset
   * @param expiresAt - Fecha de expiración
   */
  async savePasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void> {
    await this.userRepo.update(id, {
      passwordResetToken: token,
      passwordResetExpires: expiresAt,
    });
  }

  /**
   * Invalida el token de reset de contraseña
   * @param id - ID del usuario
   */
  async invalidatePasswordResetToken(id: string): Promise<void> {
    await this.userRepo.update(id, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }
}
