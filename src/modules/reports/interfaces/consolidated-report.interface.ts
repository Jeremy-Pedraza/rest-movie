// src/modules/reports/interfaces/consolidated-report.interface.ts

import { ReportTypeEnum, ConsolidationLevelEnum } from '../enums';
import { OrderTypeEnum, PaymentMethodTypeEnum } from '../dto';

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
  average_ticket: number;

  // Contadores
  reports_count: number;
  stores_count: number;
  days_count: number;
}

/**
 * Desglose por tipo de orden consolidado
 */
export interface IConsolidatedSalesByOrderType {
  order_type: OrderTypeEnum;
  total_sales: number;
  total_orders: number;
  total_quantity: number;
  average_ticket: number;
  percentage_of_total: number;
}

/**
 * Desglose por método de pago consolidado
 */
export interface IConsolidatedPaymentMethod {
  payment_method: PaymentMethodTypeEnum;
  total_amount: number;
  transactions_count: number;
  average_amount: number;
  percentage_of_total: number;
}

/**
 * Desglose por tienda en consolidado
 */
export interface IStoreBreakdown {
  store_id: string;
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
  store_id?: string;
  store_name?: string;

  // Totales consolidados
  totals: IConsolidatedTotals;

  // Desgloses opcionales
  stores_breakdown?: IStoreBreakdown[];
  daily_breakdown?: IDailyBreakdown[];
  order_type_breakdown?: IConsolidatedSalesByOrderType[];
  payment_method_breakdown?: IConsolidatedPaymentMethod[];

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
      store_id: string;
      store_name: string;
      total_sales: number;
    };
    worst_store?: {
      store_id: string;
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
  store_id: string;
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
