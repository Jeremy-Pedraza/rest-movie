// src/modules/company/company.controller.ts

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
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto';
import { ICompanyResponse, ICompanyWithStoresResponse, ICompanyStatsResponse } from './interfaces';

/**
 * CompanyController
 *
 * @description
 * Maneja todas las operaciones HTTP del módulo Company.
 * Endpoints protegidos con Guards de autenticación y roles.
 *
 * Permisos:
 * - SUPER_ADMIN, ADMIN: Acceso completo
 * - MANAGER: Solo lectura de su compañía
 */
@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Crear compañía
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Post()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear compañía',
    description: 'Crea una nueva compañía en el sistema. Requiere rol SUPER_ADMIN o ADMIN.',
  })
  @ApiResponse({ status: 201, description: 'Compañía creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'RUC o email ya registrados' })
  async create(@Body() dto: CreateCompanyDto): Promise<IApiResponse<ICompanyResponse>> {
    const data = await this.companyService.create(dto);
    return {
      success: true,
      message: 'Compañía creada exitosamente',
      data,
    };
  }

  /**
   * Listar compañías con filtros
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Get()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Listar compañías con filtros',
    description: 'Obtiene lista paginada de compañías con filtros opcionales.',
  })
  @ApiResponse({ status: 200, description: 'Compañías obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async findAll(
    @Query() query: QueryCompanyDto,
  ): Promise<IApiResponse<IPaginatedResponse<ICompanyResponse>>> {
    const result = await this.companyService.findAll(query);
    return {
      success: true,
      message: 'Compañías obtenidas exitosamente',
      data: result,
    };
  }

  /**
   * Obtener estadísticas de compañías
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Get('stats')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Cacheable(300) // Cache 5 minutos
  @ApiOperation({
    summary: 'Obtener estadísticas de compañías',
    description: 'Obtiene estadísticas globales del módulo de compañías.',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async getStats(): Promise<IApiResponse<ICompanyStatsResponse>> {
    const data = await this.companyService.getStats();
    return {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data,
    };
  }

  /**
   * Obtener compañías activas
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Get('active')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Cacheable(300) // Cache 5 minutos
  @ApiOperation({
    summary: 'Obtener compañías activas',
    description: 'Obtiene lista de todas las compañías activas.',
  })
  @ApiResponse({ status: 200, description: 'Compañías activas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async findActive(): Promise<IApiResponse<ICompanyResponse[]>> {
    const data = await this.companyService.findActive();
    return {
      success: true,
      message: 'Compañías activas obtenidas exitosamente',
      data,
    };
  }

  /**
   * Obtener compañía por ID
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Get(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Obtener compañía por ID',
    description: 'Obtiene información detallada de una compañía por su ID.',
  })
  @ApiResponse({ status: 200, description: 'Compañía obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<ICompanyResponse>> {
    const data = await this.companyService.findById(id);
    return {
      success: true,
      message: 'Compañía obtenida exitosamente',
      data,
    };
  }

  /**
   * Obtener compañía con tiendas
   *
   * @permission SUPER_ADMIN, ADMIN, MANAGER
   */
  @Get(':id/stores')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Obtener compañía con información de tiendas',
    description: 'Obtiene compañía con contadores de tiendas asociadas.',
  })
  @ApiResponse({ status: 200, description: 'Compañía con tiendas obtenida exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async findByIdWithStores(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<ICompanyWithStoresResponse>> {
    const data = await this.companyService.findByIdWithStores(id);
    return {
      success: true,
      message: 'Compañía con tiendas obtenida exitosamente',
      data,
    };
  }

  /**
   * Actualizar compañía
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Put(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Actualizar compañía',
    description: 'Actualiza información de una compañía existente.',
  })
  @ApiResponse({ status: 200, description: 'Compañía actualizada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  @ApiResponse({ status: 409, description: 'RUC o email ya registrados' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<IApiResponse<ICompanyResponse>> {
    const data = await this.companyService.update(id, dto);
    return {
      success: true,
      message: 'Compañía actualizada exitosamente',
      data,
    };
  }

  /**
   * Eliminar compañía (soft delete)
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Delete(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar compañía (soft delete)',
    description: 'Elimina lógicamente una compañía del sistema.',
  })
  @ApiResponse({ status: 204, description: 'Compañía eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.companyService.delete(id);
  }

  /**
   * Restaurar compañía eliminada
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Post(':id/restore')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Restaurar compañía eliminada',
    description: 'Restaura una compañía previamente eliminada.',
  })
  @ApiResponse({ status: 200, description: 'Compañía restaurada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<ICompanyResponse>> {
    const data = await this.companyService.restore(id);
    return {
      success: true,
      message: 'Compañía restaurada exitosamente',
      data,
    };
  }

  /**
   * Activar compañía
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Post(':id/activate')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Activar compañía',
    description: 'Activa una compañía previamente desactivada.',
  })
  @ApiResponse({ status: 200, description: 'Compañía activada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<ICompanyResponse>> {
    const data = await this.companyService.activate(id);
    return {
      success: true,
      message: 'Compañía activada exitosamente',
      data,
    };
  }

  /**
   * Desactivar compañía
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Post(':id/deactivate')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Desactivar compañía',
    description: 'Desactiva una compañía, impidiendo su acceso al sistema.',
  })
  @ApiResponse({ status: 200, description: 'Compañía desactivada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<ICompanyResponse>> {
    const data = await this.companyService.deactivate(id);
    return {
      success: true,
      message: 'Compañía desactivada exitosamente',
      data,
    };
  }
}
