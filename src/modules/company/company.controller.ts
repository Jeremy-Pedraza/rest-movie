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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
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
 * @version 3.0.0 - FASE 7.2.C: Creación automática de schema multi-tenant
 *
 * Permisos:
 * - SUPER_ADMIN, ADMIN: Acceso completo
 * - MANAGER: Solo lectura de su compañía
 *
 * Flujo de creación con multi-tenant:
 * 1. POST /companies con campo `schema`
 * 2. Se crea registro en public.companies
 * 3. Se crea schema automáticamente (si schema != 'public')
 * 4. Se clonan tablas desde template_tenant
 */
@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * Crear compañía
   *
   * @description
   * Crea una nueva compañía. Si se especifica un `schema` diferente de 'public',
   * se creará automáticamente el schema de tenant con las tablas de reportes.
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Post()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear compañía',
    description: `Crea una nueva compañía en el sistema. Requiere rol SUPER_ADMIN o ADMIN.
    
**Multi-Tenant:** Si se especifica un \`schema\` diferente de 'public', se creará 
automáticamente el schema de PostgreSQL con las tablas de reportes clonadas desde template_tenant.

**Ejemplo con schema:**
\`\`\`json
{
  "name": "Taco Bell RD",
  "schema": "taco_bell_rd",
  "ruc": "101234567",
  "email": "admin@tacobell.do",
  "pais": "República Dominicana",
  "ciudad": "Santo Domingo",
  "country_code": "DO",
  "currency_code": "DOP"
}
\`\`\``,
  })
  @ApiResponse({ status: 201, description: 'Compañía creada exitosamente (con schema si aplica)' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'RUC, email o schema ya registrados' })
  async create(@Body() dto: CreateCompanyDto): Promise<IApiResponse<ICompanyResponse>> {
    const data = await this.companyService.create(dto);
    return {
      success: true,
      message:
        dto.schema && dto.schema !== 'public'
          ? `Compañía creada exitosamente con schema '${dto.schema}'`
          : 'Compañía creada exitosamente',
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
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
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
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
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

  // ============================================
  // ENDPOINTS DE SCHEMA (FASE 7.2.C)
  // ============================================

  /**
   * Obtener información del schema de una compañía
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Get(':id/schema')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Obtener información del schema de tenant',
    description: `Obtiene información detallada del schema de PostgreSQL asociado a la compañía.
    
Retorna:
- Nombre del schema
- Número de tablas
- Tamaño en disco
- Estado (active, creating, error)
- Fecha de última sincronización`,
  })
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
  @ApiResponse({ status: 200, description: 'Información del schema obtenida' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async getSchemaInfo(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<any>> {
    const data = await this.companyService.getSchemaInfo(id);
    return {
      success: true,
      message: data ? 'Información del schema obtenida' : 'La compañía no tiene schema de tenant',
      data,
    };
  }

  /**
   * Sincronizar schema con template
   *
   * @permission SUPER_ADMIN
   */
  @Post(':id/schema/sync')
  @Roles(ROLES.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Sincronizar schema con template',
    description: `Sincroniza el schema de la compañía con el template_tenant.
    
Útil cuando:
- Se agregaron nuevas tablas al template
- Se necesita actualizar la estructura del schema

**Solo crea tablas faltantes, NO modifica tablas existentes.**`,
  })
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
  @ApiResponse({ status: 200, description: 'Schema sincronizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async syncSchema(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<any>> {
    const result = await this.companyService.syncSchema(id);
    return {
      success: result.success,
      message: result.message,
      data: result,
    };
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Actualizar compañía
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Put(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Actualizar compañía',
    description: `Actualiza información de una compañía existente.
    
**Nota:** El campo \`schema\` NO se puede modificar después de creado.`,
  })
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
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
   * @description
   * Elimina lógicamente la compañía. El schema de tenant NO se elimina
   * para preservar datos históricos.
   *
   * @permission SUPER_ADMIN, ADMIN
   */
  @Delete(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar compañía (soft delete)',
    description: `Elimina lógicamente una compañía del sistema.
    
**Nota:** El schema de PostgreSQL NO se elimina para preservar datos históricos.
Use el endpoint de eliminación permanente si necesita eliminar también el schema.`,
  })
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
  @ApiResponse({ status: 204, description: 'Compañía eliminada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.companyService.delete(id);
  }

  /**
   * Eliminar compañía permanentemente (incluyendo schema)
   *
   * @permission SUPER_ADMIN
   */
  @Delete(':id/permanent')
  @Roles(ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar compañía permanentemente',
    description: `⚠️ **OPERACIÓN DESTRUCTIVA E IRREVERSIBLE**
    
Elimina permanentemente la compañía Y su schema de PostgreSQL con todos los datos.

**Esto eliminará:**
- Registro de la compañía
- Schema de PostgreSQL completo
- Todas las tablas del schema (reportes, etc.)
- Todos los datos contenidos

**Use con extrema precaución.**`,
  })
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
  @ApiResponse({ status: 204, description: 'Compañía y schema eliminados permanentemente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  @ApiResponse({ status: 500, description: 'Error eliminando schema' })
  async hardDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.companyService.hardDelete(id, true); // force = true
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
    description: 'Restaura una compañía previamente eliminada (soft delete).',
  })
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
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
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
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
  @ApiParam({ name: 'id', description: 'UUID de la compañía' })
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
