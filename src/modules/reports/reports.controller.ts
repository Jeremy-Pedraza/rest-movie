// src/modules/reports/reports.controller.ts

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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { Cacheable } from '@decorators/cacheable.decorator';
import { ROLES } from '@constants/roles.constant';
import { IApiResponse, IPaginatedResponse } from '@shared/common';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  QueryReportDto,
  ConsolidateReportsDto,
  QuickConsolidateDto,
  CompareReportsDto,
  QuickCompareDto,
  RankingStoresDto,
  QuickRankingDto,
  RankingCompaniesDto,
  ReportStatusEnum,
  RankingMetricEnum,
} from './dto';
import {
  IReportWithStoreResponse,
  IReportWithDetailsResponse,
  IReportStatsResponse,
  IConsolidatedReportResponse,
  IQuickConsolidatedResponse,
  IQuickComparisonResponse,
  IStoreRankingResponse,
  ICompanyRankingResponse,
  IQuickStoreRankingResponse,
} from './interfaces';
import { ConsolidationLevelEnum } from './enums';
import { UserSessionDto } from '@modules/auth/interfaces';
import { ReportAccessGuard } from './guards/report-access.guard';

/**
 * ReportsController
 *
 * @description
 * Maneja todas las operaciones HTTP del módulo Reports.
 * Endpoints protegidos con Guards de autenticación y roles.
 *
 * IMPORTANTE - ORDEN DE RUTAS:
 * Las rutas estáticas (sin parámetros dinámicos) DEBEN ir ANTES
 * de las rutas con :id para evitar que NestJS las capture incorrectamente.
 *
 * Orden correcto:
 * 1. Rutas POST (no afectadas por orden)
 * 2. GET / (lista)
 * 3. GET /consolidate/quick, /compare/quick, etc. (estáticas)
 * 4. GET /stats/global, /trends (estáticas)
 * 5. GET /store/:storeId/* (prefijo específico)
 * 6. GET /company/:companyId/* (prefijo específico)
 * 7. GET /:id (genérica - AL FINAL)
 * 8. GET /:id/details (después de :id)
 *
 * @version 2.1.0 - Rutas reorganizadas para evitar conflictos con :id
 */
@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ============================================
  // SECCIÓN 1: OPERACIONES POST (no afectadas por orden)
  // ============================================

  /**
   * Crear reporte
   */
  @Post()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear reporte',
    description:
      'Crea un nuevo reporte para una tienda y fecha específica. Incluye métricas de ventas, pagos, descuentos y órdenes.',
  })
  @ApiResponse({ status: 201, description: 'Reporte creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a la tienda' })
  @ApiResponse({ status: 409, description: 'Ya existe reporte para esta tienda/fecha' })
  async create(
    @Body() dto: CreateReportDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IReportWithDetailsResponse>> {
    const data = await this.reportsService.create(dto, user);
    return {
      success: true,
      message: 'Reporte creado exitosamente',
      data,
    };
  }

  /**
   * Consolidar reportes
   */
  @Post('consolidate')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Consolidar reportes',
    description:
      'Genera consolidación de reportes por tienda, compañía o global según el nivel especificado.',
  })
  @ApiResponse({ status: 200, description: 'Consolidación generada exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para este nivel de consolidación' })
  async consolidate(
    @Body() dto: ConsolidateReportsDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IConsolidatedReportResponse>> {
    const data = await this.reportsService.consolidate(dto, user);
    return {
      success: true,
      message: 'Consolidación generada exitosamente',
      data,
    };
  }

  /**
   * Comparar reportes
   */
  @Post('compare')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Comparar reportes',
    description:
      'Genera comparación de reportes: entre tiendas, períodos, días de la semana, año vs año, o mes vs mes.',
  })
  @ApiResponse({ status: 200, description: 'Comparación generada exitosamente' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a los datos solicitados' })
  async compare(
    @Body() dto: CompareReportsDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<any>> {
    const data = await this.reportsService.compare(dto, user);
    return {
      success: true,
      message: 'Comparación generada exitosamente',
      data,
    };
  }

  /**
   * Ranking de tiendas
   */
  @Post('ranking/stores')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Ranking de tiendas',
    description:
      'Obtiene ranking de tiendas por métrica seleccionada: ventas totales, ingresos, órdenes, ticket promedio, cantidad.',
  })
  @ApiResponse({ status: 200, description: 'Ranking de tiendas obtenido' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async getRankingStores(
    @Body() dto: RankingStoresDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IStoreRankingResponse>> {
    const data = await this.reportsService.getRankingStores(dto, user);
    return {
      success: true,
      message: 'Ranking de tiendas obtenido',
      data,
    };
  }

  /**
   * Ranking de compañías
   */
  @Post('ranking/companies')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @ApiOperation({
    summary: 'Ranking de compañías',
    description: 'Obtiene ranking de compañías por métrica. Solo SUPER_ADMIN y ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Ranking de compañías obtenido' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async getRankingCompanies(
    @Body() dto: RankingCompaniesDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<ICompanyRankingResponse>> {
    const data = await this.reportsService.getRankingCompanies(dto, user);
    return {
      success: true,
      message: 'Ranking de compañías obtenido',
      data,
    };
  }

  // ============================================
  // SECCIÓN 2: GET LISTA (raíz)
  // ============================================

  /**
   * Listar reportes con filtros
   */
  @Get()
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Listar reportes con filtros',
    description:
      'Obtiene lista paginada de reportes. Los filtros se aplican según el rol del usuario.',
  })
  @ApiResponse({ status: 200, description: 'Reportes obtenidos exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @Query() query: QueryReportDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IPaginatedResponse<IReportWithStoreResponse>>> {
    const result = await this.reportsService.findAll(query, user);
    return {
      success: true,
      message: 'Reportes obtenidos exitosamente',
      data: result,
    };
  }

  // ============================================
  // SECCIÓN 3: GET RUTAS ESTÁTICAS (ANTES de :id)
  // ============================================

  /**
   * Consolidación rápida por período predefinido
   */
  @Get('consolidate/quick')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @Cacheable(60) // Cache 1 minuto
  @ApiOperation({
    summary: 'Consolidación rápida',
    description:
      'Obtiene consolidación rápida para períodos predefinidos: hoy, ayer, esta semana, semana pasada, este mes, mes pasado.',
  })
  @ApiQuery({
    name: 'period',
    enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'],
    required: true,
  })
  @ApiQuery({ name: 'company_id', required: false, description: 'UUID de compañía (opcional)' })
  @ApiResponse({ status: 200, description: 'Consolidación rápida obtenida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async quickConsolidate(
    @Query() dto: QuickConsolidateDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IQuickConsolidatedResponse>> {
    const data = await this.reportsService.quickConsolidate(dto, user);
    return {
      success: true,
      message: 'Consolidación rápida obtenida',
      data,
    };
  }

  /**
   * Comparación rápida predefinida
   */
  @Get('compare/quick')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @Cacheable(60) // Cache 1 minuto
  @ApiOperation({
    summary: 'Comparación rápida',
    description:
      'Obtiene comparación rápida predefinida: hoy vs ayer, esta semana vs anterior, este mes vs anterior.',
  })
  @ApiQuery({
    name: 'quick_compare_type',
    enum: ['today_vs_yesterday', 'this_week_vs_last_week', 'this_month_vs_last_month', 'yoy'],
    required: true,
  })
  @ApiQuery({ name: 'store_id', required: false, description: 'UUID de tienda (opcional)' })
  @ApiQuery({ name: 'company_id', required: false, description: 'UUID de compañía (opcional)' })
  @ApiResponse({ status: 200, description: 'Comparación rápida obtenida' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async quickCompare(
    @Query() dto: QuickCompareDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IQuickComparisonResponse>> {
    const data = await this.reportsService.quickCompare(dto, user);
    return {
      success: true,
      message: 'Comparación rápida obtenida',
      data,
    };
  }

  /**
   * Ranking rápido de tiendas
   */
  @Get('ranking/quick')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @UseGuards(ReportAccessGuard)
  @Cacheable(60) // Cache 1 minuto
  @ApiOperation({
    summary: 'Ranking rápido',
    description: 'Obtiene top 3 de tiendas para período predefinido.',
  })
  @ApiQuery({
    name: 'period',
    enum: ['today', 'yesterday', 'this_week', 'this_month', 'this_year'],
    required: true,
  })
  @ApiQuery({
    name: 'metric',
    enum: RankingMetricEnum,
    required: false,
    description: 'Métrica para el ranking (default: total_sales)',
  })
  @ApiQuery({ name: 'company_id', required: false, description: 'UUID de compañía (opcional)' })
  @ApiResponse({ status: 200, description: 'Ranking rápido obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async quickRanking(
    @Query() dto: QuickRankingDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IQuickStoreRankingResponse>> {
    const data = await this.reportsService.quickRanking(dto, user);
    return {
      success: true,
      message: 'Ranking rápido obtenido',
      data,
    };
  }

  /**
   * Estadísticas globales
   */
  @Get('stats/global')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Cacheable(300) // Cache 5 minutos
  @ApiOperation({
    summary: 'Estadísticas globales',
    description: 'Obtiene estadísticas globales del módulo de reportes. Solo SUPER_ADMIN y ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas globales obtenidas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  async getGlobalStats(
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IReportStatsResponse>> {
    const data = await this.reportsService.getGlobalStats(user);
    return {
      success: true,
      message: 'Estadísticas globales obtenidas',
      data,
    };
  }

  /**
   * Tendencias de reportes
   */
  @Get('trends')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @Cacheable(120) // Cache 2 minutos
  @ApiOperation({
    summary: 'Obtener tendencias',
    description: 'Obtiene serie temporal de métricas para generar gráficos de tendencias.',
  })
  @ApiQuery({ name: 'date_from', required: true, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: true, description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiQuery({
    name: 'group_by',
    enum: ['day', 'week', 'month'],
    required: false,
    description: 'Agrupar por (default: day)',
  })
  @ApiQuery({ name: 'store_id', required: false, description: 'UUID de tienda (opcional)' })
  @ApiQuery({ name: 'company_id', required: false, description: 'UUID de compañía (opcional)' })
  @ApiResponse({ status: 200, description: 'Tendencias obtenidas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getTrends(
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @CurrentUser() user: UserSessionDto,
    @Query('group_by') groupBy: 'day' | 'week' | 'month' = 'day',
    @Query('store_id') storeId?: string,
    @Query('company_id') companyId?: string,
  ): Promise<IApiResponse<any>> {
    const data = await this.reportsService.getTrends(
      storeId,
      companyId,
      dateFrom,
      dateTo,
      groupBy,
      user,
    );
    return {
      success: true,
      message: 'Tendencias obtenidas',
      data,
    };
  }

  // ============================================
  // SECCIÓN 4: GET CON PREFIJO /store/:storeId
  // ============================================

  /**
   * Reportes de una tienda
   */
  @Get('store/:storeId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Reportes de una tienda',
    description: 'Obtiene todos los reportes de una tienda específica.',
  })
  @ApiParam({ name: 'storeId', description: 'UUID de la tienda' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Reportes de tienda obtenidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta tienda' })
  async findByStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @CurrentUser() user: UserSessionDto,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ): Promise<IApiResponse<IPaginatedResponse<IReportWithStoreResponse>>> {
    const query = Object.assign(new QueryReportDto(), {
      store_id: storeId,
      date_from: dateFrom,
      date_to: dateTo,
      page: 1,
      limit: 100,
    });
    const result = await this.reportsService.findAll(query, user);
    return {
      success: true,
      message: 'Reportes de tienda obtenidos',
      data: result,
    };
  }

  /**
   * Reporte de hoy para una tienda
   */
  @Get('store/:storeId/today')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @Cacheable(60) // Cache 1 minuto
  @ApiOperation({
    summary: 'Reporte de hoy',
    description: 'Obtiene el reporte del día de hoy para una tienda.',
  })
  @ApiParam({ name: 'storeId', description: 'UUID de la tienda' })
  @ApiResponse({ status: 200, description: 'Reporte de hoy obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta tienda' })
  @ApiResponse({ status: 404, description: 'No hay reporte para hoy' })
  async findTodayByStore(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IReportWithStoreResponse | null>> {
    const today = new Date().toISOString().split('T')[0];
    const query = Object.assign(new QueryReportDto(), {
      store_id: storeId,
      report_date: today,
      page: 1,
      limit: 1,
    });
    const result = await this.reportsService.findAll(query, user);
    const report = result.data[0] || null;
    return {
      success: true,
      message: report ? 'Reporte de hoy obtenido' : 'No hay reporte para hoy',
      data: report,
    };
  }

  /**
   * Resumen de tienda (consolidado del mes)
   */
  @Get('store/:storeId/summary')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @Cacheable(300) // Cache 5 minutos
  @ApiOperation({
    summary: 'Resumen de tienda',
    description: 'Obtiene consolidado del mes actual para una tienda.',
  })
  @ApiParam({ name: 'storeId', description: 'UUID de la tienda' })
  @ApiResponse({ status: 200, description: 'Resumen de tienda obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta tienda' })
  async getStoreSummary(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IQuickConsolidatedResponse>> {
    const dto: QuickConsolidateDto = {
      period: 'this_month',
      consolidation_level: ConsolidationLevelEnum.STORE,
      store_id: storeId,
    };
    // Usar consolidación rápida internamente
    const data = await this.reportsService.quickConsolidate(dto, user);
    return {
      success: true,
      message: 'Resumen de tienda obtenido',
      data,
    };
  }

  // ============================================
  // SECCIÓN 5: GET CON PREFIJO /company/:companyId
  // ============================================

  /**
   * Reportes de una compañía
   */
  @Get('company/:companyId')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Reportes de una compañía',
    description: 'Obtiene todos los reportes de una compañía (todas sus tiendas).',
  })
  @ApiParam({ name: 'companyId', description: 'UUID de la compañía' })
  @ApiQuery({ name: 'date_from', required: false, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'date_to', required: false, description: 'Fecha fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Reportes de compañía obtenidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta compañía' })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: UserSessionDto,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ): Promise<IApiResponse<IPaginatedResponse<IReportWithStoreResponse>>> {
    const query = Object.assign(new QueryReportDto(), {
      company_id: companyId,
      date_from: dateFrom,
      date_to: dateTo,
      page: 1,
      limit: 100,
    });
    const result = await this.reportsService.findAll(query, user);
    return {
      success: true,
      message: 'Reportes de compañía obtenidos',
      data: result,
    };
  }

  /**
   * Dashboard de compañía
   */
  @Get('company/:companyId/dashboard')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @UseGuards(ReportAccessGuard)
  @Cacheable(120) // Cache 2 minutos
  @ApiOperation({
    summary: 'Dashboard de compañía',
    description:
      'Obtiene datos para dashboard: consolidado del mes, comparación vs mes anterior, ranking de tiendas.',
  })
  @ApiParam({ name: 'companyId', description: 'UUID de la compañía' })
  @ApiResponse({ status: 200, description: 'Dashboard obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta compañía' })
  async getCompanyDashboard(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<any>> {
    // Consolidado del mes
    const consolidation = await this.reportsService.quickConsolidate(
      {
        period: 'this_month',
        consolidation_level: ConsolidationLevelEnum.COMPANY,
        company_id: companyId,
      },
      user,
    );

    // Comparación vs mes anterior
    const comparison = await this.reportsService.quickCompare(
      { quick_compare_type: 'this_month_vs_last_month', company_id: companyId },
      user,
    );

    // Ranking rápido
    const ranking = await this.reportsService.quickRanking(
      { period: 'this_month', company_id: companyId },
      user,
    );

    return {
      success: true,
      message: 'Dashboard de compañía obtenido',
      data: {
        consolidation,
        comparison,
        ranking,
      },
    };
  }

  // ============================================
  // SECCIÓN 6: GET /:id (AL FINAL - ruta genérica)
  // ============================================

  /**
   * Obtener reporte por ID
   *
   * IMPORTANTE: Esta ruta DEBE estar después de todas las rutas
   * estáticas para evitar que capture rutas como /trends, /stats/global, etc.
   */
  @Get(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Obtener reporte por ID',
    description: 'Obtiene información de un reporte específico.',
  })
  @ApiParam({ name: 'id', description: 'UUID del reporte' })
  @ApiResponse({ status: 200, description: 'Reporte obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a este reporte' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IReportWithStoreResponse>> {
    const data = await this.reportsService.findById(id, user);
    return {
      success: true,
      message: 'Reporte obtenido exitosamente',
      data,
    };
  }

  /**
   * Obtener reporte con todos los detalles
   */
  @Get(':id/details')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.USER)
  @UseGuards(ReportAccessGuard)
  @ApiOperation({
    summary: 'Obtener reporte con detalles completos',
    description:
      'Obtiene reporte con todos los detalles: ventas por tipo, métodos de pago, descuentos, ajustes y órdenes.',
  })
  @ApiParam({ name: 'id', description: 'UUID del reporte' })
  @ApiResponse({ status: 200, description: 'Reporte con detalles obtenido exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a este reporte' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  async findByIdWithDetails(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IReportWithDetailsResponse>> {
    const data = await this.reportsService.findByIdWithDetails(id, user);
    return {
      success: true,
      message: 'Reporte con detalles obtenido exitosamente',
      data,
    };
  }

  // ============================================
  // SECCIÓN 7: PUT/DELETE (no afectadas por orden)
  // ============================================

  /**
   * Actualizar reporte
   */
  @Put(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Actualizar reporte',
    description:
      'Actualiza métricas y estado de un reporte existente. No se puede cambiar tienda ni fecha.',
  })
  @ApiParam({ name: 'id', description: 'UUID del reporte' })
  @ApiResponse({ status: 200, description: 'Reporte actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a este reporte' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IReportWithStoreResponse>> {
    const data = await this.reportsService.update(id, dto, user);
    return {
      success: true,
      message: 'Reporte actualizado exitosamente',
      data,
    };
  }

  /**
   * Eliminar reporte
   */
  @Delete(':id')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar reporte',
    description:
      'Elimina permanentemente un reporte y todos sus detalles. Solo SUPER_ADMIN y ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'UUID del reporte' })
  @ApiResponse({ status: 204, description: 'Reporte eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserSessionDto,
  ): Promise<void> {
    await this.reportsService.delete(id, user);
  }

  /**
   * Cambiar estado del reporte
   */
  @Post(':id/status/:status')
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Cambiar estado del reporte',
    description: 'Cambia el estado del reporte (DRAFT, PUBLISHED, ARCHIVED).',
  })
  @ApiParam({ name: 'id', description: 'UUID del reporte' })
  @ApiParam({ name: 'status', enum: ReportStatusEnum, description: 'Nuevo estado' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin acceso a este reporte' })
  @ApiResponse({ status: 404, description: 'Reporte no encontrado' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('status') status: ReportStatusEnum,
    @CurrentUser() user: UserSessionDto,
  ): Promise<IApiResponse<IReportWithStoreResponse>> {
    const data = await this.reportsService.changeStatus(id, status, user);
    return {
      success: true,
      message: `Estado del reporte cambiado a ${status}`,
      data,
    };
  }
}
