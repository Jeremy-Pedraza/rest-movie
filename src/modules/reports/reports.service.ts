// src/modules/reports/reports.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { StoreRepository } from '@modules/store/store.repository';
import { CompanyRepository } from '@modules/company/company.repository';
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
  RankingMetricEnum,
  RankingDirectionEnum,
  ComparisonTypeEnum,
  ReportStatusEnum,
} from './dto';
import { ReportTypeEnum, ConsolidationLevelEnum } from './enums';
import {
  IReportResponse,
  IReportWithStoreResponse,
  IReportWithDetailsResponse,
  IReportStatsResponse,
  IConsolidatedReportResponse,
  IQuickConsolidatedResponse,
  IStoresComparisonResponse,
  IQuickComparisonResponse,
  IStoreRankingResponse,
  ICompanyRankingResponse,
  IQuickStoreRankingResponse,
  IValueDifference,
} from './interfaces';
import { ReportHeaderEntity } from './entities';
import { UserSessionDto } from '@modules/auth/interfaces';
import { ROLES } from '@constants';
import { hasRole, hasAnyRole } from '@shared/utils/helpers';

/**
 * ReportsService
 *
 * @description
 * Maneja la lógica de negocio para el módulo Reports.
 * Incluye validaciones de permisos basadas en roles.
 *
 * Responsabilidades:
 * - CRUD de reportes con validaciones
 * - Consolidaciones multi-nivel
 * - Comparaciones temporales y entre tiendas
 * - Rankings y estadísticas
 * - Control de acceso por roles
 */
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly storeRepository: StoreRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  // ============================================
  // SECCIÓN 1: CRUD BÁSICO
  // ============================================

  /**
   * Crear reporte
   *
   * @param dto - Datos del reporte
   * @param user - Usuario que crea
   * @returns IReportWithDetailsResponse
   */
  async create(dto: CreateReportDto, user: UserSessionDto): Promise<IReportWithDetailsResponse> {
    this.logger.log(`Creando reporte para tienda ${dto.store_id} fecha ${dto.report_date}`);

    // Validar acceso a la tienda
    await this.validateStoreAccess(dto.store_id, user);

    // Verificar si ya existe reporte para esa tienda/fecha
    const exists = await this.reportsRepository.exists(dto.store_id, dto.report_date);
    if (exists) {
      this.handleError.conflict(
        `Ya existe un reporte para la tienda en la fecha ${dto.report_date}`,
        'report_date',
      );
    }

    // Preparar datos
    const reportData = this.prepareReportData(dto);

    try {
      const report = await this.reportsRepository.create(reportData);
      this.logger.log(`Reporte creado: ${report.id}`);

      // Retornar con detalles
      return await this.findByIdWithDetails(report.id, user);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando reporte');
    }
  }

  /**
   * Listar reportes con filtros
   *
   * @param query - Filtros y paginación
   * @param user - Usuario que consulta
   * @returns IPaginatedResponse<IReportWithStoreResponse>
   */
  async findAll(
    query: QueryReportDto,
    user: UserSessionDto,
  ): Promise<IPaginatedResponse<IReportWithStoreResponse>> {
    // Aplicar filtros según rol
    const filteredQuery = await this.applyRoleFilters(query, user);

    const [reports, total] = await this.reportsRepository.findAll(filteredQuery);

    const page = query.page || 1;
    const limit = query.limit || 10;

    return {
      data: reports.map((r) => this.toResponseWithStore(r)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Obtener reporte por ID
   *
   * @param id - UUID del reporte
   * @param user - Usuario que consulta
   * @returns IReportWithStoreResponse
   */
  async findById(id: string, user: UserSessionDto): Promise<IReportWithStoreResponse> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      this.handleError.notFound('Reporte', id);
    }

    // Validar acceso
    await this.validateStoreAccess(report.store_id, user);

    return this.toResponseWithStore(report);
  }

  /**
   * Obtener reporte con todos los detalles
   *
   * @param id - UUID del reporte
   * @param user - Usuario que consulta
   * @returns IReportWithDetailsResponse
   */
  async findByIdWithDetails(id: string, user: UserSessionDto): Promise<IReportWithDetailsResponse> {
    const report = await this.reportsRepository.findById(id, true);
    if (!report) {
      this.handleError.notFound('Reporte', id);
    }

    // Validar acceso
    await this.validateStoreAccess(report.store_id, user);

    return this.toResponseWithDetails(report);
  }

  /**
   * Actualizar reporte
   *
   * @param id - UUID del reporte
   * @param dto - Datos a actualizar
   * @param user - Usuario que actualiza
   * @returns IReportWithStoreResponse
   */
  async update(
    id: string,
    dto: UpdateReportDto,
    user: UserSessionDto,
  ): Promise<IReportWithStoreResponse> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      this.handleError.notFound('Reporte', id);
    }

    // Validar acceso
    await this.validateStoreAccess(report.store_id, user);

    // Preparar datos de actualización
    const updateData: Partial<ReportHeaderEntity> = {};

    if (dto.report_type !== undefined) updateData.report_type = dto.report_type;
    if (dto.total_sales !== undefined) updateData.total_sales = dto.total_sales;
    if (dto.total_revenue !== undefined) updateData.total_revenue = dto.total_revenue;
    if (dto.total_quantity !== undefined) updateData.total_quantity = dto.total_quantity;
    if (dto.orders_count !== undefined) updateData.orders_count = dto.orders_count;
    if (dto.average_ticket !== undefined) updateData.average_ticket = dto.average_ticket;
    if (dto.total_discounts !== undefined) updateData.total_discounts = dto.total_discounts;
    if (dto.total_adjustments !== undefined) updateData.total_adjustments = dto.total_adjustments;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata;

    try {
      const updated = await this.reportsRepository.update(id, updateData);
      if (!updated) {
        this.handleError.internal('Error al actualizar reporte');
      }
      this.logger.log(`Reporte actualizado: ${id}`);
      return this.toResponseWithStore(updated);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando reporte');
    }
  }

  /**
   * Eliminar reporte
   *
   * @param id - UUID del reporte
   * @param user - Usuario que elimina
   */
  async delete(id: string, user: UserSessionDto): Promise<void> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      this.handleError.notFound('Reporte', id);
    }

    // Validar acceso
    await this.validateStoreAccess(report.store_id, user);

    // Solo ADMIN y SUPER_ADMIN pueden eliminar
    if (!hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      this.handleError.forbidden('No tiene permisos para eliminar reportes');
    }

    await this.reportsRepository.delete(id);
    this.logger.log(`Reporte eliminado: ${id}`);
  }

  /**
   * Cambiar estado del reporte
   *
   * @param id - UUID del reporte
   * @param status - Nuevo estado
   * @param user - Usuario que cambia
   * @returns IReportWithStoreResponse
   */
  async changeStatus(
    id: string,
    status: ReportStatusEnum,
    user: UserSessionDto,
  ): Promise<IReportWithStoreResponse> {
    const report = await this.reportsRepository.findById(id);
    if (!report) {
      this.handleError.notFound('Reporte', id);
    }

    await this.validateStoreAccess(report.store_id, user);

    const updated = await this.reportsRepository.update(id, { status });
    if (!updated) {
      this.handleError.internal('Error al actualizar estado del reporte');
    }
    this.logger.log(`Estado de reporte ${id} cambiado a ${status}`);
    return this.toResponseWithStore(updated);
  }

  // ============================================
  // SECCIÓN 2: CONSOLIDACIONES
  // ============================================

  /**
   * Consolidar reportes según parámetros
   *
   * @param dto - Parámetros de consolidación
   * @param user - Usuario que consulta
   * @returns IConsolidatedReportResponse
   */
  async consolidate(
    dto: ConsolidateReportsDto,
    user: UserSessionDto,
  ): Promise<IConsolidatedReportResponse> {
    this.logger.log(`Consolidando reportes: nivel=${dto.consolidation_level}`);

    // Validar acceso según nivel
    await this.validateConsolidationAccess(dto, user);

    let result: IConsolidatedReportResponse;

    switch (dto.consolidation_level) {
      case ConsolidationLevelEnum.STORE:
        result = await this.consolidateByStore(dto, user);
        break;
      case ConsolidationLevelEnum.COMPANY:
        result = await this.consolidateByCompany(dto, user);
        break;
      case ConsolidationLevelEnum.ALL_COMPANIES:
        result = await this.consolidateGlobal(dto);
        break;
      default:
        this.handleError.badRequest('Nivel de consolidación no válido');
    }

    return result;
  }

  /**
   * Consolidación rápida por período predefinido
   *
   * @param dto - Parámetros rápidos
   * @param user - Usuario que consulta
   * @returns IQuickConsolidatedResponse
   */
  async quickConsolidate(
    dto: QuickConsolidateDto,
    user: UserSessionDto,
  ): Promise<IQuickConsolidatedResponse> {
    const { dateFrom, dateTo, label } = this.getPeriodDates(dto.period);

    // Determinar nivel y filtros según rol
    let consolidationLevel = ConsolidationLevelEnum.STORE;

    if (hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      consolidationLevel = dto.company_id
        ? ConsolidationLevelEnum.COMPANY
        : ConsolidationLevelEnum.ALL_COMPANIES;
    } else if (hasRole(user.roles, ROLES.MANAGER)) {
      consolidationLevel = ConsolidationLevelEnum.COMPANY;
    }
    // Nota: Para USER, el filtrado por tiendas asignadas se aplica en getPeriodStats
    // a través de los filtros de compañía

    // Obtener métricas actuales
    const stats = await this.reportsRepository.getPeriodStats(dateFrom, dateTo, dto.company_id);

    // Obtener métricas del período anterior para comparación
    const previousDates = this.getPreviousPeriodDates(dto.period);
    const previousStats = await this.reportsRepository.getPeriodStats(
      previousDates.dateFrom,
      previousDates.dateTo,
      dto.company_id,
    );

    return {
      period: dto.period,
      period_label: label,
      consolidation_level: consolidationLevel,
      date_from: new Date(dateFrom),
      date_to: new Date(dateTo),
      total_sales: stats.total_sales,
      total_revenue: stats.total_revenue,
      total_orders: stats.total_orders,
      average_ticket: stats.average_ticket,
      vs_previous_period: {
        sales_change: stats.total_sales - previousStats.total_sales,
        sales_change_percentage: this.calculatePercentageChange(
          previousStats.total_sales,
          stats.total_sales,
        ),
        orders_change: stats.total_orders - previousStats.total_orders,
        orders_change_percentage: this.calculatePercentageChange(
          previousStats.total_orders,
          stats.total_orders,
        ),
      },
    };
  }

  private async consolidateByStore(
    dto: ConsolidateReportsDto,
    user: UserSessionDto,
  ): Promise<IConsolidatedReportResponse> {
    if (!dto.store_id) {
      this.handleError.badRequest('store_id es requerido para consolidación a nivel de tienda');
    }

    await this.validateStoreAccess(dto.store_id, user);

    const store = await this.storeRepository.findById(dto.store_id);
    const totals = await this.reportsRepository.consolidateByStore(
      dto.store_id,
      dto.date_from,
      dto.date_to,
    );

    let dailyBreakdown;
    if (dto.include_daily_breakdown) {
      dailyBreakdown = await this.reportsRepository.getDailyBreakdown(
        [dto.store_id],
        dto.date_from,
        dto.date_to,
      );
    }

    let orderTypeBreakdown;
    if (dto.include_order_type_breakdown) {
      orderTypeBreakdown = await this.reportsRepository.consolidateSalesByOrderType(
        [dto.store_id],
        dto.date_from,
        dto.date_to,
      );
    }

    let paymentMethodBreakdown;
    if (dto.include_payment_method_breakdown) {
      paymentMethodBreakdown = await this.reportsRepository.consolidatePaymentMethods(
        [dto.store_id],
        dto.date_from,
        dto.date_to,
      );
    }

    return {
      consolidation_level: ConsolidationLevelEnum.STORE,
      report_type: dto.report_type || ReportTypeEnum.DAILY,
      date_from: new Date(dto.date_from),
      date_to: new Date(dto.date_to),
      generated_at: new Date(),
      store_id: dto.store_id,
      store_name: store?.nombre,
      totals: {
        ...totals,
        average_ticket: totals.total_orders > 0 ? totals.total_sales / totals.total_orders : 0,
        stores_count: 1,
      },
      daily_breakdown: dailyBreakdown?.map((d) => ({
        date: new Date(d.date),
        day_of_week: this.getDayName(d.day_of_week),
        total_sales: d.total_sales,
        total_revenue: d.total_revenue,
        total_orders: d.total_orders,
        average_ticket: d.total_orders > 0 ? d.total_sales / d.total_orders : 0,
        stores_reported: d.stores_reported,
      })),
      order_type_breakdown: orderTypeBreakdown?.map((o) => ({
        order_type: o.order_type,
        total_sales: o.total_sales,
        total_orders: o.total_orders,
        total_quantity: o.total_quantity,
        average_ticket: o.total_orders > 0 ? o.total_sales / o.total_orders : 0,
        percentage_of_total: o.percentage_of_total,
      })),
      payment_method_breakdown: paymentMethodBreakdown?.map((p) => ({
        payment_method: p.payment_method,
        total_amount: p.total_amount,
        transactions_count: p.transactions_count,
        average_amount: p.transactions_count > 0 ? p.total_amount / p.transactions_count : 0,
        percentage_of_total: p.percentage_of_total,
      })),
    };
  }

  private async consolidateByCompany(
    dto: ConsolidateReportsDto,
    user: UserSessionDto,
  ): Promise<IConsolidatedReportResponse> {
    if (!dto.company_id) {
      this.handleError.badRequest('company_id es requerido para consolidación a nivel de compañía');
    }

    this.validateCompanyAccess(dto.company_id, user);

    const company = await this.companyRepository.findById(dto.company_id);
    const { totals, stores_breakdown } = await this.reportsRepository.consolidateByCompany(
      dto.company_id,
      dto.date_from,
      dto.date_to,
    );

    let dailyBreakdown;
    if (dto.include_daily_breakdown) {
      const storeIds = stores_breakdown.map((s) => s.store_id);
      dailyBreakdown = await this.reportsRepository.getDailyBreakdown(
        storeIds,
        dto.date_from,
        dto.date_to,
      );
    }

    return {
      consolidation_level: ConsolidationLevelEnum.COMPANY,
      report_type: dto.report_type || ReportTypeEnum.DAILY,
      date_from: new Date(dto.date_from),
      date_to: new Date(dto.date_to),
      generated_at: new Date(),
      company_id: dto.company_id,
      company_name: company?.name,
      totals: {
        ...totals,
        average_ticket: totals.total_orders > 0 ? totals.total_sales / totals.total_orders : 0,
      },
      stores_breakdown: dto.include_store_breakdown
        ? stores_breakdown.map((s) => ({
            store_id: s.store_id,
            store_name: s.store_name,
            store_code: s.store_code,
            total_sales: s.total_sales,
            total_revenue: s.total_revenue,
            total_orders: s.total_orders,
            average_ticket: s.total_orders > 0 ? s.total_sales / s.total_orders : 0,
            percentage_of_total:
              totals.total_sales > 0 ? (s.total_sales / totals.total_sales) * 100 : 0,
            reports_count: s.reports_count,
          }))
        : undefined,
      daily_breakdown: dailyBreakdown?.map((d) => ({
        date: new Date(d.date),
        day_of_week: this.getDayName(d.day_of_week),
        total_sales: d.total_sales,
        total_revenue: d.total_revenue,
        total_orders: d.total_orders,
        average_ticket: d.total_orders > 0 ? d.total_sales / d.total_orders : 0,
        stores_reported: d.stores_reported,
      })),
    };
  }

  private async consolidateGlobal(
    dto: ConsolidateReportsDto,
  ): Promise<IConsolidatedReportResponse> {
    const { totals } = await this.reportsRepository.consolidateGlobal(dto.date_from, dto.date_to);

    return {
      consolidation_level: ConsolidationLevelEnum.ALL_COMPANIES,
      report_type: dto.report_type || ReportTypeEnum.DAILY,
      date_from: new Date(dto.date_from),
      date_to: new Date(dto.date_to),
      generated_at: new Date(),
      totals: {
        ...totals,
        average_ticket: totals.total_orders > 0 ? totals.total_sales / totals.total_orders : 0,
        days_count: 0, // Se puede calcular si es necesario
      },
    };
  }

  // ============================================
  // SECCIÓN 3: COMPARACIONES
  // ============================================

  /**
   * Comparar reportes según parámetros
   *
   * @param dto - Parámetros de comparación
   * @param user - Usuario que consulta
   * @returns Respuesta de comparación
   */
  async compare(dto: CompareReportsDto, user: UserSessionDto): Promise<any> {
    this.logger.log(`Comparando reportes: tipo=${dto.comparison_type}`);

    switch (dto.comparison_type) {
      case ComparisonTypeEnum.STORES:
        return await this.compareStores(dto, user);
      case ComparisonTypeEnum.PERIODS:
        return await this.comparePeriods(dto, user);
      case ComparisonTypeEnum.DAYS_OF_WEEK:
        return await this.compareDaysOfWeek(dto, user);
      case ComparisonTypeEnum.YEAR_OVER_YEAR:
        return await this.compareYearOverYear(dto, user);
      case ComparisonTypeEnum.MONTH_OVER_MONTH:
        return await this.compareMonthOverMonth(dto, user);
      default:
        this.handleError.badRequest('Tipo de comparación no válido');
    }
  }

  /**
   * Comparación rápida predefinida
   *
   * @param dto - Parámetros rápidos
   * @param user - Usuario que consulta
   * @returns IQuickComparisonResponse
   */
  async quickCompare(
    dto: QuickCompareDto,
    user: UserSessionDto,
  ): Promise<IQuickComparisonResponse> {
    const { current, previous, currentLabel, previousLabel } = this.getQuickComparePeriods(
      dto.quick_compare_type,
    );

    // Determinar filtros según rol
    let storeIds: string[] = [];
    if (dto.store_id) {
      await this.validateStoreAccess(dto.store_id, user);
      storeIds = [dto.store_id];
    } else if (dto.company_id) {
      this.validateCompanyAccess(dto.company_id, user);
      const stores = await this.storeRepository.findByCompany(dto.company_id);
      storeIds = stores.map((s) => s.id);
    } else if (hasRole(user.roles, ROLES.USER)) {
      const stores = await this.storeRepository.findByUserId(user.id);
      storeIds = stores.map((s) => s.id);
    }

    const comparison = await this.reportsRepository.comparePeriods(storeIds, current, previous);

    // Agregar total_quantity a current y previous (no disponible en comparePeriods)
    const currentMetrics = {
      ...comparison.current,
      total_quantity: 0,
    };
    const previousMetrics = {
      ...comparison.previous,
      total_quantity: 0,
    };

    return {
      comparison_label: `${currentLabel} vs ${previousLabel}`,
      current_period_label: currentLabel,
      previous_period_label: previousLabel,
      current: currentMetrics,
      previous: previousMetrics,
      differences: {
        total_sales: this.calculateDifference(
          comparison.previous.total_sales,
          comparison.current.total_sales,
        ),
        total_revenue: this.calculateDifference(
          comparison.previous.total_revenue,
          comparison.current.total_revenue,
        ),
        total_orders: this.calculateDifference(
          comparison.previous.total_orders,
          comparison.current.total_orders,
        ),
        average_ticket: this.calculateDifference(
          comparison.previous.average_ticket,
          comparison.current.average_ticket,
        ),
        total_quantity: this.calculateDifference(0, 0),
      },
      summary: this.generateComparisonSummary(comparison),
    };
  }

  private async compareStores(
    dto: CompareReportsDto,
    user: UserSessionDto,
  ): Promise<IStoresComparisonResponse> {
    if (!dto.store_ids || dto.store_ids.length < 2) {
      this.handleError.badRequest('Se requieren al menos 2 tiendas para comparar');
    }

    // Validar acceso a todas las tiendas
    for (const storeId of dto.store_ids) {
      await this.validateStoreAccess(storeId, user);
    }

    const storesData = await this.reportsRepository.compareStores(
      dto.store_ids,
      dto.date_from,
      dto.date_to,
    );

    // Calcular totales y promedios
    const totals = storesData.reduce(
      (acc, s) => ({
        total_sales: acc.total_sales + s.total_sales,
        total_revenue: acc.total_revenue + s.total_revenue,
        total_orders: acc.total_orders + s.total_orders,
        average_ticket: 0,
        total_quantity: 0,
      }),
      { total_sales: 0, total_revenue: 0, total_orders: 0, average_ticket: 0, total_quantity: 0 },
    );
    totals.average_ticket = totals.total_orders > 0 ? totals.total_sales / totals.total_orders : 0;

    const storesCount = storesData.length;
    const averages = {
      total_sales: totals.total_sales / storesCount,
      total_revenue: totals.total_revenue / storesCount,
      total_orders: totals.total_orders / storesCount,
      average_ticket: totals.average_ticket,
      total_quantity: 0,
    };

    // Ordenar para encontrar mejores/peores
    const bySales = [...storesData].sort((a, b) => b.total_sales - a.total_sales);
    const byOrders = [...storesData].sort((a, b) => b.total_orders - a.total_orders);
    const byTicket = [...storesData].sort((a, b) => b.average_ticket - a.average_ticket);

    return {
      comparison_type: ComparisonTypeEnum.STORES,
      date_from: new Date(dto.date_from),
      date_to: new Date(dto.date_to),
      report_type: dto.report_type || ReportTypeEnum.DAILY,
      generated_at: new Date(),
      stores: storesData.map((s) => ({
        store_id: s.store_id,
        store_name: s.store_name,
        store_code: s.store_code,
        metrics: {
          total_sales: s.total_sales,
          total_revenue: s.total_revenue,
          total_orders: s.total_orders,
          average_ticket: s.average_ticket,
          total_quantity: 0,
        },
        rank_by_sales: bySales.findIndex((x) => x.store_id === s.store_id) + 1,
        rank_by_orders: byOrders.findIndex((x) => x.store_id === s.store_id) + 1,
        rank_by_ticket: byTicket.findIndex((x) => x.store_id === s.store_id) + 1,
      })),
      stores_count: storesCount,
      totals,
      averages,
      best_store: {
        by_sales: this.mapStoreComparison(bySales[0]),
        by_orders: this.mapStoreComparison(byOrders[0]),
        by_ticket: this.mapStoreComparison(byTicket[0]),
      },
      worst_store: {
        by_sales: this.mapStoreComparison(bySales[bySales.length - 1]),
        by_orders: this.mapStoreComparison(byOrders[byOrders.length - 1]),
        by_ticket: this.mapStoreComparison(byTicket[byTicket.length - 1]),
      },
    };
  }

  private async comparePeriods(dto: CompareReportsDto, user: UserSessionDto): Promise<any> {
    let storeIds: string[] = [];

    if (dto.store_id) {
      await this.validateStoreAccess(dto.store_id, user);
      storeIds = [dto.store_id];
    } else if (dto.company_id) {
      this.validateCompanyAccess(dto.company_id, user);
      const stores = await this.storeRepository.findByCompany(dto.company_id);
      storeIds = stores.map((s) => s.id);
    }

    // Validar que las fechas estén presentes
    if (!dto.date_from || !dto.date_to || !dto.compare_date_from || !dto.compare_date_to) {
      this.handleError.badRequest('Se requieren todas las fechas para comparar períodos');
    }

    const comparison = await this.reportsRepository.comparePeriods(
      storeIds,
      { dateFrom: dto.date_from, dateTo: dto.date_to },
      { dateFrom: dto.compare_date_from, dateTo: dto.compare_date_to },
    );

    return {
      comparison_type: ComparisonTypeEnum.PERIODS,
      store_id: dto.store_id,
      company_id: dto.company_id,
      generated_at: new Date(),
      periods: [
        {
          period_label: 'Período Actual',
          date_from: new Date(dto.date_from),
          date_to: new Date(dto.date_to),
          metrics: comparison.current,
        },
        {
          period_label: 'Período Anterior',
          date_from: new Date(dto.compare_date_from),
          date_to: new Date(dto.compare_date_to),
          metrics: comparison.previous,
        },
      ],
      differences: {
        total_sales: this.calculateDifference(
          comparison.previous.total_sales,
          comparison.current.total_sales,
        ),
        total_revenue: this.calculateDifference(
          comparison.previous.total_revenue,
          comparison.current.total_revenue,
        ),
        total_orders: this.calculateDifference(
          comparison.previous.total_orders,
          comparison.current.total_orders,
        ),
        average_ticket: this.calculateDifference(
          comparison.previous.average_ticket,
          comparison.current.average_ticket,
        ),
      },
    };
  }

  private async compareDaysOfWeek(dto: CompareReportsDto, user: UserSessionDto): Promise<any> {
    let storeIds: string[] = [];

    if (dto.store_id) {
      await this.validateStoreAccess(dto.store_id, user);
      storeIds = [dto.store_id];
    } else if (dto.company_id) {
      this.validateCompanyAccess(dto.company_id, user);
      const stores = await this.storeRepository.findByCompany(dto.company_id);
      storeIds = stores.map((s) => s.id);
    }

    // Validar que las fechas estén presentes
    if (!dto.date_from || !dto.date_to) {
      this.handleError.badRequest('Se requieren date_from y date_to');
    }

    const daysData = await this.reportsRepository.compareByDayOfWeek(
      storeIds,
      dto.date_from,
      dto.date_to,
    );

    const bySales = [...daysData].sort((a, b) => b.average_sales - a.average_sales);

    return {
      comparison_type: ComparisonTypeEnum.DAYS_OF_WEEK,
      store_id: dto.store_id,
      company_id: dto.company_id,
      date_from: new Date(dto.date_from),
      date_to: new Date(dto.date_to),
      generated_at: new Date(),
      days: daysData.map((d) => ({
        day_of_week: d.day_of_week,
        day_name: d.day_name,
        occurrences: d.occurrences,
        metrics: {
          total_sales: d.total_sales,
          total_revenue: 0,
          total_orders: d.total_orders,
          average_ticket: d.total_orders > 0 ? d.total_sales / d.total_orders : 0,
          total_quantity: 0,
        },
        averages: {
          total_sales: d.average_sales,
          total_revenue: 0,
          total_orders: d.total_orders / d.occurrences,
          average_ticket: 0,
          total_quantity: 0,
        },
      })),
      best_day: {
        by_sales: daysData.find((d) => d.day_of_week === bySales[0]?.day_of_week),
        by_orders: daysData.find(
          (d) =>
            d.day_of_week ===
            [...daysData].sort((a, b) => b.total_orders - a.total_orders)[0]?.day_of_week,
        ),
      },
      worst_day: {
        by_sales: daysData.find((d) => d.day_of_week === bySales[bySales.length - 1]?.day_of_week),
        by_orders: daysData.find(
          (d) =>
            d.day_of_week ===
            [...daysData].sort((a, b) => a.total_orders - b.total_orders)[0]?.day_of_week,
        ),
      },
    };
  }

  private async compareYearOverYear(dto: CompareReportsDto, user: UserSessionDto): Promise<any> {
    // Calcular fechas del año anterior
    const currentYear = new Date(dto.date_from).getFullYear();
    const previousYearFrom = dto.date_from.replace(String(currentYear), String(currentYear - 1));
    const previousYearTo = dto.date_to.replace(String(currentYear), String(currentYear - 1));

    return await this.comparePeriods(
      {
        ...dto,
        compare_date_from: previousYearFrom,
        compare_date_to: previousYearTo,
        comparison_type: ComparisonTypeEnum.YEAR_OVER_YEAR,
      },
      user,
    );
  }

  private async compareMonthOverMonth(dto: CompareReportsDto, user: UserSessionDto): Promise<any> {
    // Calcular fechas del mes anterior
    const currentDate = new Date(dto.date_from);
    currentDate.setMonth(currentDate.getMonth() - 1);
    const previousMonthFrom = currentDate.toISOString().split('T')[0];

    const endDate = new Date(dto.date_to);
    endDate.setMonth(endDate.getMonth() - 1);
    const previousMonthTo = endDate.toISOString().split('T')[0];

    return await this.comparePeriods(
      {
        ...dto,
        compare_date_from: previousMonthFrom,
        compare_date_to: previousMonthTo,
        comparison_type: ComparisonTypeEnum.MONTH_OVER_MONTH,
      },
      user,
    );
  }

  // ============================================
  // SECCIÓN 4: RANKINGS
  // ============================================

  /**
   * Obtener ranking de tiendas
   *
   * @param dto - Parámetros del ranking
   * @param user - Usuario que consulta
   * @returns IStoreRankingResponse
   */
  async getRankingStores(
    dto: RankingStoresDto,
    user: UserSessionDto,
  ): Promise<IStoreRankingResponse> {
    this.logger.log(`Obteniendo ranking de tiendas: métrica=${dto.metric}`);

    // Validar acceso según rol
    if (dto.company_id) {
      this.validateCompanyAccess(dto.company_id, user);
    } else if (!hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      // Si no es admin, forzar filtro por su compañía
      if (hasRole(user.roles, ROLES.MANAGER) && user.companyId) {
        dto.company_id = user.companyId;
      } else {
        this.handleError.forbidden('No tiene permisos para ver ranking global');
      }
    }

    const items = await this.reportsRepository.getRankingByStores(dto);

    // Calcular totales
    const totalSum = items.reduce((sum, i) => sum + i.metric_value, 0);
    const values = items.map((i) => i.metric_value);

    const direction = dto.direction || RankingDirectionEnum.TOP;

    return {
      metric: dto.metric,
      metric_label: this.getMetricLabel(dto.metric),
      direction: direction,
      direction_label: direction === RankingDirectionEnum.TOP ? 'Top' : 'Bottom',
      date_from: new Date(dto.date_from),
      date_to: new Date(dto.date_to),
      report_type: dto.report_type || ReportTypeEnum.DAILY,
      filters: {
        company_id: dto.company_id,
        only_active: dto.only_active !== false,
      },
      generated_at: new Date(),
      items: items.map((i) => ({
        position: i.position,
        store_id: i.store_id,
        store_name: i.store_name,
        store_code: i.store_code,
        store_city: i.store_city,
        company_id: i.company_id,
        company_name: i.company_name,
        metric_value: i.metric_value,
        metric_formatted: this.formatMetricValue(i.metric_value, dto.metric),
        secondary_metrics: {
          total_sales: i.total_sales,
          total_revenue: i.total_revenue,
          total_orders: i.total_orders,
          average_ticket: i.average_ticket,
        },
        percentage_of_total: totalSum > 0 ? (i.metric_value / totalSum) * 100 : 0,
      })),
      total_items: items.length,
      limit: dto.limit || 10,
      totals: {
        sum: totalSum,
        average: items.length > 0 ? totalSum / items.length : 0,
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 0,
      },
      excluded_stores_count: 0, // Se podría calcular si es necesario
    };
  }

  /**
   * Obtener ranking de compañías
   *
   * @param dto - Parámetros del ranking
   * @param user - Usuario que consulta
   * @returns ICompanyRankingResponse
   */
  async getRankingCompanies(
    dto: RankingCompaniesDto,
    user: UserSessionDto,
  ): Promise<ICompanyRankingResponse> {
    // Solo SUPER_ADMIN y ADMIN pueden ver ranking de compañías
    if (!hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      this.handleError.forbidden('No tiene permisos para ver ranking de compañías');
    }

    const items = await this.reportsRepository.getRankingByCompanies(
      dto.date_from,
      dto.date_to,
      dto.metric,
      dto.direction,
      dto.limit,
    );

    const totalSum = items.reduce((sum, i) => sum + i.metric_value, 0);
    const values = items.map((i) => i.metric_value);
    const totalStores = items.reduce((sum, i) => sum + i.stores_count, 0);

    const direction = dto.direction || RankingDirectionEnum.TOP;

    return {
      metric: dto.metric,
      metric_label: this.getMetricLabel(dto.metric),
      direction: direction,
      direction_label: direction === RankingDirectionEnum.TOP ? 'Top' : 'Bottom',
      date_from: new Date(dto.date_from),
      date_to: new Date(dto.date_to),
      generated_at: new Date(),
      items: items.map((i) => ({
        position: i.position,
        company_id: i.company_id,
        company_name: i.company_name,
        metric_value: i.metric_value,
        metric_formatted: this.formatMetricValue(i.metric_value, dto.metric),
        secondary_metrics: {
          total_sales: i.total_sales,
          total_revenue: i.total_revenue,
          total_orders: i.total_orders,
          stores_count: i.stores_count,
        },
        percentage_of_total: totalSum > 0 ? (i.metric_value / totalSum) * 100 : 0,
      })),
      total_items: items.length,
      limit: dto.limit || 10,
      totals: {
        sum: totalSum,
        average: items.length > 0 ? totalSum / items.length : 0,
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 0,
        total_stores: totalStores,
      },
    };
  }

  /**
   * Ranking rápido de tiendas
   *
   * @param dto - Parámetros rápidos
   * @param user - Usuario que consulta
   * @returns IQuickStoreRankingResponse
   */
  async quickRanking(
    dto: QuickRankingDto,
    user: UserSessionDto,
  ): Promise<IQuickStoreRankingResponse> {
    const { dateFrom, dateTo, label } = this.getPeriodDates(dto.period);

    const rankingDto: RankingStoresDto = {
      metric: dto.metric || RankingMetricEnum.TOTAL_SALES,
      direction: RankingDirectionEnum.TOP,
      limit: 3,
      date_from: dateFrom,
      date_to: dateTo,
      company_id: dto.company_id,
      only_active: true,
    };

    const ranking = await this.getRankingStores(rankingDto, user);

    return {
      period_label: label,
      metric_label: ranking.metric_label,
      top_3: ranking.items.slice(0, 3).map((i) => ({
        position: i.position,
        store_name: i.store_name,
        store_code: i.store_code,
        value: i.metric_value,
        value_formatted:
          i.metric_formatted || this.formatMetricValue(i.metric_value, rankingDto.metric),
      })),
      total_stores: ranking.total_items,
      total_value: ranking.totals.sum,
      average_value: ranking.totals.average,
    };
  }

  // ============================================
  // SECCIÓN 5: ESTADÍSTICAS
  // ============================================

  /**
   * Obtener estadísticas globales
   *
   * @param user - Usuario que consulta
   * @returns IReportStatsResponse
   */
  async getGlobalStats(user: UserSessionDto): Promise<IReportStatsResponse> {
    // Solo SUPER_ADMIN y ADMIN pueden ver stats globales
    if (!hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      this.handleError.forbidden('No tiene permisos para ver estadísticas globales');
    }

    const stats = await this.reportsRepository.getGlobalStats();

    // Obtener stats del mes actual
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthEnd = today.toISOString().split('T')[0];

    const periodStats = await this.reportsRepository.getPeriodStats(monthStart, monthEnd);

    return {
      total_reports: stats.total_reports,
      reports_today: stats.reports_today,
      reports_this_week: stats.reports_this_week,
      reports_this_month: stats.reports_this_month,
      total_sales: periodStats.total_sales,
      total_revenue: periodStats.total_revenue,
      total_orders: periodStats.total_orders,
      total_quantity: 0,
      average_daily_sales: periodStats.average_daily_sales,
      average_daily_orders: periodStats.total_orders / (periodStats.days_with_reports || 1),
      average_ticket: periodStats.average_ticket,
      reports_by_type: [],
      reports_by_status: [],
    };
  }

  /**
   * Obtener tendencias
   *
   * @param storeId - UUID de tienda (opcional)
   * @param companyId - UUID de compañía (opcional)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param groupBy - Agrupar por día/semana/mes
   * @param user - Usuario que consulta
   */
  async getTrends(
    storeId: string | undefined,
    companyId: string | undefined,
    dateFrom: string,
    dateTo: string,
    groupBy: 'day' | 'week' | 'month',
    user: UserSessionDto,
  ): Promise<any> {
    let storeIds: string[] = [];

    if (storeId) {
      await this.validateStoreAccess(storeId, user);
      storeIds = [storeId];
    } else if (companyId) {
      this.validateCompanyAccess(companyId, user);
      const stores = await this.storeRepository.findByCompany(companyId);
      storeIds = stores.map((s) => s.id);
    } else if (hasRole(user.roles, ROLES.USER)) {
      const stores = await this.storeRepository.findByUserId(user.id);
      storeIds = stores.map((s) => s.id);
    }

    const data = await this.reportsRepository.getTrends(storeIds, dateFrom, dateTo, groupBy);

    // Calcular tendencia
    let salesTrend: 'up' | 'down' | 'stable' = 'stable';
    let salesTrendPercentage = 0;

    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));

      const firstAvg = firstHalf.reduce((sum, d) => sum + d.total_sales, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.total_sales, 0) / secondHalf.length;

      salesTrendPercentage = this.calculatePercentageChange(firstAvg, secondAvg);

      if (salesTrendPercentage > 5) salesTrend = 'up';
      else if (salesTrendPercentage < -5) salesTrend = 'down';
    }

    return {
      period: groupBy,
      date_from: new Date(dateFrom),
      date_to: new Date(dateTo),
      data: data.map((d) => ({
        date: d.period,
        total_sales: d.total_sales,
        total_revenue: d.total_revenue,
        orders_count: d.total_orders,
        average_ticket: d.average_ticket,
      })),
      sales_trend: salesTrend,
      sales_trend_percentage: salesTrendPercentage,
      orders_trend: salesTrend, // Simplificado
      orders_trend_percentage: salesTrendPercentage,
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS: VALIDACIONES
  // ============================================

  private async validateStoreAccess(storeId: string, user: UserSessionDto): Promise<void> {
    // SUPER_ADMIN y ADMIN tienen acceso a todo
    if (hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      return;
    }

    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      this.handleError.notFound('Tienda', storeId);
    }

    // MANAGER puede acceder a tiendas de su compañía
    if (hasRole(user.roles, ROLES.MANAGER)) {
      if (store.company_id !== user.companyId) {
        this.handleError.forbidden('No tiene acceso a esta tienda');
      }
      return;
    }

    // USER solo puede acceder a sus tiendas asignadas
    const userStores = await this.storeRepository.findByUserId(user.id);
    const hasAccess = userStores.some((s) => s.id === storeId);

    if (!hasAccess) {
      this.handleError.forbidden('No tiene acceso a esta tienda');
    }
  }

  private validateCompanyAccess(companyId: string, user: UserSessionDto): void {
    // SUPER_ADMIN y ADMIN tienen acceso a todo
    if (hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      return;
    }

    // MANAGER solo puede acceder a su compañía
    if (hasRole(user.roles, ROLES.MANAGER)) {
      if (companyId !== user.companyId) {
        this.handleError.forbidden('No tiene acceso a esta compañía');
      }
      return;
    }

    // USER no puede acceder a nivel compañía
    this.handleError.forbidden('No tiene permisos para acceder a datos de compañía');
  }

  private async validateConsolidationAccess(
    dto: ConsolidateReportsDto,
    user: UserSessionDto,
  ): Promise<void> {
    switch (dto.consolidation_level) {
      case ConsolidationLevelEnum.ALL_COMPANIES:
        if (!hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
          this.handleError.forbidden('No tiene permisos para consolidación global');
        }
        break;
      case ConsolidationLevelEnum.COMPANY:
        if (dto.company_id) {
          this.validateCompanyAccess(dto.company_id, user);
        }
        break;
      case ConsolidationLevelEnum.STORE:
        if (dto.store_id) {
          await this.validateStoreAccess(dto.store_id, user);
        }
        break;
    }
  }

  private async applyRoleFilters(
    query: QueryReportDto,
    user: UserSessionDto,
  ): Promise<QueryReportDto> {
    const filteredQuery = Object.assign(new QueryReportDto(), query);

    if (hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
      return filteredQuery;
    }

    if (hasRole(user.roles, ROLES.MANAGER)) {
      filteredQuery.company_id = user.companyId ?? undefined;
      return filteredQuery;
    }

    // USER - filtrar por tiendas asignadas
    const userStores = await this.storeRepository.findByUserId(user.id);
    filteredQuery.store_ids = userStores.map((s) => s.id);

    return filteredQuery;
  }

  // ============================================
  // MÉTODOS PRIVADOS: HELPERS
  // ============================================

  private prepareReportData(dto: CreateReportDto): any {
    return {
      store_id: dto.store_id,
      report_date: dto.report_date,
      report_type: dto.report_type || ReportTypeEnum.DAILY,
      total_sales: dto.total_sales,
      total_revenue: dto.total_revenue,
      total_quantity: dto.total_quantity,
      orders_count: dto.orders_count,
      average_ticket: dto.average_ticket,
      total_discounts: dto.total_discounts || 0,
      total_adjustments: dto.total_adjustments || 0,
      status: dto.status || ReportStatusEnum.DRAFT,
      metadata: dto.metadata,
      sales_by_order_type: dto.sales_by_order_type,
      payment_methods: dto.payment_methods,
      dynamic_discounts: dto.dynamic_discounts,
      adjustments: dto.adjustments,
      effective_orders: dto.effective_orders,
      shortage_overage: dto.shortage_overage,
    };
  }

  private toResponse(report: ReportHeaderEntity): IReportResponse {
    return {
      id: report.id,
      store_id: report.store_id,
      report_date: report.report_date,
      report_type: report.report_type,
      total_sales: report.total_sales,
      total_revenue: report.total_revenue,
      total_quantity: report.total_quantity,
      orders_count: report.orders_count,
      average_ticket: report.average_ticket,
      total_discounts: report.total_discounts,
      total_adjustments: report.total_adjustments,
      status: report.status as ReportStatusEnum,
      metadata: report.metadata,
      created_at: report.created_at,
      updated_at: report.updated_at,
    };
  }

  private toResponseWithStore(report: ReportHeaderEntity): IReportWithStoreResponse {
    return {
      ...this.toResponse(report),
      store: report.store
        ? {
            id: report.store.id,
            nombre: report.store.nombre,
            codigo: report.store.codigo,
            ciudad: report.store.ciudad,
            company_id: report.store.company_id,
            company_name: report.store.company?.name,
          }
        : undefined,
    };
  }

  private toResponseWithDetails(report: ReportHeaderEntity): IReportWithDetailsResponse {
    return {
      ...this.toResponseWithStore(report),
      sales_by_order_type: report.sales_by_order_type?.map((s) => ({
        id: s.id,
        report_header_id: s.report_header_id,
        order_type: s.order_type,
        total_sales: s.total_sales,
        orders_count: s.orders_count,
        quantity: s.quantity,
        average_ticket: s.average_ticket,
        net_percentage: s.net_percentage,
        quantity_percentage: s.quantity_percentage,
        created_at: s.created_at,
      })),
      payment_methods: report.payment_methods?.map((p) => ({
        id: p.id,
        report_header_id: p.report_header_id,
        payment_method: p.payment_method,
        total_amount: p.total_amount,
        transactions_count: p.transactions_count,
        average_amount: p.average_amount,
        created_at: p.created_at,
      })),
      dynamic_discounts: report.dynamic_discounts?.map((d) => ({
        id: d.id,
        report_header_id: d.report_header_id,
        discount_type: d.discount_type,
        discount_name: d.discount_name,
        total_discount: d.total_discount,
        times_applied: d.times_applied,
        average_discount: d.average_discount,
        created_at: d.created_at,
      })),
      adjustments: report.adjustments?.map((a) => ({
        id: a.id,
        report_header_id: a.report_header_id,
        adjustment_type: a.adjustment_type,
        reason: a.reason,
        total_amount: a.total_amount,
        count: a.count,
        average_amount: a.average_amount,
        created_at: a.created_at,
      })),
      effective_orders: report.effective_orders?.map((e) => ({
        id: e.id,
        report_header_id: e.report_header_id,
        order_number: e.order_number,
        order_type: e.order_type,
        total_amount: e.total_amount,
        gross_amount: e.gross_amount,
        discounts: e.discounts,
        items_count: e.items_count,
        payment_method: e.payment_method,
        order_datetime: e.order_datetime,
        status: e.status,
        metadata: e.metadata,
        created_at: e.created_at,
      })),
      shortage_overage: report.shortage_overage?.map((s) => ({
        id: s.id,
        report_header_id: s.report_header_id,
        receptacle_type: s.receptacle_type,
        receptacle_name: s.receptacle_name,
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        counted_at: s.counted_at,
        expected_amount: s.expected_amount,
        counted_amount: s.counted_amount,
        variance_amount: s.variance_amount,
        variance_type: s.variance_type,
        reason: s.reason,
        class_name: s.class_name,
        currency: s.currency,
        created_at: s.created_at,
      })),
    };
  }

  private calculateDifference(previous: number, current: number): IValueDifference {
    const absolute = current - previous;
    const percentage =
      previous !== 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

    return {
      absolute,
      percentage,
      direction: absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'same',
    };
  }

  private calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private getPeriodDates(period: string): { dateFrom: string; dateTo: string; label: string } {
    const today = new Date();
    let dateFrom: Date;
    let dateTo: Date = today;
    let label: string;

    switch (period) {
      case 'today':
        dateFrom = today;
        label = 'Hoy';
        break;
      case 'yesterday':
        dateFrom = new Date(today);
        dateFrom.setDate(dateFrom.getDate() - 1);
        dateTo = dateFrom;
        label = 'Ayer';
        break;
      case 'this_week':
        dateFrom = new Date(today);
        dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay());
        label = 'Esta Semana';
        break;
      case 'last_week':
        dateFrom = new Date(today);
        dateFrom.setDate(dateFrom.getDate() - dateFrom.getDay() - 7);
        dateTo = new Date(dateFrom);
        dateTo.setDate(dateTo.getDate() + 6);
        label = 'Semana Pasada';
        break;
      case 'this_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        label = 'Este Mes';
        break;
      case 'last_month':
        dateFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0);
        label = 'Mes Pasado';
        break;
      default:
        dateFrom = today;
        label = 'Hoy';
    }

    return {
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      label,
    };
  }

  private getPreviousPeriodDates(period: string): { dateFrom: string; dateTo: string } {
    const { dateFrom, dateTo } = this.getPeriodDates(period);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    const diff = to.getTime() - from.getTime();
    const days = diff / (1000 * 60 * 60 * 24) + 1;

    const previousTo = new Date(from);
    previousTo.setDate(previousTo.getDate() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - days + 1);

    return {
      dateFrom: previousFrom.toISOString().split('T')[0],
      dateTo: previousTo.toISOString().split('T')[0],
    };
  }

  private getQuickComparePeriods(type: string): {
    current: { dateFrom: string; dateTo: string };
    previous: { dateFrom: string; dateTo: string };
    currentLabel: string;
    previousLabel: string;
  } {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (type) {
      case 'today_vs_yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          current: { dateFrom: todayStr, dateTo: todayStr },
          previous: {
            dateFrom: yesterday.toISOString().split('T')[0],
            dateTo: yesterday.toISOString().split('T')[0],
          },
          currentLabel: 'Hoy',
          previousLabel: 'Ayer',
        };
      }
      case 'this_week_vs_last_week': {
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        const lastWeekStart = new Date(thisWeekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(thisWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        return {
          current: { dateFrom: thisWeekStart.toISOString().split('T')[0], dateTo: todayStr },
          previous: {
            dateFrom: lastWeekStart.toISOString().split('T')[0],
            dateTo: lastWeekEnd.toISOString().split('T')[0],
          },
          currentLabel: 'Esta Semana',
          previousLabel: 'Semana Pasada',
        };
      }
      case 'this_month_vs_last_month': {
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          current: { dateFrom: thisMonthStart.toISOString().split('T')[0], dateTo: todayStr },
          previous: {
            dateFrom: lastMonthStart.toISOString().split('T')[0],
            dateTo: lastMonthEnd.toISOString().split('T')[0],
          },
          currentLabel: 'Este Mes',
          previousLabel: 'Mes Pasado',
        };
      }
      default:
        return this.getQuickComparePeriods('today_vs_yesterday');
    }
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayOfWeek] || '';
  }

  private getMetricLabel(metric: RankingMetricEnum): string {
    switch (metric) {
      case RankingMetricEnum.TOTAL_SALES:
        return 'Ventas Totales';
      case RankingMetricEnum.TOTAL_REVENUE:
        return 'Ingresos Totales';
      case RankingMetricEnum.ORDERS_COUNT:
        return 'Cantidad de Órdenes';
      case RankingMetricEnum.AVERAGE_TICKET:
        return 'Ticket Promedio';
      case RankingMetricEnum.TOTAL_QUANTITY:
        return 'Cantidad Total';
      default:
        return 'Métrica';
    }
  }

  private formatMetricValue(value: number, metric: RankingMetricEnum): string {
    switch (metric) {
      case RankingMetricEnum.TOTAL_SALES:
      case RankingMetricEnum.TOTAL_REVENUE:
      case RankingMetricEnum.AVERAGE_TICKET:
        return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
      case RankingMetricEnum.ORDERS_COUNT:
      case RankingMetricEnum.TOTAL_QUANTITY:
        return value.toLocaleString('es-CO');
      default:
        return value.toString();
    }
  }

  private mapStoreComparison(store: any): any {
    if (!store) return null;
    return {
      store_id: store.store_id,
      store_name: store.store_name,
      store_code: store.store_code,
      metrics: {
        total_sales: store.total_sales,
        total_revenue: store.total_revenue,
        total_orders: store.total_orders,
        average_ticket: store.average_ticket,
        total_quantity: 0,
      },
      rank_by_sales: 0,
      rank_by_orders: 0,
      rank_by_ticket: 0,
    };
  }

  private generateComparisonSummary(comparison: any): string {
    const salesChange = this.calculatePercentageChange(
      comparison.previous.total_sales,
      comparison.current.total_sales,
    );

    if (salesChange > 0) {
      return `Las ventas aumentaron ${salesChange.toFixed(1)}% respecto al período anterior`;
    } else if (salesChange < 0) {
      return `Las ventas disminuyeron ${Math.abs(salesChange).toFixed(1)}% respecto al período anterior`;
    } else {
      return 'Las ventas se mantuvieron estables respecto al período anterior';
    }
  }
}
