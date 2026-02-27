// src/modules/reports/reports.repository.ts

/**
 * @fileoverview Repository para módulo de reportes
 * @module modules/reports
 *
 * ARQUITECTURA MULTI-TENANT - MIGRACIÓN COMPLETA:
 *
 * ✅ FASE 7.4.A COMPLETADA - Métodos Críticos Adaptados (Sesión 17)
 * ✅ FASE 7.4.B COMPLETADA - Métodos Secundarios Adaptados (Sesión 17)
 * ✅ FASE 7.4.C COMPLETADA - Métodos Auxiliares Adaptados (Sesión 17)
 * ✅ MIGRACIÓN QUERIES COMPLETADA - Todos los métodos usan manager del callback (Sesión Actual)
 *
 * Estado actual:
 * - Las 6 tablas de reportes viven en schemas POR TENANT
 * - Se usa manager.getRepository(Entity).createQueryBuilder() dentro de withSchema()
 * - Se usa withSchema(async (manager) => {...}) para operaciones READ
 * - Se usa withSchemaTransaction(async (manager) => {...}) para operaciones WRITE
 * - Las relaciones con stores funcionan cross-schema (tenant → public)
 *
 * PATRÓN OBLIGATORIO:
 *
 * ```typescript
 * // ✅ READ operations - SIEMPRE recibir manager
 * async findById(id: string): Promise<ReportHeaderEntity | null> {
 *   return this.withSchema(async (manager) => {
 *     return manager
 *       .getRepository(ReportHeaderEntity)
 *       .createQueryBuilder('report')
 *       .where('report.id = :id', { id })
 *       .getOne();
 *   });
 * }
 *
 * // ✅ WRITE operations - SIEMPRE recibir manager
 * async create(data): Promise<ReportHeaderEntity> {
 *   return this.withSchemaTransaction(async (manager) => {
 *     const entity = manager.create(ReportHeaderEntity, data);
 *     return await manager.save(ReportHeaderEntity, entity);
 *   });
 * }
 * ```
 *
 * REGLAS CRÍTICAS:
 * - NUNCA usar this.repository dentro de callbacks
 * - NUNCA usar this.<otroRepo> dentro de callbacks
 * - SIEMPRE usar manager.getRepository(Entity) para obtener el repositorio con search_path correcto
 *
 * @version 7.0.0 - MIGRACIÓN QUERIES COMPLETA: Todos los métodos usan manager del callback
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReportHeaderEntity,
  SalesByOrderTypeEntity,
  PaymentMethodEntity,
  DynamicDiscountEntity,
  AdjustmentEntity,
  EffectiveOrderEntity,
  ShortageOverageEntity,
  CashSummaryEntity,
  EmployeeSalesEntity,
  CategorySalesEntity,
  RevenueCenterSalesEntity,
  ServiceChargeEntity,
  IncomeByClassEntity,
  IncomeByTenderTypeEntity,
} from './entities';
import { ReportTypeEnum, ReportScopeEnum } from './enums';
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
  // NOTA IMPORTANTE - USO DE manager
  // ============================================
  //
  // TODOS los métodos que usan withSchema() DEBEN:
  // 1. Recibir el 'manager' del callback: withSchema(async (manager) => { ... })
  // 2. Usar manager.getRepository(Entity) en lugar de this.repository
  // 3. NUNCA usar this.repository ni this.<otroRepo> dentro del callback
  //
  // Esto garantiza que las queries usen el QueryRunner con search_path correcto.
  // ============================================

  // ============================================
  // SECCIÓN 1: CRUD BÁSICO
  // ============================================

  /**
   * Crear reporte con sus detalles
   *
   * MULTI-TENANT: Usa withSchemaTransaction() para crear en schema del tenant
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
      shortage_overage?: Partial<ShortageOverageEntity>[];
      cash_summary?: Partial<CashSummaryEntity>[];
      employee_sales?: Partial<EmployeeSalesEntity>[];
      category_sales?: Partial<CategorySalesEntity>[];
      revenue_center_sales?: Partial<RevenueCenterSalesEntity>[];
      service_charges?: Partial<ServiceChargeEntity>[];
      income_by_class?: Partial<IncomeByClassEntity>[];
      income_by_tender_type?: Partial<IncomeByTenderTypeEntity>[];
    },
  ): Promise<ReportHeaderEntity> {
    return this.withSchemaTransaction(async (manager) => {
      // Extraer detalles
      const {
        sales_by_order_type,
        payment_methods,
        dynamic_discounts,
        adjustments,
        effective_orders,
        shortage_overage,
        cash_summary,
        employee_sales,
        category_sales,
        revenue_center_sales,
        service_charges,
        income_by_class,
        income_by_tender_type,
        ...headerData
      } = data;

      // Crear header
      const report = manager.create(ReportHeaderEntity, headerData);
      const savedReport = await manager.save(ReportHeaderEntity, report);

      // Crear detalles si existen
      if (sales_by_order_type?.length) {
        const entities = sales_by_order_type.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(SalesByOrderTypeEntity, entities);
      }

      if (payment_methods?.length) {
        const entities = payment_methods.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(PaymentMethodEntity, entities);
      }

      if (dynamic_discounts?.length) {
        const entities = dynamic_discounts.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(DynamicDiscountEntity, entities);
      }

      if (adjustments?.length) {
        const entities = adjustments.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(AdjustmentEntity, entities);
      }

      if (effective_orders?.length) {
        const entities = effective_orders.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(EffectiveOrderEntity, entities);
      }

      if (shortage_overage?.length) {
        const entities = shortage_overage.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(ShortageOverageEntity, entities);
      }

      if (cash_summary?.length) {
        const entities = cash_summary.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(CashSummaryEntity, entities);
      }

      if (employee_sales?.length) {
        const entities = employee_sales.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(EmployeeSalesEntity, entities);
      }

      if (category_sales?.length) {
        const entities = category_sales.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(CategorySalesEntity, entities);
      }

      if (revenue_center_sales?.length) {
        const entities = revenue_center_sales.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(RevenueCenterSalesEntity, entities);
      }

      if (service_charges?.length) {
        const entities = service_charges.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(ServiceChargeEntity, entities);
      }

      if (income_by_class?.length) {
        const entities = income_by_class.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(IncomeByClassEntity, entities);
      }

      if (income_by_tender_type?.length) {
        const entities = income_by_tender_type.map((item) => ({
          ...item,
          report_header_id: savedReport.id,
        }));
        await manager.save(IncomeByTenderTypeEntity, entities);
      }

      return savedReport;
    });
  }

  /**
   * Buscar reportes con filtros y paginación
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * @param query - Filtros y opciones de paginación
   * @returns Tupla [reportes, total]
   */
  async findAll(query: QueryReportDto): Promise<[ReportHeaderEntity[], number]> {
    return this.withSchema(async (manager) => {
      const qb = manager.getRepository(ReportHeaderEntity).createQueryBuilder('report');

      // Joins opcionales
      // Se requiere join con store si: include_store, company_id, o filtros geográficos
      const needsStoreJoin =
        query.include_store || query.company_id || query.city || query.region || query.country_code;
      const needsCompanyJoin = query.company_id || query.country_code;

      if (needsStoreJoin) {
        qb.leftJoinAndSelect('report.store', 'store');
        if (needsCompanyJoin) {
          qb.leftJoin('store.company', 'company');
        }
      }

      // Filtros por entidad
      if (query.storeId) {
        qb.andWhere('report.store_id = :storeId', { storeId: query.storeId });
      }

      if (query.storeIds?.length) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds: query.storeIds });
      }

      if (query.company_id) {
        qb.andWhere('store.company_id = :company_id', { company_id: query.company_id });
      }

      // Filtros geográficos
      if (query.city) {
        qb.andWhere('store.ciudad = :city', { city: query.city });
      }

      if (query.region) {
        qb.andWhere('store.region = :region', { region: query.region });
      }

      if (query.country_code) {
        qb.andWhere('company.country_code = :country_code', { country_code: query.country_code });
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

      // Filtros por empleado
      if (query.employee_id !== undefined) {
        qb.andWhere('report.employee_id = :employee_id', { employee_id: query.employee_id });
      }

      if (query.consolidated !== undefined) {
        if (query.consolidated) {
          // Solo reportes consolidados (sin empleado)
          qb.andWhere('report.employee_id IS NULL');
        } else {
          // Solo reportes individuales (con empleado)
          qb.andWhere('report.employee_id IS NOT NULL');
        }
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

      // Paginación: obtener count ANTES de aplicar ordering y limit
      // para evitar bug de TypeORM 0.3.x con skip/take + joins
      // (createOrderByCombinedWithSelectExpression → databaseName undefined)
      const page = query.page || 1;
      const limit = query.limit || 10;
      const total = await qb.getCount();

      // Ordenamiento
      const sortBy = query.sortBy || 'report_date';
      const sortOrder = query.sortOrder || 'DESC';
      qb.orderBy(`report.${sortBy}`, sortOrder);

      // Usar offset/limit en vez de skip/take para evitar el subquery
      // interno de TypeORM que falla con PostgreSQL + schemas dinámicos
      qb.offset((page - 1) * limit).limit(limit);
      const items = await qb.getMany();

      return [items, total];
    });
  }

  /**
   * Buscar reporte por ID
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * @param id - UUID del reporte
   * @param includeDetails - Cargar entidades de detalle
   * @returns ReportHeaderEntity o null
   */
  async findById(id: string, includeDetails = false): Promise<ReportHeaderEntity | null> {
    return this.withSchema(async (manager) => {
      // Query 1: Header + Store (siempre)
      const report = await manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoinAndSelect('report.store', 'store')
        .where('report.id = :id', { id })
        .getOne();

      if (!report || !includeDetails) {
        return report;
      }

      // Queries separadas para cada colección de detalle
      // Esto evita el producto cartesiano de 13 LEFT JOINs que genera millones de filas
      const [
        salesByOrderType,
        paymentMethods,
        dynamicDiscounts,
        adjustments,
        effectiveOrders,
        shortageOverage,
        cashSummary,
        employeeSales,
        categorySales,
        revenueCenterSales,
        serviceCharges,
        incomeByClass,
        incomeByTenderType,
      ] = await Promise.all([
        manager.getRepository(SalesByOrderTypeEntity).find({
          where: { report_header_id: id },
          order: { total_sales: 'DESC' },
        }),
        manager.getRepository(PaymentMethodEntity).find({
          where: { report_header_id: id },
          order: { total_amount: 'DESC' },
        }),
        manager.getRepository(DynamicDiscountEntity).find({
          where: { report_header_id: id },
          order: { total_discount: 'DESC' },
        }),
        manager.getRepository(AdjustmentEntity).find({
          where: { report_header_id: id },
        }),
        manager.getRepository(EffectiveOrderEntity).find({
          where: { report_header_id: id },
          order: { order_datetime: 'DESC' },
        }),
        manager.getRepository(ShortageOverageEntity).find({
          where: { report_header_id: id },
        }),
        manager.getRepository(CashSummaryEntity).find({
          where: { report_header_id: id },
          order: { total_amount: 'DESC' },
        }),
        manager.getRepository(EmployeeSalesEntity).find({
          where: { report_header_id: id },
          order: { gross_sales: 'DESC' },
        }),
        manager.getRepository(CategorySalesEntity).find({
          where: { report_header_id: id },
          order: { total_sales: 'DESC' },
        }),
        manager.getRepository(RevenueCenterSalesEntity).find({
          where: { report_header_id: id },
          order: { total_sales: 'DESC' },
        }),
        manager.getRepository(ServiceChargeEntity).find({
          where: { report_header_id: id },
          order: { total_amount: 'DESC' },
        }),
        manager.getRepository(IncomeByClassEntity).find({
          where: { report_header_id: id },
          order: { total_amount: 'DESC' },
        }),
        manager.getRepository(IncomeByTenderTypeEntity).find({
          where: { report_header_id: id },
          order: { total_amount: 'DESC' },
        }),
      ]);

      // Asignar relaciones al entity
      report.sales_by_order_type = salesByOrderType;
      report.payment_methods = paymentMethods;
      report.dynamic_discounts = dynamicDiscounts;
      report.adjustments = adjustments;
      report.effective_orders = effectiveOrders;
      report.shortage_overage = shortageOverage;
      report.cash_summary = cashSummary;
      report.employee_sales = employeeSales;
      report.category_sales = categorySales;
      report.revenue_center_sales = revenueCenterSales;
      report.service_charges = serviceCharges;
      report.income_by_class = incomeByClass;
      report.income_by_tender_type = incomeByTenderType;

      return report;
    });
  }

  /**
   * Buscar reporte por tienda y fecha
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .where('report.store_id = :storeId', { storeId })
        .andWhere('report.report_date = :reportDate', { reportDate });

      if (reportType) {
        qb.andWhere('report.report_type = :reportType', { reportType });
      }

      return await qb.getOne();
    });
  }

  /**
   * Verificar si existe reporte
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * Idempotencia: storeId + report_date + employee_id
   * - Si employeeId es undefined/null, busca reporte consolidado (employee_id IS NULL)
   * - Si employeeId tiene valor, busca reporte de ese empleado específico
   *
   * @param storeId - UUID de la tienda
   * @param reportDate - Fecha del reporte
   * @param employeeId - ID del empleado (null/undefined = consolidado)
   * @param excludeId - ID a excluir (para updates)
   * @returns true si existe
   */
  async exists(
    storeId: string,
    reportDate: string,
    employeeId?: number | null,
    excludeId?: string,
  ): Promise<boolean> {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .where('report.store_id = :storeId', { storeId })
        .andWhere('report.report_date = :reportDate', { reportDate });

      // Idempotencia incluye employee_id
      if (employeeId !== undefined && employeeId !== null) {
        // Reporte individual de empleado
        qb.andWhere('report.employee_id = :employeeId', { employeeId });
      } else {
        // Reporte consolidado (sin empleado)
        qb.andWhere('report.employee_id IS NULL');
      }

      if (excludeId) {
        qb.andWhere('report.id != :excludeId', { excludeId });
      }

      const count = await qb.getCount();
      return count > 0;
    });
  }

  /**
   * Actualizar reporte
   *
   * MULTI-TENANT: Usa withSchemaTransaction()
   *
   * @param id - UUID del reporte
   * @param data - Datos parciales a actualizar
   * @returns ReportHeaderEntity actualizado o null
   */
  async update(id: string, data: Partial<ReportHeaderEntity>): Promise<ReportHeaderEntity | null> {
    return this.withSchemaTransaction(async (manager) => {
      // Construir objeto solo con campos escalares (excluir relaciones)
      const updateData: Record<string, unknown> = {};
      const scalarFields = [
        'storeId',
        'report_date',
        'report_type',
        'total_sales',
        'total_revenue',
        'total_quantity',
        'orders_count',
        'average_ticket',
        'total_discounts',
        'total_adjustments',
        'total_service_charge',
        'total_payment',
        'status',
        'metadata',
      ];

      for (const field of scalarFields) {
        if (field in data) {
          updateData[field] = data[field as keyof ReportHeaderEntity];
        }
      }

      if (Object.keys(updateData).length > 0) {
        await manager.update(ReportHeaderEntity, id, updateData);
      }

      // Retornar reporte actualizado usando findById() que usa withSchema()
      return await this.findById(id);
    });
  }

  /**
   * Eliminar reporte (hard delete con CASCADE)
   *
   * MULTI-TENANT: Usa withSchemaTransaction()
   *
   * @param id - UUID del reporte
   * @returns true si se eliminó
   */
  async delete(id: string): Promise<boolean> {
    return this.withSchemaTransaction(async (manager) => {
      const result = await manager.delete(ReportHeaderEntity, id);
      return (result.affected ?? 0) > 0;
    });
  }

  // ============================================
  // SECCIÓN 2: BÚSQUEDAS ESPECÍFICAS
  // ============================================

  /**
   * Buscar reportes por tienda
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .where('report.store_id = :storeId', {
          storeId,
        });

      if (dateFrom && dateTo) {
        qb.andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });
      }

      return await qb.orderBy('report.report_date', 'DESC').getMany();
    });
  }

  /**
   * Buscar reportes por compañía (todas sus tiendas)
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      return await manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoin('report.store', 'store')
        .leftJoinAndSelect('report.store', 'storeSelect')
        .where('store.company_id = :companyId', { companyId })
        .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
        .orderBy('report.report_date', 'DESC')
        .addOrderBy('store.nombre', 'ASC')
        .getMany();
    });
  }

  /**
   * Buscar reportes por rango de fechas
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoinAndSelect('report.store', 'store')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (reportType) {
        qb.andWhere('report.report_type = :reportType', { reportType });
      }

      return await qb.orderBy('report.report_date', 'DESC').getMany();
    });
  }

  /**
   * Obtener IDs de tiendas con reportes en un período
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param companyId - Filtrar por compañía (opcional)
   * @returns Array de storeIds
   */
  async getStoreIdsWithReports(
    dateFrom: string,
    dateTo: string,
    companyId?: string,
  ): Promise<string[]> {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .select('DISTINCT report.store_id', 'storeId')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (companyId) {
        qb.leftJoin('report.store', 'store').andWhere('store.company_id = :companyId', {
          companyId,
        });
      }

      const result = await qb.getRawMany();
      return result.map((r) => r.storeId);
    });
  }

  // ============================================
  // SECCIÓN 3: CONSOLIDACIONES
  // ============================================

  /**
   * Consolidar reportes de una tienda
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * @param storeId - UUID de la tienda
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param reportScope - Alcance: individual, consolidated, o all (default: individual)
   * @returns Totales consolidados
   */
  async consolidateByStore(
    storeId: string,
    dateFrom: string,
    dateTo: string,
    reportScope: ReportScopeEnum = ReportScopeEnum.INDIVIDUAL,
  ): Promise<{
    total_sales: number;
    total_revenue: number;
    total_quantity: number;
    total_orders: number;
    total_discounts: number;
    total_adjustments: number;
    total_service_charge: number;
    total_payment: number;
    reports_count: number;
    days_count: number;
  }> {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
        .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
        .addSelect('COALESCE(SUM(report.total_quantity), 0)', 'total_quantity')
        .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
        .addSelect('COALESCE(SUM(report.total_discounts), 0)', 'total_discounts')
        .addSelect('COALESCE(SUM(report.total_adjustments), 0)', 'total_adjustments')
        .addSelect('COALESCE(SUM(report.total_service_charge), 0)', 'total_service_charge')
        .addSelect('COALESCE(SUM(report.total_payment), 0)', 'total_payment')
        .addSelect('COUNT(*)', 'reports_count')
        .addSelect('COUNT(DISTINCT report.report_date)', 'days_count')
        .where('report.store_id = :storeId', { storeId })
        .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      // Aplicar filtro de alcance para evitar doble conteo
      this.applyReportScopeFilter(qb, reportScope);

      const result = await qb.getRawOne();

      return {
        total_sales: parseFloat(result.total_sales) || 0,
        total_revenue: parseFloat(result.total_revenue) || 0,
        total_quantity: parseInt(result.total_quantity) || 0,
        total_orders: parseInt(result.total_orders) || 0,
        total_discounts: parseFloat(result.total_discounts) || 0,
        total_adjustments: parseFloat(result.total_adjustments) || 0,
        total_service_charge: parseFloat(result.total_service_charge) || 0,
        total_payment: parseFloat(result.total_payment) || 0,
        reports_count: parseInt(result.reports_count) || 0,
        days_count: parseInt(result.days_count) || 0,
      };
    });
  }

  /**
   * Consolidar reportes de una compañía
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * @param companyId - UUID de la compañía
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param reportScope - Alcance: individual, consolidated, o all (default: individual)
   * @returns Totales consolidados con desglose por tienda
   */
  async consolidateByCompany(
    companyId: string,
    dateFrom: string,
    dateTo: string,
    reportScope: ReportScopeEnum = ReportScopeEnum.INDIVIDUAL,
  ): Promise<{
    totals: {
      total_sales: number;
      total_revenue: number;
      total_quantity: number;
      total_orders: number;
      total_discounts: number;
      total_adjustments: number;
      total_service_charge: number;
      total_payment: number;
      reports_count: number;
      stores_count: number;
      days_count: number;
    };
    stores_breakdown: Array<{
      storeId: string;
      store_name: string;
      store_code: string;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      reports_count: number;
    }>;
  }> {
    return this.withSchema(async (manager) => {
      // Totales de la compañía
      const totalsQb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoin('report.store', 'store')
        .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
        .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
        .addSelect('COALESCE(SUM(report.total_quantity), 0)', 'total_quantity')
        .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
        .addSelect('COALESCE(SUM(report.total_discounts), 0)', 'total_discounts')
        .addSelect('COALESCE(SUM(report.total_adjustments), 0)', 'total_adjustments')
        .addSelect('COALESCE(SUM(report.total_service_charge), 0)', 'total_service_charge')
        .addSelect('COALESCE(SUM(report.total_payment), 0)', 'total_payment')
        .addSelect('COUNT(*)', 'reports_count')
        .addSelect('COUNT(DISTINCT report.store_id)', 'stores_count')
        .addSelect('COUNT(DISTINCT report.report_date)', 'days_count')
        .where('store.company_id = :companyId', { companyId })
        .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      // Aplicar filtro de alcance para evitar doble conteo
      this.applyReportScopeFilter(totalsQb, reportScope);

      const totals = await totalsQb.getRawOne();

      // Desglose por tienda
      const storesQb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoin('report.store', 'store')
        .select('store.id', 'storeId')
        .addSelect('store.nombre', 'store_name')
        .addSelect('store.codigo', 'store_code')
        .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
        .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
        .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
        .addSelect('COUNT(*)', 'reports_count')
        .where('store.company_id = :companyId', { companyId })
        .andWhere('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      // Aplicar filtro de alcance para evitar doble conteo
      this.applyReportScopeFilter(storesQb, reportScope);

      const storesBreakdown = await storesQb
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
          total_service_charge: parseFloat(totals.total_service_charge) || 0,
          total_payment: parseFloat(totals.total_payment) || 0,
          reports_count: parseInt(totals.reports_count) || 0,
          stores_count: parseInt(totals.stores_count) || 0,
          days_count: parseInt(totals.days_count) || 0,
        },
        stores_breakdown: storesBreakdown.map((s: any) => ({
          storeId: s.storeId,
          store_name: s.store_name,
          store_code: s.store_code,
          total_sales: parseFloat(s.total_sales) || 0,
          total_revenue: parseFloat(s.total_revenue) || 0,
          total_orders: parseInt(s.total_orders) || 0,
          reports_count: parseInt(s.reports_count) || 0,
        })),
      };
    });
  }

  /**
   * Consolidar todas las compañías (global)
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param reportScope - Alcance: individual, consolidated, o all (default: individual)
   * @returns Totales globales con desglose por compañía
   */
  async consolidateGlobal(
    dateFrom: string,
    dateTo: string,
    reportScope: ReportScopeEnum = ReportScopeEnum.INDIVIDUAL,
  ): Promise<{
    totals: {
      total_sales: number;
      total_revenue: number;
      total_quantity: number;
      total_orders: number;
      total_discounts: number;
      total_adjustments: number;
      total_service_charge: number;
      total_payment: number;
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
    return this.withSchema(async (manager) => {
      // Totales globales
      const totalsQb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoin('report.store', 'store')
        .leftJoin('store.company', 'company')
        .select('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
        .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
        .addSelect('COALESCE(SUM(report.total_quantity), 0)', 'total_quantity')
        .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
        .addSelect('COALESCE(SUM(report.total_discounts), 0)', 'total_discounts')
        .addSelect('COALESCE(SUM(report.total_adjustments), 0)', 'total_adjustments')
        .addSelect('COALESCE(SUM(report.total_service_charge), 0)', 'total_service_charge')
        .addSelect('COALESCE(SUM(report.total_payment), 0)', 'total_payment')
        .addSelect('COUNT(*)', 'reports_count')
        .addSelect('COUNT(DISTINCT store.id)', 'stores_count')
        .addSelect('COUNT(DISTINCT company.id)', 'companies_count')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      // Aplicar filtro de alcance para evitar doble conteo
      this.applyReportScopeFilter(totalsQb, reportScope);

      const totals = await totalsQb.getRawOne();

      // Desglose por compañía
      const companiesQb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoin('report.store', 'store')
        .leftJoin('store.company', 'company')
        .select('company.id', 'company_id')
        .addSelect('company.name', 'company_name')
        .addSelect('COALESCE(SUM(report.total_sales), 0)', 'total_sales')
        .addSelect('COALESCE(SUM(report.total_revenue), 0)', 'total_revenue')
        .addSelect('COALESCE(SUM(report.orders_count), 0)', 'total_orders')
        .addSelect('COUNT(DISTINCT store.id)', 'stores_count')
        .addSelect('COUNT(*)', 'reports_count')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      // Aplicar filtro de alcance para evitar doble conteo
      this.applyReportScopeFilter(companiesQb, reportScope);

      const companiesBreakdown = await companiesQb
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
          total_service_charge: parseFloat(totals.total_service_charge) || 0,
          total_payment: parseFloat(totals.total_payment) || 0,
          reports_count: parseInt(totals.reports_count) || 0,
          stores_count: parseInt(totals.stores_count) || 0,
          companies_count: parseInt(totals.companies_count) || 0,
        },
        companies_breakdown: companiesBreakdown.map((c: any) => ({
          company_id: c.company_id,
          company_name: c.company_name,
          total_sales: parseFloat(c.total_sales) || 0,
          total_revenue: parseFloat(c.total_revenue) || 0,
          total_orders: parseInt(c.total_orders) || 0,
          stores_count: parseInt(c.stores_count) || 0,
          reports_count: parseInt(c.reports_count) || 0,
        })),
      };
    });
  }

  /**
   * Consolidar ventas por tipo de orden
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(SalesByOrderTypeEntity)
        .createQueryBuilder('sot')
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
    });
  }

  /**
   * Consolidar métodos de pago
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(PaymentMethodEntity)
        .createQueryBuilder('pm')
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
    });
  }

  /**
   * Obtener resumen diario con desglose por empleados
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   *
   * Retorna todos los reportes de una tienda para una fecha específica,
   * separando los reportes individuales por empleado del reporte consolidado.
   *
   * @param storeId - UUID de la tienda
   * @param reportDate - Fecha del reporte (YYYY-MM-DD)
   * @returns Resumen con totales y desglose por empleado
   */
  async getDailySummaryByEmployees(
    storeId: string,
    reportDate: string,
  ): Promise<{
    employees: Array<{
      report_id: string;
      employee_id: number;
      employee_name: string;
      total_sales: number;
      total_revenue: number;
      orders_count: number;
      total_quantity: number;
      average_ticket: number;
      total_discounts: number;
    }>;
    consolidated: {
      report_id: string;
      total_sales: number;
      total_revenue: number;
      orders_count: number;
      total_quantity: number;
      average_ticket: number;
      total_discounts: number;
    } | null;
    totals: {
      total_sales: number;
      total_revenue: number;
      orders_count: number;
      total_quantity: number;
      total_discounts: number;
    };
  }> {
    return this.withSchema(async (manager) => {
      // Obtener todos los reportes de la tienda para esa fecha
      const reports = await manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .where('report.store_id = :storeId', { storeId })
        .andWhere('report.report_date = :reportDate', { reportDate })
        .orderBy('report.employee_name', 'ASC')
        .getMany();

      // Separar reportes individuales de empleados vs consolidado
      const employeeReports = reports.filter((r) => r.employee_id !== null);
      const consolidatedReport = reports.find((r) => r.employee_id === null) || null;

      // Mapear reportes de empleados
      const employees = employeeReports.map((r) => ({
        report_id: r.id,
        employee_id: r.employee_id!,
        employee_name: r.employee_name || 'Sin nombre',
        total_sales: r.total_sales || 0,
        total_revenue: r.total_revenue || 0,
        orders_count: r.orders_count || 0,
        total_quantity: r.total_quantity || 0,
        average_ticket: r.average_ticket || 0,
        total_discounts: r.total_discounts || 0,
      }));

      // Mapear reporte consolidado si existe
      const consolidated = consolidatedReport
        ? {
            report_id: consolidatedReport.id,
            total_sales: consolidatedReport.total_sales || 0,
            total_revenue: consolidatedReport.total_revenue || 0,
            orders_count: consolidatedReport.orders_count || 0,
            total_quantity: consolidatedReport.total_quantity || 0,
            average_ticket: consolidatedReport.average_ticket || 0,
            total_discounts: consolidatedReport.total_discounts || 0,
          }
        : null;

      // Calcular totales sumando reportes de empleados (NO el consolidado)
      const totals = employees.reduce(
        (acc, emp) => ({
          total_sales: acc.total_sales + emp.total_sales,
          total_revenue: acc.total_revenue + emp.total_revenue,
          orders_count: acc.orders_count + emp.orders_count,
          total_quantity: acc.total_quantity + emp.total_quantity,
          total_discounts: acc.total_discounts + emp.total_discounts,
        }),
        {
          total_sales: 0,
          total_revenue: 0,
          orders_count: 0,
          total_quantity: 0,
          total_discounts: 0,
        },
      );

      return {
        employees,
        consolidated,
        totals,
      };
    });
  }

  /**
   * Obtener desglose diario
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
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
    });
  }

  // ============================================
  // SECCIÓN 4: RANKINGS
  // ============================================

  /**
   * Ranking de tiendas por métrica
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async getRankingByStores(dto: RankingStoresDto): Promise<
    Array<{
      position: number;
      storeId: string;
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
    return this.withSchema(async (manager) => {
      const metricColumn = this.getMetricColumn(dto.metric);
      const sortDirection = dto.direction === RankingDirectionEnum.BOTTOM ? 'ASC' : 'DESC';

      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoin('report.store', 'store')
        .leftJoin('store.company', 'company')
        .select('store.id', 'storeId')
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

      return results.map((r: any, index: number) => {
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
          storeId: r.storeId,
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
    });
  }

  /**
   * Ranking de compañías por métrica
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
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
    return this.withSchema(async (manager) => {
      const metricColumn = this.getMetricColumn(metric);
      const sortDirection = direction === RankingDirectionEnum.BOTTOM ? 'ASC' : 'DESC';

      const results = await manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
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

      return results.map((r: any, index: number) => {
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
    });
  }

  /**
   * Aplicar filtro de alcance (scope) al QueryBuilder
   *
   * @description
   * Filtra reportes por employee_id para evitar doble conteo
   * cuando existen tanto reportes individuales como consolidados.
   *
   * @param qb - QueryBuilder a modificar
   * @param scope - Alcance: individual, consolidated, o all
   */
  private applyReportScopeFilter(
    qb: import('typeorm').SelectQueryBuilder<ReportHeaderEntity>,
    scope: ReportScopeEnum,
  ): void {
    switch (scope) {
      case ReportScopeEnum.INDIVIDUAL:
        // Solo reportes por empleado (evita doble conteo sumando individuales)
        qb.andWhere('report.employee_id IS NOT NULL');
        break;
      case ReportScopeEnum.CONSOLIDATED:
        // Solo reportes consolidados (sin empleado)
        qb.andWhere('report.employee_id IS NULL');
        break;
      case ReportScopeEnum.ALL:
        // No aplicar filtro (puede causar doble conteo)
        break;
    }
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

  /**
   * Comparar tiendas
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async compareStores(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      storeId: string;
      store_name: string;
      store_code: string;
      total_sales: number;
      total_revenue: number;
      total_orders: number;
      average_ticket: number;
      reports_count: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const results = await manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .leftJoin('report.store', 'store')
        .select('store.id', 'storeId')
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

      return results.map((r: any) => ({
        storeId: r.storeId,
        store_name: r.store_name,
        store_code: r.store_code,
        total_sales: parseFloat(r.total_sales) || 0,
        total_revenue: parseFloat(r.total_revenue) || 0,
        total_orders: parseInt(r.total_orders) || 0,
        average_ticket:
          parseInt(r.total_orders) > 0 ? parseFloat(r.total_sales) / parseInt(r.total_orders) : 0,
        reports_count: parseInt(r.reports_count) || 0,
      }));
    });
  }

  /**
   * Comparar períodos
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
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
    return this.withSchema(async (manager) => {
      const buildQuery = (dateFrom: string, dateTo: string) => {
        const qb = manager
          .getRepository(ReportHeaderEntity)
          .createQueryBuilder('report')
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
    });
  }

  /**
   * Comparar por día de la semana
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
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
    return this.withSchema(async (manager) => {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
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

      return results.map((r: any) => {
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
    });
  }

  // ============================================
  // SECCIÓN 6: ESTADÍSTICAS
  // ============================================

  /**
   * Estadísticas globales
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async getGlobalStats(): Promise<{
    total_reports: number;
    reports_today: number;
    reports_this_week: number;
    reports_this_month: number;
    stores_with_reports: number;
    companies_with_reports: number;
  }> {
    return this.withSchema(async (manager) => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const repo = manager.getRepository(ReportHeaderEntity);

      const [total, reportsToday, reportsThisWeek, reportsThisMonth, stores, companies] =
        await Promise.all([
          repo.createQueryBuilder('report').getCount(),
          repo
            .createQueryBuilder('report')
            .where('report.report_date = :today', { today })
            .getCount(),
          repo
            .createQueryBuilder('report')
            .where('report.report_date >= :weekAgo', { weekAgo })
            .getCount(),
          repo
            .createQueryBuilder('report')
            .where('report.report_date >= :monthStart', { monthStart })
            .getCount(),
          repo
            .createQueryBuilder('report')
            .select('COUNT(DISTINCT report.store_id)', 'count')
            .getRawOne(),
          repo
            .createQueryBuilder('report')
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
    });
  }

  /**
   * Estadísticas de período
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
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
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
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
        qb.leftJoin('report.store', 'store').andWhere('store.company_id = :companyId', {
          companyId,
        });
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
    });
  }

  /**
   * Tendencias temporales
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
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
    return this.withSchema(async (manager) => {
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

      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
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

      return results.map((r: any) => {
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
    });
  }

  // ============================================
  // SECCIÓN 7: OPERACIONES CON DETALLES
  // ============================================

  /**
   * Agregar tipo de orden a reporte
   *
   * MULTI-TENANT: Usa withSchemaTransaction() - entidades de detalle en schema tenant
   */
  async addSalesByOrderType(
    reportId: string,
    data: Partial<SalesByOrderTypeEntity>,
  ): Promise<SalesByOrderTypeEntity> {
    return this.withSchemaTransaction(async (manager) => {
      const entity = manager.create(SalesByOrderTypeEntity, {
        ...data,
        report_header_id: reportId,
      });
      return await manager.save(SalesByOrderTypeEntity, entity);
    });
  }

  /**
   * Agregar método de pago a reporte
   *
   * MULTI-TENANT: Usa withSchemaTransaction() - entidades de detalle en schema tenant
   */
  async addPaymentMethod(
    reportId: string,
    data: Partial<PaymentMethodEntity>,
  ): Promise<PaymentMethodEntity> {
    return this.withSchemaTransaction(async (manager) => {
      const entity = manager.create(PaymentMethodEntity, { ...data, report_header_id: reportId });
      return await manager.save(PaymentMethodEntity, entity);
    });
  }

  /**
   * Agregar descuento dinámico a reporte
   *
   * MULTI-TENANT: Usa withSchemaTransaction() - entidades de detalle en schema tenant
   */
  async addDynamicDiscount(
    reportId: string,
    data: Partial<DynamicDiscountEntity>,
  ): Promise<DynamicDiscountEntity> {
    return this.withSchemaTransaction(async (manager) => {
      const entity = manager.create(DynamicDiscountEntity, { ...data, report_header_id: reportId });
      return await manager.save(DynamicDiscountEntity, entity);
    });
  }

  /**
   * Agregar ajuste a reporte
   *
   * MULTI-TENANT: Usa withSchemaTransaction() - entidades de detalle en schema tenant
   */
  async addAdjustment(
    reportId: string,
    data: Partial<AdjustmentEntity>,
  ): Promise<AdjustmentEntity> {
    return this.withSchemaTransaction(async (manager) => {
      const entity = manager.create(AdjustmentEntity, { ...data, report_header_id: reportId });
      return await manager.save(AdjustmentEntity, entity);
    });
  }

  /**
   * Agregar orden efectiva a reporte
   *
   * MULTI-TENANT: Usa withSchemaTransaction() - entidades de detalle en schema tenant
   */
  async addEffectiveOrder(
    reportId: string,
    data: Partial<EffectiveOrderEntity>,
  ): Promise<EffectiveOrderEntity> {
    return this.withSchemaTransaction(async (manager) => {
      const entity = manager.create(EffectiveOrderEntity, { ...data, report_header_id: reportId });
      return await manager.save(EffectiveOrderEntity, entity);
    });
  }

  /**
   * Obtener tipos de orden de un reporte
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async getSalesByOrderType(reportId: string): Promise<SalesByOrderTypeEntity[]> {
    return this.withSchema(async (manager) => {
      return await manager
        .getRepository(SalesByOrderTypeEntity)
        .createQueryBuilder('sot')
        .where('sot.report_header_id = :reportId', { reportId })
        .orderBy('sot.total_sales', 'DESC')
        .getMany();
    });
  }

  /**
   * Obtener métodos de pago de un reporte
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async getPaymentMethods(reportId: string): Promise<PaymentMethodEntity[]> {
    return this.withSchema(async (manager) => {
      return await manager
        .getRepository(PaymentMethodEntity)
        .createQueryBuilder('pm')
        .where('pm.report_header_id = :reportId', { reportId })
        .orderBy('pm.total_amount', 'DESC')
        .getMany();
    });
  }

  /**
   * Obtener descuentos dinámicos de un reporte
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async getDynamicDiscounts(reportId: string): Promise<DynamicDiscountEntity[]> {
    return this.withSchema(async (manager) => {
      return await manager
        .getRepository(DynamicDiscountEntity)
        .createQueryBuilder('dd')
        .where('dd.report_header_id = :reportId', { reportId })
        .orderBy('dd.total_discount', 'DESC')
        .getMany();
    });
  }

  /**
   * Obtener ajustes de un reporte
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async getAdjustments(reportId: string): Promise<AdjustmentEntity[]> {
    return this.withSchema(async (manager) => {
      return await manager
        .getRepository(AdjustmentEntity)
        .createQueryBuilder('adj')
        .where('adj.report_header_id = :reportId', { reportId })
        .orderBy('adj.total_amount', 'DESC')
        .getMany();
    });
  }

  /**
   * Obtener órdenes efectivas de un reporte
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async getEffectiveOrders(reportId: string, limit = 100): Promise<EffectiveOrderEntity[]> {
    return this.withSchema(async (manager) => {
      return await manager
        .getRepository(EffectiveOrderEntity)
        .createQueryBuilder('eo')
        .where('eo.report_header_id = :reportId', { reportId })
        .orderBy('eo.order_datetime', 'DESC')
        .limit(limit)
        .getMany();
    });
  }

  /**
   * Eliminar todos los detalles de un reporte
   *
   * MULTI-TENANT: Usa withSchemaTransaction() - DELETE en schema tenant
   */
  async deleteAllDetails(reportId: string): Promise<void> {
    return this.withSchemaTransaction(async (manager) => {
      await Promise.all([
        manager.delete(SalesByOrderTypeEntity, { report_header_id: reportId }),
        manager.delete(PaymentMethodEntity, { report_header_id: reportId }),
        manager.delete(DynamicDiscountEntity, { report_header_id: reportId }),
        manager.delete(AdjustmentEntity, { report_header_id: reportId }),
        manager.delete(EffectiveOrderEntity, { report_header_id: reportId }),
      ]);
    });
  }

  /**
   * Contar reportes por estado
   *
   * MULTI-TENANT: Usa withSchema() + manager.getRepository()
   */
  async countByStatus(companyId?: string): Promise<Record<string, number>> {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ReportHeaderEntity)
        .createQueryBuilder('report')
        .select('report.status', 'status')
        .addSelect('COUNT(*)', 'count');

      if (companyId) {
        qb.leftJoin('report.store', 'store').where('store.company_id = :companyId', { companyId });
      }

      qb.groupBy('report.status');
      const results = await qb.getRawMany();

      return results.reduce(
        (acc: any, r: any) => {
          acc[r.status] = parseInt(r.count);
          return acc;
        },
        {} as Record<string, number>,
      );
    });
  }

  // ============================================
  // SECCIÓN 8: DASHBOARD ENRIQUECIDO v1.1.0
  // ============================================

  /**
   * Top categorías de venta consolidadas
   *
   * @param storeIds - Filtrar por tiendas (vacío = todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param limit - Máximo de resultados
   */
  async getTopCategories(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
    limit = 10,
  ): Promise<
    Array<{
      category_name: string;
      total_items_sold: number;
      total_sales: number;
      percentage_of_total: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(CategorySalesEntity)
        .createQueryBuilder('cs')
        .leftJoin('cs.report_header', 'report')
        .select('cs.category_name', 'category_name')
        .addSelect('COALESCE(SUM(cs.items_sold), 0)', 'total_items_sold')
        .addSelect('COALESCE(SUM(cs.total_sales), 0)', 'total_sales')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }

      qb.groupBy('cs.category_name').orderBy('total_sales', 'DESC').limit(limit);

      const results = await qb.getRawMany();
      const totalSales = results.reduce((sum, r) => sum + parseFloat(r.total_sales), 0);

      return results.map((r) => ({
        category_name: r.category_name,
        total_items_sold: parseInt(r.total_items_sold) || 0,
        total_sales: parseFloat(r.total_sales) || 0,
        percentage_of_total: totalSales > 0 ? (parseFloat(r.total_sales) / totalSales) * 100 : 0,
      }));
    });
  }

  /**
   * Top empleados por ventas consolidadas
   *
   * @param storeIds - Filtrar por tiendas (vacío = todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   * @param limit - Máximo de resultados
   */
  async getTopEmployees(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
    limit = 10,
  ): Promise<
    Array<{
      employee_id: number;
      employee_name: string;
      total_checks: number;
      gross_sales: number;
      net_sales: number;
      average_ticket: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(EmployeeSalesEntity)
        .createQueryBuilder('es')
        .leftJoin('es.report_header', 'report')
        .select('es.employee_id', 'employee_id')
        .addSelect('es.employee_name', 'employee_name')
        .addSelect('COALESCE(SUM(es.total_checks), 0)', 'total_checks')
        .addSelect('COALESCE(SUM(es.gross_sales), 0)', 'gross_sales')
        .addSelect('COALESCE(SUM(es.net_sales), 0)', 'net_sales')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }

      qb.groupBy('es.employee_id')
        .addGroupBy('es.employee_name')
        .orderBy('gross_sales', 'DESC')
        .limit(limit);

      const results = await qb.getRawMany();

      return results.map((r) => {
        const grossSales = parseFloat(r.gross_sales) || 0;
        const totalChecks = parseInt(r.total_checks) || 0;
        return {
          employee_id: parseInt(r.employee_id),
          employee_name: r.employee_name,
          total_checks: totalChecks,
          gross_sales: grossSales,
          net_sales: parseFloat(r.net_sales) || 0,
          average_ticket: totalChecks > 0 ? grossSales / totalChecks : 0,
        };
      });
    });
  }

  /**
   * Distribución de ingresos por método de pago (tender type)
   *
   * @param storeIds - Filtrar por tiendas (vacío = todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   */
  async getPaymentDistribution(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      tender_type: string;
      tender_name: string;
      transaction_count: number;
      total_amount: number;
      percentage_of_total: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(IncomeByTenderTypeEntity)
        .createQueryBuilder('itt')
        .leftJoin('itt.report_header', 'report')
        .select('itt.tender_type', 'tender_type')
        .addSelect('itt.tender_name', 'tender_name')
        .addSelect('COALESCE(SUM(itt.transaction_count), 0)', 'transaction_count')
        .addSelect('COALESCE(SUM(itt.total_amount), 0)', 'total_amount')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }

      qb.groupBy('itt.tender_type').addGroupBy('itt.tender_name').orderBy('total_amount', 'DESC');

      const results = await qb.getRawMany();
      const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);

      return results.map((r) => ({
        tender_type: r.tender_type,
        tender_name: r.tender_name,
        transaction_count: parseInt(r.transaction_count) || 0,
        total_amount: parseFloat(r.total_amount) || 0,
        percentage_of_total: totalAmount > 0 ? (parseFloat(r.total_amount) / totalAmount) * 100 : 0,
      }));
    });
  }

  /**
   * Revenue centers consolidados
   *
   * @param storeIds - Filtrar por tiendas (vacío = todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   */
  async getRevenueCenterBreakdown(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      revenue_center_name: string;
      total_checks: number;
      total_sales: number;
      average_ticket: number;
      percentage_of_total: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(RevenueCenterSalesEntity)
        .createQueryBuilder('rcs')
        .leftJoin('rcs.report_header', 'report')
        .select('rcs.revenue_center_name', 'revenue_center_name')
        .addSelect('COALESCE(SUM(rcs.total_checks), 0)', 'total_checks')
        .addSelect('COALESCE(SUM(rcs.total_sales), 0)', 'total_sales')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }

      qb.groupBy('rcs.revenue_center_name').orderBy('total_sales', 'DESC');

      const results = await qb.getRawMany();
      const totalSales = results.reduce((sum, r) => sum + parseFloat(r.total_sales), 0);

      return results.map((r) => {
        const sales = parseFloat(r.total_sales) || 0;
        const checks = parseInt(r.total_checks) || 0;
        return {
          revenue_center_name: r.revenue_center_name,
          total_checks: checks,
          total_sales: sales,
          average_ticket: checks > 0 ? sales / checks : 0,
          percentage_of_total: totalSales > 0 ? (sales / totalSales) * 100 : 0,
        };
      });
    });
  }

  /**
   * Service charges consolidados
   *
   * @param storeIds - Filtrar por tiendas (vacío = todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   */
  async getServiceChargesBreakdown(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      service_charge_name: string;
      total_quantity: number;
      total_amount: number;
      percentage_of_total: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(ServiceChargeEntity)
        .createQueryBuilder('sc')
        .leftJoin('sc.report_header', 'report')
        .select('sc.service_charge_name', 'service_charge_name')
        .addSelect('COALESCE(SUM(sc.quantity), 0)', 'total_quantity')
        .addSelect('COALESCE(SUM(sc.total_amount), 0)', 'total_amount')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }

      qb.groupBy('sc.service_charge_name').orderBy('total_amount', 'DESC');

      const results = await qb.getRawMany();
      const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);

      return results.map((r) => ({
        service_charge_name: r.service_charge_name,
        total_quantity: parseInt(r.total_quantity) || 0,
        total_amount: parseFloat(r.total_amount) || 0,
        percentage_of_total: totalAmount > 0 ? (parseFloat(r.total_amount) / totalAmount) * 100 : 0,
      }));
    });
  }

  // ============================================
  // SECCIÓN 9: QUERIES ANALÍTICAS v1.1.0 - FASE 3
  // ============================================

  /**
   * Ingresos por clase de pago consolidados
   *
   * @param storeIds - Filtrar por tiendas (vacío = todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   */
  async getIncomeByClassBreakdown(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      class_name: string;
      currency_name: string;
      currency_symbol: string;
      transaction_count: number;
      total_amount: number;
      percentage_of_total: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(IncomeByClassEntity)
        .createQueryBuilder('ibc')
        .leftJoin('ibc.report_header', 'report')
        .select('ibc.class_name', 'class_name')
        .addSelect('ibc.currency_name', 'currency_name')
        .addSelect('ibc.currency_symbol', 'currency_symbol')
        .addSelect('COALESCE(SUM(ibc.transaction_count), 0)', 'transaction_count')
        .addSelect('COALESCE(SUM(ibc.total_amount), 0)', 'total_amount')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }

      qb.groupBy('ibc.class_name')
        .addGroupBy('ibc.currency_name')
        .addGroupBy('ibc.currency_symbol')
        .orderBy('total_amount', 'DESC');

      const results = await qb.getRawMany();
      const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);

      return results.map((r) => ({
        class_name: r.class_name,
        currency_name: r.currency_name,
        currency_symbol: r.currency_symbol,
        transaction_count: parseInt(r.transaction_count) || 0,
        total_amount: parseFloat(r.total_amount) || 0,
        percentage_of_total: totalAmount > 0 ? (parseFloat(r.total_amount) / totalAmount) * 100 : 0,
      }));
    });
  }

  /**
   * Cash summary consolidado (resumen de efectivo por tender)
   *
   * @param storeIds - Filtrar por tiendas (vacío = todas)
   * @param dateFrom - Fecha inicio
   * @param dateTo - Fecha fin
   */
  async getCashSummaryBreakdown(
    storeIds: string[],
    dateFrom: string,
    dateTo: string,
  ): Promise<
    Array<{
      tender_name: string;
      total_quantity: number;
      total_amount: number;
      percentage_of_total: number;
    }>
  > {
    return this.withSchema(async (manager) => {
      const qb = manager
        .getRepository(CashSummaryEntity)
        .createQueryBuilder('cs')
        .leftJoin('cs.report_header', 'report')
        .select('cs.tender_name', 'tender_name')
        .addSelect('COALESCE(SUM(cs.quantity), 0)', 'total_quantity')
        .addSelect('COALESCE(SUM(cs.total_amount), 0)', 'total_amount')
        .where('report.report_date BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo });

      if (storeIds.length > 0) {
        qb.andWhere('report.store_id IN (:...storeIds)', { storeIds });
      }

      qb.groupBy('cs.tender_name').orderBy('total_amount', 'DESC');

      const results = await qb.getRawMany();
      const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);

      return results.map((r) => ({
        tender_name: r.tender_name,
        total_quantity: parseInt(r.total_quantity) || 0,
        total_amount: parseFloat(r.total_amount) || 0,
        percentage_of_total: totalAmount > 0 ? (parseFloat(r.total_amount) / totalAmount) * 100 : 0,
      }));
    });
  }
}
