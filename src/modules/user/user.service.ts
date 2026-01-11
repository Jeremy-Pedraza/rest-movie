// src/modules/user/user.service.ts

/**
 * @fileoverview Service para usuarios
 * @module modules/user
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { IPaginatedResponse } from '@shared/common';
import { ChangePasswordDto, CreateUserDto, QueryUserDto, UpdateUserDto } from './dto';
import { UserEntity, UserStatus } from './entities/user.entity';
import { IUserProfileResponse, IUserResponse } from './interfaces';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Crea un nuevo usuario
   * @param dto - Datos del usuario
   * @returns Usuario creado
   */
  async create(dto: CreateUserDto): Promise<IUserResponse> {
    // Verificar si el email ya existe
    const emailExists = await this.userRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictException('El email ya está registrado');
    }

    try {
      const user = await this.userRepository.create(dto);
      this.logger.log(`User created: ${user.id} (${user.email})`);
      return this.toUserResponse(user);
    } catch (error) {
      this.logger.error('Error creating user', error);
      throw error;
    }
  }

  /**
   * Busca un usuario por ID
   * @param id - ID del usuario
   * @returns Usuario encontrado
   */
  async findById(id: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toUserResponse(user);
  }

  /**
   * Busca un usuario por email
   * @param email - Email del usuario
   * @returns Usuario encontrado
   */
  async findByEmail(email: string): Promise<IUserResponse> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toUserResponse(user);
  }

  /**
   * Busca usuarios con filtros y paginación
   * @param query - Filtros de búsqueda
   * @returns Usuarios paginados
   */
  async findAll(query: QueryUserDto): Promise<IPaginatedResponse<IUserResponse>> {
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
    // Verificar que el usuario existe
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar email duplicado si se está cambiando
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.userRepository.emailExists(dto.email, id);
      if (emailExists) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    try {
      const user = await this.userRepository.update(id, dto);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      this.logger.log(`User updated: ${user.id}`);
      return this.toUserResponse(user);
    } catch (error) {
      this.logger.error('Error updating user', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario (soft delete)
   * @param id - ID del usuario
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const deleted = await this.userRepository.softDelete(id);
    if (!deleted) {
      throw new BadRequestException('No se pudo eliminar el usuario');
    }

    this.logger.log(`User soft deleted: ${id}`);
  }

  /**
   * Restaura un usuario eliminado
   * @param id - ID del usuario
   */
  async restore(id: string): Promise<IUserResponse> {
    const restored = await this.userRepository.restore(id);
    if (!restored) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    this.logger.log(`User restored: ${id}`);
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
  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(
      (await this.userRepository.findById(id))?.email || '',
      true,
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    const updated = await this.userRepository.updatePassword(id, hashedPassword);
    if (!updated) {
      throw new BadRequestException('No se pudo actualizar la contraseña');
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
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.updateStatus(id, UserStatus.ACTIVE);
    this.logger.log(`User activated: ${id}`);

    return this.findById(id);
  }

  /**
   * Desactiva un usuario
   * @param id - ID del usuario
   */
  async deactivate(id: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.updateStatus(id, UserStatus.INACTIVE);
    this.logger.log(`User deactivated: ${id}`);

    return this.findById(id);
  }

  /**
   * Suspende un usuario
   * @param id - ID del usuario
   */
  async suspend(id: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.updateStatus(id, UserStatus.SUSPENDED);
    this.logger.log(`User suspended: ${id}`);

    return this.findById(id);
  }

  /**
   * Bloquea un usuario
   * @param id - ID del usuario
   */
  async block(id: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.updateStatus(id, UserStatus.BLOCKED);
    this.logger.log(`User blocked: ${id}`);

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
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
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
    const user = await this.userRepository.update(id, dto);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.toUserProfileResponse(user);
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Obtiene estadísticas de usuarios
   * @returns Estadísticas
   */
  async getStats(): Promise<Record<string, unknown>> {
    const [total, byStatus] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.countByStatus(),
    ]);

    return {
      total,
      byStatus,
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Convierte entidad a respuesta de usuario
   */
  private toUserResponse(user: UserEntity): IUserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
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
}
