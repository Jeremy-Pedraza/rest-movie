// src/modules/user/user.controller.ts

/**
 * @fileoverview Controller para usuarios
 * @module modules/user
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto, ChangePasswordDto } from './dto';
import { IUserResponse, IUserProfileResponse } from './interfaces';
import { IPaginatedResponse, IApiResponse } from '@shared/common';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { ROLES } from '@constants/roles.constant';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  // ============================================
  // CRUD ENDPOINTS
  // ============================================

  /**
   * Crea un nuevo usuario
   */
  @Post()
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya existe' })
  async create(@Body() dto: CreateUserDto): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.create(dto);
      return {
        success: true,
        message: 'Usuario creado exitosamente',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error creating user', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios con paginación
   */
  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Listar usuarios con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<IApiResponse<IPaginatedResponse<IUserResponse>>> {
    try {
      const result = await this.userService.findAll(query);
      return {
        success: true,
        message: 'Usuarios obtenidos exitosamente',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error fetching users', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  @Get('stats')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas de usuarios' })
  @ApiResponse({ status: 200, description: 'Estadísticas de usuarios' })
  async getStats(): Promise<IApiResponse<Record<string, unknown>>> {
    try {
      const stats = await this.userService.getStats();
      return {
        success: true,
        message: 'Estadísticas obtenidas',
        data: stats,
      };
    } catch (error) {
      this.logger.error('Error fetching user stats', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por ID
   */
  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.findById(id);
      return {
        success: true,
        message: 'Usuario encontrado',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error fetching user', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario
   */
  @Put(':id')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.update(id, dto);
      return {
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error updating user', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario (soft delete)
   */
  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<null>> {
    try {
      await this.userService.softDelete(id);
      return {
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: null,
      };
    } catch (error) {
      this.logger.error('Error deleting user', error);
      throw error;
    }
  }

  /**
   * Restaura un usuario eliminado
   */
  @Post(':id/restore')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Restaurar usuario eliminado' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario restaurado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.restore(id);
      return {
        success: true,
        message: 'Usuario restaurado exitosamente',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error restoring user', error);
      throw error;
    }
  }

  // ============================================
  // STATUS ENDPOINTS
  // ============================================

  /**
   * Activa un usuario
   */
  @Patch(':id/activate')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Activar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario activado' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.activate(id);
      return {
        success: true,
        message: 'Usuario activado',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error activating user', error);
      throw error;
    }
  }

  /**
   * Desactiva un usuario
   */
  @Patch(':id/deactivate')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Desactivar usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.deactivate(id);
      return {
        success: true,
        message: 'Usuario desactivado',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error deactivating user', error);
      throw error;
    }
  }

  /**
   * Suspende un usuario
   */
  @Patch(':id/suspend')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Suspender usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario suspendido' })
  async suspend(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.suspend(id);
      return {
        success: true,
        message: 'Usuario suspendido',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error suspending user', error);
      throw error;
    }
  }

  /**
   * Bloquea un usuario
   */
  @Patch(':id/block')
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Bloquear usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario bloqueado' })
  async block(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IUserResponse>> {
    try {
      const user = await this.userService.block(id);
      return {
        success: true,
        message: 'Usuario bloqueado',
        data: user,
      };
    } catch (error) {
      this.logger.error('Error blocking user', error);
      throw error;
    }
  }

  // ============================================
  // PROFILE ENDPOINTS (CURRENT USER)
  // ============================================

  /**
   * Obtiene el perfil del usuario actual
   */
  @Get('me/profile')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  async getMyProfile(
    @CurrentUser('id') userId: string,
  ): Promise<IApiResponse<IUserProfileResponse>> {
    try {
      const profile = await this.userService.getProfile(userId);
      return {
        success: true,
        message: 'Perfil obtenido',
        data: profile,
      };
    } catch (error) {
      this.logger.error('Error fetching profile', error);
      throw error;
    }
  }

  /**
   * Actualiza el perfil del usuario actual
   */
  @Patch('me/profile')
  @ApiOperation({ summary: 'Actualizar mi perfil' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: Pick<UpdateUserDto, 'firstName' | 'lastName' | 'phone' | 'avatar' | 'preferences'>,
  ): Promise<IApiResponse<IUserProfileResponse>> {
    try {
      const profile = await this.userService.updateProfile(userId, dto);
      return {
        success: true,
        message: 'Perfil actualizado',
        data: profile,
      };
    } catch (error) {
      this.logger.error('Error updating profile', error);
      throw error;
    }
  }

  /**
   * Cambia la contraseña del usuario actual
   */
  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada' })
  @ApiResponse({ status: 400, description: 'Contraseña incorrecta' })
  async changeMyPassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<IApiResponse<null>> {
    try {
      await this.userService.changePassword(userId, dto);
      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: null,
      };
    } catch (error) {
      this.logger.error('Error changing password', error);
      throw error;
    }
  }
}
