// src/modules/reports/interfaces/consolidated-report.interface.ts

/**
 * @fileoverview Interfaces para reportes consolidados
 * @module modules/reports
 *
 * ACTUALIZACIÓN: 2025-01-28
 * Se cambió order_type y payment_method de enums a strings
 * para soportar valores dinámicos.
 *
 * @version 2.0.0 - Flexibilización de tipado
 */

import { ReportTypeEnum, ConsolidationLevelEnum } from '../enums';

/**
 * Interfaces para reportes consolidados
 *
 * @description
 * Define las estructuras de respuesta para consolidaciones
 * a nivel de tienda, compañía o global (todas las compañías).
 */

// ============================================
// INTERFACES BASE DE CONSOLIDACIÓN
// ============================================

/**
 * Totales consolidados base
 */
export interface IConsolidatedTotals {
  total_sales: number;
  total_revenue: number;
  total_quantity: number;
  total_orders: number;
  total_discounts: number;
  total_adjustments: number;
  total_service_charge: number;
  total_payment: number;
  average_ticket: number;

  // Contadores
  reports_count: number;
  stores_count: number;
  days_count: number;
}

/**
 * Desglose por tipo de orden consolidado
 *
 * @updated 2025-01-28 - order_type cambió de OrderTypeEnum a string
 */
export interface IConsolidatedSalesByOrderType {
  order_type: string; // Cambió de OrderTypeEnum a string
  total_sales: number;
  total_orders: number;
  total_quantity: number;
  average_ticket: number;
  percentage_of_total: number;
}

/**
 * Desglose por método de pago consolidado
 *
 * @updated 2025-01-28 - payment_method cambió de PaymentMethodTypeEnum a string
 */
export interface IConsolidatedPaymentMethod {
  payment_method: string; // Cambió de PaymentMethodTypeEnum a string
  total_amount: number;
  transactions_count: number;
  average_amount: number;
  percentage_of_total: number;
}

/**
 * Desglose por tienda en consolidado
 */
export interface IStoreBreakdown {
  storeId: string;
  store_name: string;
  store_code: string;
  store_city?: string;
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  average_ticket: number;
  percentage_of_total: number;
  reports_count: number;
}

/**
 * Desglose por día en consolidado
 */
export interface IDailyBreakdown {
  date: Date;
  day_of_week: string;
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  average_ticket: number;
  stores_reported: number;
}

// ============================================
// RESPUESTA PRINCIPAL DE CONSOLIDACIÓN
// ============================================

/**
 * Respuesta de reporte consolidado
 *
 * @description
 * Estructura completa de un reporte consolidado que puede
 * incluir datos de múltiples tiendas y/o días.
 */
export interface IConsolidatedReportResponse {
  // Metadata de la consolidación
  consolidation_level: ConsolidationLevelEnum;
  report_type: ReportTypeEnum;
  date_from: Date;
  date_to: Date;
  generated_at: Date;

  // Entidad padre (según nivel)
  company_id?: string;
  company_name?: string;
  storeId?: string;
  store_name?: string;

  // Totales consolidados
  totals: IConsolidatedTotals;

  // Desgloses opcionales
  stores_breakdown?: IStoreBreakdown[];
  daily_breakdown?: IDailyBreakdown[];
  order_type_breakdown?: IConsolidatedSalesByOrderType[];
  payment_method_breakdown?: IConsolidatedPaymentMethod[];

  // Desgloses v1.1.0
  category_breakdown?: Array<{
    category_name: string;
    total_items_sold: number;
    total_sales: number;
    percentage_of_total: number;
  }>;
  revenue_center_breakdown?: Array<{
    revenue_center_name: string;
    total_checks: number;
    total_sales: number;
    average_ticket: number;
    percentage_of_total: number;
  }>;
  employee_breakdown?: Array<{
    employee_id: number;
    employee_name: string;
    total_checks: number;
    gross_sales: number;
    net_sales: number;
    average_ticket: number;
  }>;
  tender_type_breakdown?: Array<{
    tender_type: string;
    tender_name: string;
    transaction_count: number;
    total_amount: number;
    percentage_of_total: number;
  }>;

  // Métricas adicionales
  metrics?: {
    best_day?: {
      date: Date;
      total_sales: number;
    };
    worst_day?: {
      date: Date;
      total_sales: number;
    };
    best_store?: {
      storeId: string;
      store_name: string;
      total_sales: number;
    };
    worst_store?: {
      storeId: string;
      store_name: string;
      total_sales: number;
    };
  };
}

// ============================================
// CONSOLIDACIÓN A NIVEL DE TIENDA
// ============================================

/**
 * Consolidado de una tienda individual
 *
 * @description
 * Reporte consolidado de una sola tienda durante un período.
 */
export interface IStoreConsolidatedResponse extends IConsolidatedReportResponse {
  consolidation_level: ConsolidationLevelEnum.STORE;
  storeId: string;
  store_name: string;
  store_code: string;
  store_city: string;

  // Sin stores_breakdown (es solo 1 tienda)
  stores_breakdown?: never;
}

// ============================================
// CONSOLIDACIÓN A NIVEL DE COMPAÑÍA
// ============================================

/**
 * Consolidado de una compañía
 *
 * @description
 * Reporte consolidado de todas las tiendas de una compañía.
 */
export interface ICompanyConsolidatedResponse extends IConsolidatedReportResponse {
  consolidation_level: ConsolidationLevelEnum.COMPANY;
  company_id: string;
  company_name: string;

  // Incluye stores_breakdown
  stores_breakdown: IStoreBreakdown[];

  // Estadísticas de tiendas
  store_stats: {
    total_stores: number;
    active_stores: number;
    stores_with_reports: number;
    stores_without_reports: string[]; // IDs de tiendas sin reportes
  };
}

// ============================================
// CONSOLIDACIÓN GLOBAL
// ============================================

/**
 * Desglose por compañía en consolidado global
 */
export interface ICompanyBreakdown {
  company_id: string;
  company_name: string;
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  average_ticket: number;
  percentage_of_total: number;
  stores_count: number;
  reports_count: number;
}

/**
 * Consolidado global (todas las compañías)
 *
 * @description
 * Reporte consolidado de todas las tiendas de todas las compañías.
 * Solo accesible para SUPER_ADMIN y ADMIN.
 */
export interface IGlobalConsolidatedResponse extends IConsolidatedReportResponse {
  consolidation_level: ConsolidationLevelEnum.ALL_COMPANIES;

  // Desglose por compañía
  companies_breakdown: ICompanyBreakdown[];

  // Estadísticas globales
  global_stats: {
    total_companies: number;
    total_stores: number;
    active_stores: number;
    companies_with_reports: number;
    stores_with_reports: number;
  };
}

// ============================================
// RESPUESTA DE CONSOLIDACIÓN RÁPIDA
// ============================================

/**
 * Respuesta de consolidación rápida
 *
 * @description
 * Versión simplificada para endpoints de consolidación rápida.
 */
export interface IQuickConsolidatedResponse {
  period: string;
  period_label: string; // "Hoy", "Esta Semana", etc.
  consolidation_level: ConsolidationLevelEnum;
  date_from: Date;
  date_to: Date;

  // Totales simplificados
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  average_ticket: number;

  // Comparación con período anterior
  vs_previous_period?: {
    sales_change: number;
    sales_change_percentage: number;
    orders_change: number;
    orders_change_percentage: number;
  };
}
