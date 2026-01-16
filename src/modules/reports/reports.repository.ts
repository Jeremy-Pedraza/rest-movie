// src/modules/reports/reports.repository.ts

/**
 * @fileoverview Repository para módulo de reportes
 * @module modules/reports
 *
 * ARQUITECTURA MULTI-TENANT (FASE 5):
 *
 * Estado actual:
 * - Las 6 tablas de reportes están en schema PUBLIC
 * - Se usa createStaticQueryBuilder() para todas las queries
 * - Las relaciones con stores/companies funcionan normalmente
 *
 * Estado futuro (cuando se muevan tablas a tenant schemas):
 * - Las tablas de reportes vivirán en el schema de cada tenant
 * - Se usará withSchema() para queries con schema dinámico
 * - La relación con stores será cross-schema (tenant → public)
 *
 * Patrón actual:
 * ```typescript
 * // Queries a schema public (estado actual)
 * const reports = await this.createStaticQueryBuilder('report')...
 * ```
 *
 * Patrón futuro:
 * ```typescript
 * // Queries a schema del tenant
 * const reports = await this.withSchema(async (manager) => {
 *   return manager.find(ReportHeaderEntity, { where: { store_id } });
 * });
 * ```
 *
 * @version 3.1.0 - FASE 5: Documentación multi-tenant actualizada
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ReportHeaderEntity,
  SalesByOrderTypeEntity,
  PaymentMethodEntity,
  DynamicDiscountEntity,
  AdjustmentEntity,
  EffectiveOrderEntity,
} from './entities';
import { ReportTypeEnum } from './enums';
import { QueryReportDto, RankingStoresDto, RankingMetricEnum, RankingDirectionEnum } from './dto';
import { BaseRepository, SchemaContext } from '@shared/database';

/**
 * ReportsRepository
 *
 * @description
 * Maneja todas las operaciones de base de datos para el módulo de reportes.
 * Extiende BaseRepository para soporte multi-tenant.
 *
 * NOTA IMPORTANTE - MULTI-TENANT:
 * Actualmente las tablas están en schema PUBLIC y se usa createStaticQueryBuilder().
 * Cuando se migre a schemas por tenant, se cambiará a withSchema().
 *
 * Secciones:
 * - CRUD básico (create, findAll, findById, update, delete)
 * - Búsquedas específicas (por tienda, compañía, fecha)
 * - Consolidaciones multi-nivel (store, company, all_companies)
 * - Comparativas temporales y entre tiendas
 * - Rankings y estadísticas
 * - Operaciones con entidades de detalle
 */
@Injectable()
export class ReportsRepository extends BaseRepository<ReportHeaderEntity> {
  constructor(
    @InjectRepository(ReportHeaderEntity)
    repository: Repository<ReportHeaderEntity>,
    schemaContext: SchemaContext,

    @InjectRepository(SalesByOrderTypeEntity)
    private readonly salesByOrderTypeRepo: Repository<SalesByOrderTypeEntity>,

    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodRepo: Repository<PaymentMethodEntity>,

    @InjectRepository(DynamicDiscountEntity)
    private readonly discountRepo: Repository<DynamicDiscountEntity>,

    @InjectRepository(AdjustmentEntity)
    private readonly adjustmentRepo: Repository<AdjustmentEntity>,

    @InjectRepository(EffectiveOrderEntity)
    private readonly effectiveOrderRepo: Repository<EffectiveOrderEntity>,
  ) {
    super(repository, schemaContext);
  }

  // ============================================
  // QUERY BUILDERS HELPERS
  // ============================================

  /**
   * Query builder para SalesByOrderType
   */
  private createSalesOrderTypeQB(alias: string): SelectQueryBuilder<SalesByOrderTypeEntity> {
    return this.salesByOrderTypeRepo.createQueryBuilder(alias);
  }

  /**
   * Query builder para PaymentMethod
   */
  private createPaymentMethodQB(alias: string): SelectQueryBuilder<PaymentMethodEntity> {
    return this.paymentMethodRepo.createQueryBuilder(alias);
  }

  // ============================================
  // SECCIÓN 1: CRUD BÁSICO
  // ============================================

  /**
   * Crear reporte con sus detalles
   *
   * @param data - Datos del reporte (header + detalles opcionales)
   * @returns ReportHeaderEntity creado
   */
  async create(
    data: Partial<ReportHeaderEntity> & {
      sales_by_order_type?: Partial<SalesByOrderTypeEntity>[];
      payment_methods?: Partial<PaymentMethodEntity>[];
      dynamic_discounts?: Partial<DynamicDiscountEntity>[];
      adjustments?: Partial<AdjustmentEntity>[];
      effective_orders?: Partial<EffectiveOrderEntity>[];
    },
  ): Promise<ReportHeaderEntity> {
    // Extraer detalles
    const {
      sales_by_order_type,
      payment_methods,
      dynamic_discounts,
      adjustments,
      effective_orders,
      ...headerData
    } = data;

    // Crear header
    const report = this.repository.create(headerData);
    const savedReport = await this.repository.save(report);

    // Crear detalles si existen
    if (sales_by_order_type?.length) {
      const entities = sales_by_order_type.map((item) => ({
        ...item,
        report_header_id: savedReport.id,
      }));
      await this.salesByOrderTypeRepo.save(entities);
    }

    if (payment_methods?.length) {
      const entities = payment_methods.map((item) => ({
        ...item,
        report_header_id: savedReport.id,
      }));
      await this.paymentMethodRepo.save(entities);
    }

    if (dynamic_discounts?.length) {
      const entities = dynamic_discounts.map((item) => ({
        ...item,
        report_header_id: savedReport.id,
      }));
      await this.discountRepo.save(entities);
    }

    if (adjustments?.length) {
      const entities = adjustments.map((item) => ({
        ...item,
        report_header_id: savedReport.id,
      }));
      await this.adjustmentRepo.save(entities);
    }

    if (effective_orders?.length) {
      const entities = effective_orders.map((item) => ({
        ...item,
        report_header_id: savedReport.id,
      }));
      await this.effectiveOrderRepo.save(entities);
    }

    return savedReport;
  }

  /**
   * Buscar reportes con filtros y paginación
   *
   * @param query - Filtros y opciones de paginación
   * @returns Tupla [reportes, total]
   */
  async findAll(query: QueryReportDto): Promise<[ReportHeaderEntity[], number]> {
    const qb = this.createStaticQueryBuilder('report');

    // Joins opcionales
    if (query.include_store || query.company_id) {
      qb.leftJoinAndSelect('report.store', 'store');
      if (query.company_id) {
        qb.leftJoin('store.company', 'company');
      }
    }

    // Filtros por entidad
    if (query.store_id) {
      qb.andWhere('report.store_id = :store_id', { store_id: query.store_id });
    }

    if (query.store_ids?.length) {
      qb.andWhere('report.store_id IN (:...store_ids)', { store_ids: query.store_ids });
    }

    if (query.company_id) {
      qb.andWhere('store.company_id = :company_id', { company_id: query.company_id });
    }

    // Filtros por fecha
    if (query.date_from && query.date_to) {
      qb.andWhere('report.report_date BETWEEN :date_from AND :date_to', {
        date_from: query.date_from,
        date_to: query.date_to,
      });
    } else if (query.date_from) {
      qb.andWhere('report.report_date >= :date_from', { date_from: query.date_from });
    } else if (query.date_to) {
      qb.andWhere('report.report_date <= :date_to', { date_to: query.date_to });
    }

    if (query.report_date) {
      qb.andWhere('report.report_date = :report_date', { report_date: query.report_date });
    }

    // Filtros por tipo y estado
    if (query.report_type) {
      qb.andWhere('report.report_type = :report_type', { report_type: query.report_type });
    }

    if (query.status) {
      qb.andWhere('report.status = :status', { status: query.status });
    }

    // Filtros por métricas
    if (query.min_sales !== undefined) {
      qb.andWhere('report.total_sales >= :min_sales', { min_sales: query.min_sales });
    }

    if (query.max_sales !== undefined) {
      qb.andWhere('report.total_sales <= :max_sales', { max_sales: query.max_sales });
    }

    if (query.min_orders !== undefined) {
      qb.andWhere('report.orders_count >= :min_orders', { min_orders: query.min_orders });
    }

    // Cargar relaciones opcionales
    if (query.include_sales_by_order_type || query.include_all) {
      qb.leftJoinAndSelect('report.sales_by_order_type', 'salesByOrderType');
    }

    if (query.include_payment_methods || query.include_all) {
      qb.leftJoinAndSelect('report.payment_methods', 'paymentMethods');
    }

    if (query.include_discounts || query.include_all) {
      qb.leftJoinAndSelect('report.dynamic_discounts', 'discounts');
    }

    if (query.include_adjustments || query.include_all) {
      qb.leftJoinAndSelect('report.adjustments', 'adjustments');
    }

    if (query.include_effective_orders || query.include_all) {
      qb.leftJoinAndSelect('report.effective_orders', 'effectiveOrders');
    }

    // Ordenamiento
    const sortBy = query.sortBy || 'report_date';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`report.${sortBy}`, sortOrder);

    // Paginación
    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    return await qb.getManyAndCount();
  }

  /**
   * Buscar reporte por ID
   *
   * @param id - UUID del reporte
   * @param includeDetails - Cargar entidades de detalle
   * @returns ReportHeaderEntity o null
   */
  async findById(id: string, includeDetails = false): Promise<ReportHeaderEntity | null> {
    const qb = this.createStaticQueryBuilder('report')
      .leftJoinAndSelect('report.store', 'store')
      .where('report.id = :id', { id });

    if (includeDetails) {
      qb.leftJoinAndSelect('report.sales_by_order_type', 'salesByOrderType')
        .leftJoinAndSelect('report.payment_methods', 'paymentMethods')
        .leftJoinAndSelect('report.dynamic_discounts', 'discounts')
        .leftJoinAndSelect('report.adjustments', 'adjustments')
        .leftJoinAndSelect('report.effective_orders', 'effectiveOrders');
    }

    return await qb.getOne();
  }

  /**
   * Buscar reporte por tienda y fecha
   *
   * @param storeId - UUID de la tienda
   * @param reportDate - Fecha del reporte
   * @param reportType - Tipo de reporte (opcional)
   * @returns ReportHeaderEntity o null
   */
  async findByStoreAndDate(
    storeId: string,
    reportDate: string,
    reportType?: ReportTypeEnum,
  ): Promise<ReportHeaderEntity | null> {
    const qb = this.createStaticQueryBuilder('report')
      .where('report.store_id = :storeId', { storeId })
      .andWhere('report.report_date = :reportDate', { reportDate });

    if (reportType) {
      qb.andWhere('report.report_type = :reportType', { reportType });
    }

    return await qb.getOne();
  }

  /**
   * Verificar si existe reporte
   *
   * @param storeId - UUID de la tienda
   * @param reportDate - Fecha del reporte
   * @param excludeId - ID a excluir (para updates)
   * @returns true si existe
   */
  async exists(storeId: string, reportDate: string, excludeId?: string): Promise<boolean> {
    const qb = this.createStaticQueryBuilder('report')
      .where('report.store_id = :storeId', { storeId })
      .andWhere('report.report_date = :reportDate', { reportDate });

    if (excludeId) {
      qb.andWhere('report.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  /**
   * Actualizar reporte
   *
   * @param id - UUID del reporte
   * @param data - Datos parciales a actualizar
   * @returns ReportHeaderEntity actualizado o null
   */
  async update(id: string, data: Partial<ReportHeaderEntity>): Promise<ReportHeaderEntity | null> {
    // Construir objeto solo con campos escalares (excluir relaciones)
    const updateData: Record<string, unknown> = {};
    const scalarFields = [
      'store_id',
      'report_date',
      'report_type',
      'total_sales',
      'total_revenue',
      'total_quantity',
      'orders_count',
      'average_ticket',
      'total_discounts',
      'total_adjustments',
      'status',
      'metadata',
    ];

    for (const field of scalarFields) {
      if (field in data) {
        updateData[field] = data[field as keyof ReportHeaderEntity];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(id, updateData);
    }

    return await this.findById(id);
  }

  /**
   * Eliminar reporte (hard delete con CASCADE)
   *
   * @param id - UUID del reporte
   * @returns true si se eliminó
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ============================================
  // SECCIÓN 2: BÚSQUEDAS ESPECÍFICAS
  // ============================================

  /**
   * Buscar reportes por tienda
   *
   * @param storeId - UUID de la tienda
   * @param dateFrom - Fecha inicio (opcional)
   * @param dateTo - Fecha fin (opcional)
   * @returns Array de reportes
   */
  async findByStore(
    storeId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ReportHeaderEntity[]> {
    const qb = this.createStaticQueryBuilder('report').where('report.store_id = :storeId', {
      storeId,
    });

    if (dateFrom && dateTo) {
      qb.andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
    }

    return await qb.orderBy('report.report_date', 'DESC').getMany();
  }

  /**
   * Buscar reportes por compañía (todas sus tiendas)
   *
   * @param companyId - UUID de la compañía
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @returns Array de reportes
   */
  async findByCompany(
    companyId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<ReportHeaderEntity[]> {
    return await this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .leftJoinAndSelect('report.store', 'storeSelect')
      .where('store.company_id = :companyId', { companyId })
      .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .orderBy('report.report_date', 'DESC')
      .addOrderBy('store.nombre', 'ASC')
      .getMany();
  }

  /**
   * Buscar reportes por rango de fechas
   *
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param reportType - Tipo de reporte (opcional)
   * @returns Array de reportes
   */
  async findByDateRange(
    dateFrom: string,
    dateTo: string,
    reportType?: ReportTypeEnum,
  ): Promise<ReportHeaderEntity[]> {
    const qb = this.createStaticQueryBuilder('report')
      .leftJoinAndSelect('report.store', 'store')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (reportType) {
      qb.andWhere('report.report_type = :reportType', { reportType });
    }

    return await qb.orderBy('report.report_date', 'DESC').getMany();
  }

  /**
   * Obtener IDs de tiendas con reportes en un período
   *
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param companyId - Filtrar por compañía (opcional)
   * @returns Array de store_ids
   */
  async getStoreIdsWithReports(
    dateFrom: string,
    dateTo: string,
    companyId?: string,
  ): Promise<string[]> {
    const qb = this.createStaticQueryBuilder('report')
      .select('DISTINCT report.store_id', 'store_id')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (companyId) {
      qb.leftJoin('report.store', 'store').andWhere('store.company_id = :companyId', { companyId });
    }

    const result = await qb.getRawMany();
    return result.map((r) => r.store_id);
  }

  // ============================================
  // SECCIÓN 3: CONSOLIDACIONES
  // ============================================

  /**
   * Consolidar reportes de una tienda
   *
   * @param storeId - UUID de la tienda
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @returns Totales consolidados
   */
  async consolidateByStore(
    storeId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    total_sales: number;
    total_revenue: number;
    total_quantity: number;
    total_orders: number;
    total_discounts: number;
    total_adjustments: number;
    reports_count: number;
    days_count: number;
  }> {
    const result = await this.createStaticQueryBuilder('report')
      .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.total_quantity), 0)', 'total_quantity')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COALESCE(SUM(report.total_discounts), 0)', 'total_discounts')
      .addSelect('COALESCE(SUM(report.total_adjustments), 0)', 'total_adjustments')
      .addSelect('COUNT(*)', 'reports_count')
      .addSelect('COUNT(DISTINCT report.report_date)', 'days_count')
      .where('report.store_id = :storeId', { storeId })
      .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getRawOne();

    return {
      total_sales: parseFloat(result.total_sales) || 0,
      total_revenue: parseFloat(result.total_revenue) || 0,
      total_quantity: parseInt(result.total_quantity) || 0,
      total_orders: parseInt(result.total_orders) || 0,
      total_discounts: parseFloat(result.total_discounts) || 0,
      total_adjustments: parseFloat(result.total_adjustments) || 0,
      reports_count: parseInt(result.reports_count) || 0,
      days_count: parseInt(result.days_count) || 0,
    };
  }

  /**
   * Consolidar reportes de una compañía
   *
   * @param companyId - UUID de la compañía
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @returns Totales consolidados con desglose por tienda
   */
  async consolidateByCompany(
    companyId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    totals: {
      total_sales: number;
      total_revenue: number;
      total_quantity: number;
      total_orders: number;
      total_discounts: number;
      total_adjustments: number;
      reports_count: number;
      stores_count: number;
      days_count: number;
    };
    stores_breakdown: Array<{
      store_id: string;
      store_name: string;
      store_code: string;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      reports_count: number;
    }>;
  }> {
    // Totales de la compañía
    const totals = await this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.total_quantity), 0)', 'total_quantity')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COALESCE(SUM(report.total_discounts), 0)', 'total_discounts')
      .addSelect('COALESCE(SUM(report.total_adjustments), 0)', 'total_adjustments')
      .addSelect('COUNT(*)', 'reports_count')
      .addSelect('COUNT(DISTINCT report.store_id)', 'stores_count')
      .addSelect('COUNT(DISTINCT report.report_date)', 'days_count')
      .where('store.company_id = :companyId', { companyId })
      .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getRawOne();

    // Desglose por tienda
    const storesBreakdown = await this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .select('store.id', 'store_id')
      .addSelect('store.nombre', 'store_name')
      .addSelect('store.codigo', 'store_code')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COUNT(*)', 'reports_count')
      .where('store.company_id = :companyId', { companyId })
      .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('store.id')
      .addGroupBy('store.nombre')
      .addGroupBy('store.codigo')
      .orderBy('total_sales', 'DESC')
      .getRawMany();

    return {
      totals: {
        total_sales: parseFloat(totals.total_sales) || 0,
        total_revenue: parseFloat(totals.total_revenue) || 0,
        total_quantity: parseInt(totals.total_quantity) || 0,
        total_orders: parseInt(totals.total_orders) || 0,
        total_discounts: parseFloat(totals.total_discounts) || 0,
        total_adjustments: parseFloat(totals.total_adjustments) || 0,
        reports_count: parseInt(totals.reports_count) || 0,
        stores_count: parseInt(totals.stores_count) || 0,
        days_count: parseInt(totals.days_count) || 0,
      },
      stores_breakdown: storesBreakdown.map((s) => ({
        store_id: s.store_id,
        store_name: s.store_name,
        store_code: s.store_code,
        total_sales: parseFloat(s.total_sales) || 0,
        total_revenue: parseFloat(s.total_revenue) || 0,
        total_orders: parseInt(s.total_orders) || 0,
        reports_count: parseInt(s.reports_count) || 0,
      })),
    };
  }

  /**
   * Consolidar todas las compañías (global)
   *
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @returns Totales globales con desglose por compañía
   */
  async consolidateGlobal(
    dateFrom: string,
    dateTo: string,
  ): Promise<{
    totals: {
      total_sales: number;
      total_revenue: number;
      total_quantity: number;
      total_orders: number;
      total_discounts: number;
      total_adjustments: number;
      reports_count: number;
      stores_count: number;
      companies_count: number;
    };
    companies_breakdown: Array<{
      company_id: string;
      company_name: string;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      stores_count: number;
      reports_count: number;
    }>;
  }> {
    // Totales globales
    const totals = await this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .leftJoin('store.company', 'company')
      .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.total_quantity), 0)', 'total_quantity')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COALESCE(SUM(report.total_discounts), 0)', 'total_discounts')
      .addSelect('COALESCE(SUM(report.total_adjustments), 0)', 'total_adjustments')
      .addSelect('COUNT(*)', 'reports_count')
      .addSelect('COUNT(DISTINCT store.id)', 'stores_count')
      .addSelect('COUNT(DISTINCT company.id)', 'companies_count')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .getRawOne();

    // Desglose por compañía
    const companiesBreakdown = await this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .leftJoin('store.company', 'company')
      .select('company.id', 'company_id')
      .addSelect('company.name', 'company_name')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COUNT(DISTINCT store.id)', 'stores_count')
      .addSelect('COUNT(*)', 'reports_count')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('company.id')
      .addGroupBy('company.name')
      .orderBy('total_sales', 'DESC')
      .getRawMany();

    return {
      totals: {
        total_sales: parseFloat(totals.total_sales) || 0,
        total_revenue: parseFloat(totals.total_revenue) || 0,
        total_quantity: parseInt(totals.total_quantity) || 0,
        total_orders: parseInt(totals.total_orders) || 0,
        total_discounts: parseFloat(totals.total_discounts) || 0,
        total_adjustments: parseFloat(totals.total_adjustments) || 0,
        reports_count: parseInt(totals.reports_count) || 0,
        stores_count: parseInt(totals.stores_count) || 0,
        companies_count: parseInt(totals.companies_count) || 0,
      },
      companies_breakdown: companiesBreakdown.map((c) => ({
        company_id: c.company_id,
        company_name: c.company_name,
        total_sales: parseFloat(c.total_sales) || 0,
        total_revenue: parseFloat(c.total_revenue) || 0,
        total_orders: parseInt(c.total_orders) || 0,
        stores_count: parseInt(c.stores_count) || 0,
        reports_count: parseInt(c.reports_count) || 0,
      })),
    };
  }

  /**
   * Consolidar ventas por tipo de orden
   *
   * @param storeIds - Array de IDs de tiendas (o vacío para todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @returns Desglose por tipo de orden
   */
  async consolidateSalesByOrderType(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      order_type: string;
      total_sales: number;
      total_orders: number;
      total_quantity: number;
      percentage_of_total: number;
    }>
  > {
    const qb = this.createSalesOrderTypeQB('sot')
      .leftJoin('sot.report_header', 'report')
      .select('sot.order_type', 'order_type')
      .addSelect('COALESCE(SUM(sot.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(sot.orders_count), 0)', 'total_orders')
      .addSelect('COALESCE(SUM(sot.quantity), 0)', 'total_quantity')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (storeIds.length > 0) {
      qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
    }

    qb.groupBy('sot.order_type').orderBy('total_sales', 'DESC');

    const results = await qb.getRawMany();

    // Calcular total para porcentajes
    const totalSales = results.reduce((sum, r) => sum + parseFloat(r.total_sales), 0);

    return results.map((r) => ({
      order_type: r.order_type,
      total_sales: parseFloat(r.total_sales) || 0,
      total_orders: parseInt(r.total_orders) || 0,
      total_quantity: parseInt(r.total_quantity) || 0,
      percentage_of_total: totalSales > 0 ? (parseFloat(r.total_sales) / totalSales) * 100 : 0,
    }));
  }

  /**
   * Consolidar métodos de pago
   *
   * @param storeIds - Array de IDs de tiendas (o vacío para todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @returns Desglose por método de pago
   */
  async consolidatePaymentMethods(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      payment_method: string;
      total_amount: number;
      transactions_count: number;
      percentage_of_total: number;
    }>
  > {
    const qb = this.createPaymentMethodQB('pm')
      .leftJoin('pm.report_header', 'report')
      .select('pm.payment_method', 'payment_method')
      .addSelect('COALESCE(SUM(pm.total_amount), 0)', 'total_amount')
      .addSelect('COALESCE(SUM(pm.transactions_count), 0)', 'transactions_count')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (storeIds.length > 0) {
      qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
    }

    qb.groupBy('pm.payment_method').orderBy('total_amount', 'DESC');

    const results = await qb.getRawMany();

    // Calcular total para porcentajes
    const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);

    return results.map((r) => ({
      payment_method: r.payment_method,
      total_amount: parseFloat(r.total_amount) || 0,
      transactions_count: parseInt(r.transactions_count) || 0,
      percentage_of_total: totalAmount > 0 ? (parseFloat(r.total_amount) / totalAmount) * 100 : 0,
    }));
  }

  /**
   * Obtener desglose diario
   *
   * @param storeIds - Array de IDs de tiendas
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @returns Desglose por día
   */
  async getDailyBreakdown(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      date: string;
      day_of_week: number;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      stores_reported: number;
    }>
  > {
    const qb = this.createStaticQueryBuilder('report')
      .select('report.report_date', 'date')
      .addSelect('EXTRACT(DOW FROM report.report_date)', 'day_of_week')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COUNT(DISTINCT report.store_id)', 'stores_reported')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (storeIds.length > 0) {
      qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
    }

    qb.groupBy('report.report_date').orderBy('report.report_date', 'ASC');

    const results = await qb.getRawMany();

    return results.map((r) => ({
      date: r.date,
      day_of_week: parseInt(r.day_of_week),
      total_sales: parseFloat(r.total_sales) || 0,
      total_revenue: parseFloat(r.total_revenue) || 0,
      total_orders: parseInt(r.total_orders) || 0,
      stores_reported: parseInt(r.stores_reported) || 0,
    }));
  }

  // ============================================
  // SECCIÓN 4: RANKINGS
  // ============================================

  /**
   * Ranking de tiendas por métrica
   */
  async getRankingByStores(dto: RankingStoresDto): Promise<
    Array<{
      position: number;
      store_id: string;
      store_name: string;
      store_code: string;
      store_city?: string;
      company_id?: string;
      company_name?: string;
      metric_value: number;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      average_ticket: number;
      reports_count: number;
    }>
  > {
    const metricColumn = this.getMetricColumn(dto.metric);
    const sortDirection = dto.direction === RankingDirectionEnum.BOTTOM ? 'ASC' : 'DESC';

    const qb = this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .leftJoin('store.company', 'company')
      .select('store.id', 'store_id')
      .addSelect('store.nombre', 'store_name')
      .addSelect('store.codigo', 'store_code')
      .addSelect('store.ciudad', 'store_city')
      .addSelect('company.id', 'company_id')
      .addSelect('company.name', 'company_name')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COUNT(*)', 'reports_count')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', {
        dateFrom: dto.date_from,
        dateTo: dto.date_to,
      });

    if (dto.company_id) {
      qb.andWhere('store.company_id = :companyId', { companyId: dto.company_id });
    }

    if (dto.report_type) {
      qb.andWhere('report.report_type = :reportType', { reportType: dto.report_type });
    }

    if (dto.only_active !== false) {
      qb.andWhere('store.activo = :activo', { activo: true });
      qb.andWhere('store.deleted_at IS NULL');
    }

    qb.groupBy('store.id')
      .addGroupBy('store.nombre')
      .addGroupBy('store.codigo')
      .addGroupBy('store.ciudad')
      .addGroupBy('company.id')
      .addGroupBy('company.name')
      .orderBy(metricColumn, sortDirection)
      .limit(dto.limit || 10);

    const results = await qb.getRawMany();

    return results.map((r, index) => {
      const totalSales = parseFloat(r.total_sales) || 0;
      const totalOrders = parseInt(r.total_orders) || 0;
      const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

      let metricValue: number;
      switch (dto.metric) {
        case RankingMetricEnum.TOTAL_SALES:
          metricValue = totalSales;
          break;
        case RankingMetricEnum.TOTAL_REVENUE:
          metricValue = parseFloat(r.total_revenue) || 0;
          break;
        case RankingMetricEnum.ORDERS_COUNT:
          metricValue = totalOrders;
          break;
        case RankingMetricEnum.AVERAGE_TICKET:
          metricValue = averageTicket;
          break;
        default:
          metricValue = totalSales;
      }

      return {
        position: index + 1,
        store_id: r.store_id,
        store_name: r.store_name,
        store_code: r.store_code,
        store_city: r.store_city,
        company_id: r.company_id,
        company_name: r.company_name,
        metric_value: metricValue,
        total_sales: totalSales,
        total_revenue: parseFloat(r.total_revenue) || 0,
        total_orders: totalOrders,
        average_ticket: averageTicket,
        reports_count: parseInt(r.reports_count) || 0,
      };
    });
  }

  /**
   * Ranking de compañías por métrica
   */
  async getRankingByCompanies(
    dateFrom: string,
    dateTo: string,
    metric: RankingMetricEnum = RankingMetricEnum.TOTAL_SALES,
    direction: RankingDirectionEnum = RankingDirectionEnum.TOP,
    limit = 10,
  ): Promise<
    Array<{
      position: number;
      company_id: string;
      company_name: string;
      metric_value: number;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      stores_count: number;
      reports_count: number;
    }>
  > {
    const metricColumn = this.getMetricColumn(metric);
    const sortDirection = direction === RankingDirectionEnum.BOTTOM ? 'ASC' : 'DESC';

    const results = await this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .leftJoin('store.company', 'company')
      .select('company.id', 'company_id')
      .addSelect('company.name', 'company_name')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COUNT(DISTINCT store.id)', 'stores_count')
      .addSelect('COUNT(*)', 'reports_count')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('company.id')
      .addGroupBy('company.name')
      .orderBy(metricColumn, sortDirection)
      .limit(limit)
      .getRawMany();

    return results.map((r, index) => {
      const totalSales = parseFloat(r.total_sales) || 0;
      const totalOrders = parseInt(r.total_orders) || 0;

      let metricValue: number;
      switch (metric) {
        case RankingMetricEnum.TOTAL_SALES:
          metricValue = totalSales;
          break;
        case RankingMetricEnum.TOTAL_REVENUE:
          metricValue = parseFloat(r.total_revenue) || 0;
          break;
        case RankingMetricEnum.ORDERS_COUNT:
          metricValue = totalOrders;
          break;
        case RankingMetricEnum.AVERAGE_TICKET:
          metricValue = totalOrders > 0 ? totalSales / totalOrders : 0;
          break;
        default:
          metricValue = totalSales;
      }

      return {
        position: index + 1,
        company_id: r.company_id,
        company_name: r.company_name,
        metric_value: metricValue,
        total_sales: totalSales,
        total_revenue: parseFloat(r.total_revenue) || 0,
        total_orders: totalOrders,
        stores_count: parseInt(r.stores_count) || 0,
        reports_count: parseInt(r.reports_count) || 0,
      };
    });
  }

  private getMetricColumn(metric: RankingMetricEnum): string {
    switch (metric) {
      case RankingMetricEnum.TOTAL_SALES:
        return 'total_sales';
      case RankingMetricEnum.TOTAL_REVENUE:
        return 'total_revenue';
      case RankingMetricEnum.ORDERS_COUNT:
        return 'total_orders';
      case RankingMetricEnum.AVERAGE_TICKET:
        return 'CASE WHEN SUM(report.orders_count) > 0 THEN SUM(report.total_sales) / SUM(report.orders_count) ELSE 0 END';
      default:
        return 'total_sales';
    }
  }

  // ============================================
  // SECCIÓN 5: COMPARACIONES
  // ============================================

  async compareStores(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      store_id: string;
      store_name: string;
      store_code: string;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      average_ticket: number;
      reports_count: number;
    }>
  > {
    const results = await this.createStaticQueryBuilder('report')
      .leftJoin('report.store', 'store')
      .select('store.id', 'store_id')
      .addSelect('store.nombre', 'store_name')
      .addSelect('store.codigo', 'store_code')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COUNT(*)', 'reports_count')
      .where('report.store_id IN (:...storeIds)', { storeIds })
      .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('store.id')
      .addGroupBy('store.nombre')
      .addGroupBy('store.codigo')
      .orderBy('total_sales', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      store_id: r.store_id,
      store_name: r.store_name,
      store_code: r.store_code,
      total_sales: parseFloat(r.total_sales) || 0,
      total_revenue: parseFloat(r.total_revenue) || 0,
      total_orders: parseInt(r.total_orders) || 0,
      average_ticket:
        parseInt(r.total_orders) > 0 ? parseFloat(r.total_sales) / parseInt(r.total_orders) : 0,
      reports_count: parseInt(r.reports_count) || 0,
    }));
  }

  async comparePeriods(
    storeIds: string[],
    currentPeriod: { dateFrom: string; dateTo: string },
    previousPeriod: { dateFrom: string; dateTo: string },
  ): Promise<{
    current: {
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      average_ticket: number;
      reports_count: number;
    };
    previous: {
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      average_ticket: number;
      reports_count: number;
    };
  }> {
    const buildQuery = (dateFrom: string, dateTo: string) => {
      const qb = this.createStaticQueryBuilder('report')
        .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
        .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
        .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
        .addSelect('COUNT(*)', 'reports_count')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }
      return qb;
    };

    const [currentResult, previousResult] = await Promise.all([
      buildQuery(currentPeriod.dateFrom, currentPeriod.dateTo).getRawOne(),
      buildQuery(previousPeriod.dateFrom, previousPeriod.dateTo).getRawOne(),
    ]);

    const parseMetrics = (result: any) => {
      const totalSales = parseFloat(result.total_sales) || 0;
      const totalOrders = parseInt(result.total_orders) || 0;
      return {
        total_sales: totalSales,
        total_revenue: parseFloat(result.total_revenue) || 0,
        total_orders: totalOrders,
        average_ticket: totalOrders > 0 ? totalSales / totalOrders : 0,
        reports_count: parseInt(result.reports_count) || 0,
      };
    };

    return { current: parseMetrics(currentResult), previous: parseMetrics(previousResult) };
  }

  async compareByDayOfWeek(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      day_of_week: number;
      day_name: string;
      total_sales: number;
      total_orders: number;
      average_sales: number;
      occurrences: number;
    }>
  > {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const qb = this.createStaticQueryBuilder('report')
      .select('EXTRACT(DOW FROM report.report_date)', 'day_of_week')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COUNT(DISTINCT report.report_date)', 'occurrences')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (storeIds.length > 0) {
      qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
    }

    qb.groupBy('EXTRACT(DOW FROM report.report_date)').orderBy('day_of_week', 'ASC');
    const results = await qb.getRawMany();

    return results.map((r) => {
      const dayOfWeek = parseInt(r.day_of_week);
      const totalSales = parseFloat(r.total_sales) || 0;
      const occurrences = parseInt(r.occurrences) || 1;
      return {
        day_of_week: dayOfWeek,
        day_name: dayNames[dayOfWeek],
        total_sales: totalSales,
        total_orders: parseInt(r.total_orders) || 0,
        average_sales: totalSales / occurrences,
        occurrences,
      };
    });
  }

  // ============================================
  // SECCIÓN 6: ESTADÍSTICAS
  // ============================================

  async getGlobalStats(): Promise<{
    total_reports: number;
    reports_today: number;
    reports_this_week: number;
    reports_this_month: number;
    stores_with_reports: number;
    companies_with_reports: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const [total, reportsToday, reportsThisWeek, reportsThisMonth, stores, companies] =
      await Promise.all([
        this.createStaticQueryBuilder('report').getCount(),
        this.createStaticQueryBuilder('report')
          .where('report.report_date = :today', { today })
          .getCount(),
        this.createStaticQueryBuilder('report')
          .where('report.report_date >= :weekAgo', { weekAgo })
          .getCount(),
        this.createStaticQueryBuilder('report')
          .where('report.report_date >= :monthStart', { monthStart })
          .getCount(),
        this.createStaticQueryBuilder('report')
          .select('COUNT(DISTINCT report.store_id)', 'count')
          .getRawOne(),
        this.createStaticQueryBuilder('report')
          .leftJoin('report.store', 'store')
          .select('COUNT(DISTINCT store.company_id)', 'count')
          .getRawOne(),
      ]);

    return {
      total_reports: total,
      reports_today: reportsToday,
      reports_this_week: reportsThisWeek,
      reports_this_month: reportsThisMonth,
      stores_with_reports: parseInt(stores?.count) || 0,
      companies_with_reports: parseInt(companies?.count) || 0,
    };
  }

  async getPeriodStats(
    dateFrom: string,
    dateTo: string,
    companyId?: string,
  ): Promise<{
    total_sales: number;
    total_revenue: number;
    total_orders: number;
    average_ticket: number;
    total_discounts: number;
    total_adjustments: number;
    reports_count: number;
    stores_count: number;
    days_with_reports: number;
    average_daily_sales: number;
  }> {
    const qb = this.createStaticQueryBuilder('report')
      .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .addSelect('COALESCE(SUM(report.total_discounts), 0)', 'total_discounts')
      .addSelect('COALESCE(SUM(report.total_adjustments), 0)', 'total_adjustments')
      .addSelect('COUNT(*)', 'reports_count')
      .addSelect('COUNT(DISTINCT report.store_id)', 'stores_count')
      .addSelect('COUNT(DISTINCT report.report_date)', 'days_with_reports')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (companyId) {
      qb.leftJoin('report.store', 'store').andWhere('store.company_id = :companyId', { companyId });
    }

    const result = await qb.getRawOne();
    const totalSales = parseFloat(result.total_sales) || 0;
    const totalOrders = parseInt(result.total_orders) || 0;
    const daysWithReports = parseInt(result.days_with_reports) || 1;

    return {
      total_sales: totalSales,
      total_revenue: parseFloat(result.total_revenue) || 0,
      total_orders: totalOrders,
      average_ticket: totalOrders > 0 ? totalSales / totalOrders : 0,
      total_discounts: parseFloat(result.total_discounts) || 0,
      total_adjustments: parseFloat(result.total_adjustments) || 0,
      reports_count: parseInt(result.reports_count) || 0,
      stores_count: parseInt(result.stores_count) || 0,
      days_with_reports: daysWithReports,
      average_daily_sales: totalSales / daysWithReports,
    };
  }

  async getTrends(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ): Promise<
    Array<{
      period: string;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      average_ticket: number;
    }>
  > {
    let dateSelector: string;
    let groupByClause: string;

    switch (groupBy) {
      case 'week':
        dateSelector = "TO_CHAR(DATE_TRUNC('week', report.report_date), 'YYYY-WW')";
        groupByClause = "DATE_TRUNC('week', report.report_date)";
        break;
      case 'month':
        dateSelector = "TO_CHAR(DATE_TRUNC('month', report.report_date), 'YYYY-MM')";
        groupByClause = "DATE_TRUNC('month', report.report_date)";
        break;
      default:
        dateSelector = "TO_CHAR(report.report_date, 'YYYY-MM-DD')";
        groupByClause = 'report.report_date';
    }

    const qb = this.createStaticQueryBuilder('report')
      .select(dateSelector, 'period')
      .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
      .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
      .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
      .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

    if (storeIds.length > 0) {
      qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
    }

    qb.groupBy(groupByClause).orderBy('period', 'ASC');
    const results = await qb.getRawMany();

    return results.map((r) => {
      const totalSales = parseFloat(r.total_sales) || 0;
      const totalOrders = parseInt(r.total_orders) || 0;
      return {
        period: r.period,
        total_sales: totalSales,
        total_revenue: parseFloat(r.total_revenue) || 0,
        total_orders: totalOrders,
        average_ticket: totalOrders > 0 ? totalSales / totalOrders : 0,
      };
    });
  }

  // ============================================
  // SECCIÓN 7: OPERACIONES CON DETALLES
  // ============================================

  async addSalesByOrderType(
    reportId: string,
    data: Partial<SalesByOrderTypeEntity>,
  ): Promise<SalesByOrderTypeEntity> {
    const entity = this.salesByOrderTypeRepo.create({ ...data, report_header_id: reportId });
    return await this.salesByOrderTypeRepo.save(entity);
  }

  async addPaymentMethod(
    reportId: string,
    data: Partial<PaymentMethodEntity>,
  ): Promise<PaymentMethodEntity> {
    const entity = this.paymentMethodRepo.create({ ...data, report_header_id: reportId });
    return await this.paymentMethodRepo.save(entity);
  }

  async addDynamicDiscount(
    reportId: string,
    data: Partial<DynamicDiscountEntity>,
  ): Promise<DynamicDiscountEntity> {
    const entity = this.discountRepo.create({ ...data, report_header_id: reportId });
    return await this.discountRepo.save(entity);
  }

  async addAdjustment(
    reportId: string,
    data: Partial<AdjustmentEntity>,
  ): Promise<AdjustmentEntity> {
    const entity = this.adjustmentRepo.create({ ...data, report_header_id: reportId });
    return await this.adjustmentRepo.save(entity);
  }

  async addEffectiveOrder(
    reportId: string,
    data: Partial<EffectiveOrderEntity>,
  ): Promise<EffectiveOrderEntity> {
    const entity = this.effectiveOrderRepo.create({ ...data, report_header_id: reportId });
    return await this.effectiveOrderRepo.save(entity);
  }

  async getSalesByOrderType(reportId: string): Promise<SalesByOrderTypeEntity[]> {
    return await this.createSalesOrderTypeQB('sot')
      .where('sot.report_header_id = :reportId', { reportId })
      .orderBy('sot.total_sales', 'DESC')
      .getMany();
  }

  async getPaymentMethods(reportId: string): Promise<PaymentMethodEntity[]> {
    return await this.createPaymentMethodQB('pm')
      .where('pm.report_header_id = :reportId', { reportId })
      .orderBy('pm.total_amount', 'DESC')
      .getMany();
  }

  async getDynamicDiscounts(reportId: string): Promise<DynamicDiscountEntity[]> {
    return await this.discountRepo
      .createQueryBuilder('dd')
      .where('dd.report_header_id = :reportId', { reportId })
      .orderBy('dd.total_discount', 'DESC')
      .getMany();
  }

  async getAdjustments(reportId: string): Promise<AdjustmentEntity[]> {
    return await this.adjustmentRepo
      .createQueryBuilder('adj')
      .where('adj.report_header_id = :reportId', { reportId })
      .orderBy('adj.total_amount', 'DESC')
      .getMany();
  }

  async getEffectiveOrders(reportId: string, limit = 100): Promise<EffectiveOrderEntity[]> {
    return await this.effectiveOrderRepo
      .createQueryBuilder('eo')
      .where('eo.report_header_id = :reportId', { reportId })
      .orderBy('eo.order_datetime', 'DESC')
      .limit(limit)
      .getMany();
  }

  async deleteAllDetails(reportId: string): Promise<void> {
    await Promise.all([
      this.salesByOrderTypeRepo.delete({ report_header_id: reportId }),
      this.paymentMethodRepo.delete({ report_header_id: reportId }),
      this.discountRepo.delete({ report_header_id: reportId }),
      this.adjustmentRepo.delete({ report_header_id: reportId }),
      this.effectiveOrderRepo.delete({ report_header_id: reportId }),
    ]);
  }

  async countByStatus(companyId?: string): Promise<Record<string, number>> {
    const qb = this.createStaticQueryBuilder('report')
      .select('report.status', 'status')
      .addSelect('COUNT(*)', 'count');
    if (companyId) {
      qb.leftJoin('report.store', 'store').where('store.company_id = :companyId', { companyId });
    }
    qb.groupBy('report.status');
    const results = await qb.getRawMany();
    return results.reduce(
      (acc, r) => {
        acc[r.status] = parseInt(r.count);
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
