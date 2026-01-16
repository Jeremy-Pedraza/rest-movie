// src/modules/store/store.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@decorators/roles.decorator';
import { Cacheable } from '@decorators/cacheable.decorator';
import { ROLES } from '@constants/roles.constant';
import { IApiResponse, IPaginatedResponse } from '@shared/common';
import { StoreService } from './store.service';
import {
  CreateStoreDto,
  UpdateStoreDto,
  QueryStoreDto,
  AssignUsersToStoreDto,
  RemoveUsersFromStoreDto,
} from './dto';
import { IStoreResponse, IStoreWithUsersResponse, IStoreStatsResponse } from './interfaces';

/**
 * StoreController
 *
 * @description
 * Maneja todas las operaciones HTTP del módulo Store.
 * Endpoints protegidos con Guards de autenticación y roles.
 *
 * Permisos:
 * - SUPER_ADMIN, ADMIN: Acceso completo
 * - MANAGER: Lectura de tiendas de su compañía + asignación de usuarios
 * - USER: Solo lectura de tiendas asignadas
 */
@ApiTags('Stores')
@ApiBearerAuth()
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  /**
   * Crear tienda
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Post()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear tienda',
    description: 'Crea una nueva tienda/sucursal. Requiere rol SUPER_ADMIN o ADMIN.',
  })
  @ApiResponse({ status: 201, description: 'Tienda creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'Código de tienda ya registrado' })
  async create(@Body() dto: CreateStoreDto): Promise<IApiResponse<IStoreResponse>> {
    const data = await this.storeService.create(dto);
    return {
      success: true,
      message: 'Tienda creada exitosamente',
      data,
    };
  }

  /**
   * Listar tiendas con filtros
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Get()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Listar tiendas con filtros',
    description: 'Obtiene lista paginada de tiendas con filtros opcionales.',
  })
  @ApiResponse({ status: 200, description: 'Tiendas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async findAll(
    @Query() query: QueryStoreDto,
  ): Promise<IApiResponse<IPaginatedResponse<IStoreResponse>>> {
    const result = await this.storeService.findAll(query);
    return {
      success: true,
      message: 'Tiendas obtenidas exitosamente',
      data: result,
    };
  }

  /**
   * Obtener estadísticas de tiendas
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Get('stats')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Cacheable(300) // Cache 5 minutos
  @ApiOperation({
    summary: 'Obtener estadísticas de tiendas',
    description: 'Obtiene estadísticas globales del módulo de tiendas.',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async getStats(): Promise<IApiResponse<IStoreStatsResponse>> {
    const data = await this.storeService.getStats();
    return {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data,
    };
  }

  /**
   * Obtener tienda por ID
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER, USER
   */
  @Get(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @ApiOperation({
    summary: 'Obtener tienda por ID',
    description: 'Obtiene información detallada de una tienda por su ID.',
  })
  @ApiResponse({ status: 200, description: 'Tienda obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IStoreResponse>> {
    const data = await this.storeService.findById(id);
    return {
      success: true,
      message: 'Tienda obtenida exitosamente',
      data,
    };
  }

  /**
   * Obtener tienda con usuarios asignados
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Get(':id/users')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Obtener tienda con usuarios asignados',
    description: 'Obtiene tienda con lista de usuarios asignados.',
  })
  @ApiResponse({ status: 200, description: 'Tienda con usuarios obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async findByIdWithUsers(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<IStoreWithUsersResponse>> {
    const data = await this.storeService.findByIdWithUsers(id);
    return {
      success: true,
      message: 'Tienda con usuarios obtenida exitosamente',
      data,
    };
  }

  /**
   * Actualizar tienda
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Put(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Actualizar tienda',
    description: 'Actualiza información de una tienda existente.',
  })
  @ApiResponse({ status: 200, description: 'Tienda actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
  ): Promise<IApiResponse<IStoreResponse>> {
    const data = await this.storeService.update(id, dto);
    return {
      success: true,
      message: 'Tienda actualizada exitosamente',
      data,
    };
  }

  /**
   * Eliminar tienda (soft delete)
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Delete(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar tienda (soft delete)',
    description: 'Elimina lógicamente una tienda del sistema.',
  })
  @ApiResponse({ status: 204, description: 'Tienda eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.storeService.delete(id);
  }

  /**
   * Restaurar tienda eliminada
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Post(':id/restore')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Restaurar tienda eliminada',
    description: 'Restaura una tienda previamente eliminada.',
  })
  @ApiResponse({ status: 200, description: 'Tienda restaurada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IStoreResponse>> {
    const data = await this.storeService.restore(id);
    return {
      success: true,
      message: 'Tienda restaurada exitosamente',
      data,
    };
  }

  /**
   * Activar tienda
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Post(':id/activate')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Activar tienda',
    description: 'Activa una tienda previamente desactivada.',
  })
  @ApiResponse({ status: 200, description: 'Tienda activada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IStoreResponse>> {
    const data = await this.storeService.activate(id);
    return {
      success: true,
      message: 'Tienda activada exitosamente',
      data,
    };
  }

  /**
   * Desactivar tienda
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Post(':id/deactivate')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Desactivar tienda',
    description: 'Desactiva una tienda, impidiendo la generación de reportes.',
  })
  @ApiResponse({ status: 200, description: 'Tienda desactivada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IStoreResponse>> {
    const data = await this.storeService.deactivate(id);
    return {
      success: true,
      message: 'Tienda desactivada exitosamente',
      data,
    };
  }

  /**
   * Asignar usuarios a tienda
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Post(':id/users/assign')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Asignar usuarios a tienda',
    description:
      'Asigna múltiples usuarios (rol USER) a una tienda. Los usuarios asignados solo pueden ver reportes de sus tiendas.',
  })
  @ApiResponse({ status: 200, description: 'Usuarios asignados exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async assignUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignUsersToStoreDto,
  ): Promise<IApiResponse<IStoreWithUsersResponse>> {
    const data = await this.storeService.assignUsers(id, dto);
    return {
      success: true,
      message: 'Usuarios asignados exitosamente',
      data,
    };
  }

  /**
   * Remover usuarios de tienda
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Post(':id/users/remove')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Remover usuarios de tienda',
    description: 'Remueve la asignación de múltiples usuarios de una tienda.',
  })
  @ApiResponse({ status: 200, description: 'Usuarios removidos exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  async removeUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveUsersFromStoreDto,
  ): Promise<IApiResponse<IStoreWithUsersResponse>> {
    const data = await this.storeService.removeUsers(id, dto);
    return {
      success: true,
      message: 'Usuarios removidos exitosamente',
      data,
    };
  }

  /**
   * Obtener tiendas de una compañía
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Get('company/:companyId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Obtener tiendas de una compañía',
    description: 'Obtiene todas las tiendas de una compañía específica.',
  })
  @ApiResponse({ status: 200, description: 'Tiendas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<IApiResponse<IStoreResponse[]>> {
    const data = await this.storeService.findByCompany(companyId);
    return {
      success: true,
      message: 'Tiendas obtenidas exitosamente',
      data,
    };
  }

  /**
   * Obtener tiendas activas de una compañía
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Get('company/:companyId/active')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @Cacheable(300) // Cache 5 minutos
  @ApiOperation({
    summary: 'Obtener tiendas activas de una compañía',
    description: 'Obtiene solo las tiendas activas de una compañía específica.',
  })
  @ApiResponse({ status: 200, description: 'Tiendas activas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async findActiveByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ): Promise<IApiResponse<IStoreResponse[]>> {
    const data = await this.storeService.findActiveByCompany(companyId);
    return {
      success: true,
      message: 'Tiendas activas obtenidas exitosamente',
      data,
    };
  }
}
