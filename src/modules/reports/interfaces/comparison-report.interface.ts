// src/modules/reports/interfaces/comparison-report.interface.ts

/**
 * @fileoverview Interfaces para comparaciones de reportes
 * @module modules/reports
 *
 * ACTUALIZACIÓN: 2025-01-28
 * Se cambió order_type y payment_method de enums a strings
 * para soportar valores dinámicos.
 *
 * @version 2.0.0 - Flexibilización de tipado
 */

import { ReportTypeEnum, ConsolidationLevelEnum } from '../enums';
import { ComparisonTypeEnum } from '../dto';

/**
 * Interfaces para comparaciones de reportes
 *
 * @description
 * Define las estructuras de respuesta para comparativas
 * entre tiendas, períodos, días de la semana, etc.
 */

// ============================================
// INTERFACES BASE DE COMPARACIÓN
// ============================================

/**
 * Diferencia entre dos valores
 */
export interface IValueDifference {
  absolute: number; // Diferencia absoluta
  percentage: number; // Diferencia porcentual
  direction: 'up' | 'down' | 'same'; // Dirección del cambio
}

/**
 * Métricas comparadas
 */
export interface IComparedMetrics {
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  average_ticket: number;
  total_quantity: number;
}

/**
 * Métricas con diferencias calculadas
 */
export interface IMetricsWithDifferences extends IComparedMetrics {
  differences: {
    total_sales: IValueDifference;
    total_revenue: IValueDifference;
    total_orders: IValueDifference;
    average_ticket: IValueDifference;
    total_quantity: IValueDifference;
  };
}

// ============================================
// COMPARACIÓN DE TIENDAS
// ============================================

/**
 * Datos de una tienda en comparación
 *
 * @updated 2025-01-28 - order_type_breakdown y payment_method_breakdown cambiaron a string
 */
export interface IStoreComparisonData {
  store_id: string;
  store_name: string;
  store_code: string;
  store_city?: string;
  company_id?: string;
  company_name?: string;

  // Métricas
  metrics: IComparedMetrics;

  // Posición en ranking
  rank_by_sales: number;
  rank_by_orders: number;
  rank_by_ticket: number;

  // Desglose opcional
  order_type_breakdown?: Array<{
    order_type: string; // Cambió de OrderTypeEnum a string
    total_sales: number;
    percentage: number;
  }>;

  payment_method_breakdown?: Array<{
    payment_method: string; // Cambió de PaymentMethodTypeEnum a string
    total_amount: number;
    percentage: number;
  }>;
}

/**
 * Respuesta de comparación de tiendas
 *
 * @description
 * Compara múltiples tiendas en el mismo período de tiempo.
 */
export interface IStoresComparisonResponse {
  comparison_type: ComparisonTypeEnum.STORES;
  date_from: Date;
  date_to: Date;
  report_type: ReportTypeEnum;
  generated_at: Date;

  // Tiendas comparadas
  stores: IStoreComparisonData[];
  stores_count: number;

  // Totales y promedios
  totals: IComparedMetrics;
  averages: IComparedMetrics;

  // Mejor y peor
  best_store: {
    by_sales: IStoreComparisonData;
    by_orders: IStoreComparisonData;
    by_ticket: IStoreComparisonData;
  };
  worst_store: {
    by_sales: IStoreComparisonData;
    by_orders: IStoreComparisonData;
    by_ticket: IStoreComparisonData;
  };

  // Dispersión (variabilidad entre tiendas)
  dispersion?: {
    sales_std_dev: number;
    orders_std_dev: number;
    ticket_std_dev: number;
  };
}

// ============================================
// COMPARACIÓN DE PERÍODOS
// ============================================

/**
 * Datos de un período en comparación
 */
export interface IPeriodComparisonData {
  period_label: string; // "Enero 2025", "Semana 1", etc.
  date_from: Date;
  date_to: Date;
  days_count: number;

  // Métricas
  metrics: IComparedMetrics;

  // Promedios diarios
  daily_averages: {
    sales: number;
    orders: number;
    ticket: number;
  };
}

/**
 * Respuesta de comparación de períodos
 *
 * @description
 * Compara múltiples períodos de tiempo para una tienda o compañía.
 */
export interface IPeriodsComparisonResponse {
  comparison_type: ComparisonTypeEnum.PERIODS;
  store_id?: string;
  store_name?: string;
  company_id?: string;
  company_name?: string;
  consolidation_level: ConsolidationLevelEnum;
  generated_at: Date;

  // Períodos comparados (ordenados cronológicamente)
  periods: IPeriodComparisonData[];
  periods_count: number;

  // Diferencias entre períodos consecutivos
  period_differences: Array<{
    from_period: string;
    to_period: string;
    differences: IMetricsWithDifferences['differences'];
  }>;

  // Tendencia general
  trend: {
    sales: 'growing' | 'declining' | 'stable';
    sales_growth_rate: number; // % promedio de crecimiento
    orders: 'growing' | 'declining' | 'stable';
    orders_growth_rate: number;
  };
}

// ============================================
// COMPARACIÓN AÑO VS AÑO (YoY)
// ============================================

/**
 * Respuesta de comparación año vs año
 *
 * @description
 * Compara el mismo período del año anterior.
 */
export interface IYearOverYearComparisonResponse {
  comparison_type: ComparisonTypeEnum.YEAR_OVER_YEAR;
  store_id?: string;
  store_name?: string;
  company_id?: string;
  company_name?: string;
  consolidation_level: ConsolidationLevelEnum;
  generated_at: Date;

  // Período actual
  current_period: {
    year: number;
    date_from: Date;
    date_to: Date;
    metrics: IComparedMetrics;
  };

  // Período anterior (mismo período, año pasado)
  previous_period: {
    year: number;
    date_from: Date;
    date_to: Date;
    metrics: IComparedMetrics;
  };

  // Diferencias
  differences: IMetricsWithDifferences['differences'];

  // Contexto adicional
  context?: {
    days_in_current: number;
    days_in_previous: number;
    is_comparable: boolean; // true si tienen el mismo # de días
  };
}

// ============================================
// COMPARACIÓN MES VS MES (MoM)
// ============================================

/**
 * Respuesta de comparación mes vs mes
 */
export interface IMonthOverMonthComparisonResponse {
  comparison_type: ComparisonTypeEnum.MONTH_OVER_MONTH;
  store_id?: string;
  company_id?: string;
  consolidation_level: ConsolidationLevelEnum;
  generated_at: Date;

  // Mes actual
  current_month: {
    year: number;
    month: number;
    month_name: string;
    date_from: Date;
    date_to: Date;
    metrics: IComparedMetrics;
  };

  // Mes anterior
  previous_month: {
    year: number;
    month: number;
    month_name: string;
    date_from: Date;
    date_to: Date;
    metrics: IComparedMetrics;
  };

  // Diferencias
  differences: IMetricsWithDifferences['differences'];
}

// ============================================
// COMPARACIÓN POR DÍAS DE LA SEMANA
// ============================================

/**
 * Datos de un día de la semana
 */
export interface IDayOfWeekData {
  day_of_week: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  day_name: string;
  occurrences: number; // Cuántos días de ese tipo en el período
  metrics: IComparedMetrics;
  averages: IComparedMetrics; // Promedios por día
}

/**
 * Respuesta de comparación por días de la semana
 *
 * @description
 * Analiza el rendimiento por día de la semana.
 */
export interface IDaysOfWeekComparisonResponse {
  comparison_type: ComparisonTypeEnum.DAYS_OF_WEEK;
  store_id?: string;
  company_id?: string;
  consolidation_level: ConsolidationLevelEnum;
  date_from: Date;
  date_to: Date;
  generated_at: Date;

  // Datos por día de la semana
  days: IDayOfWeekData[];

  // Mejor y peor día
  best_day: {
    by_sales: IDayOfWeekData;
    by_orders: IDayOfWeekData;
  };
  worst_day: {
    by_sales: IDayOfWeekData;
    by_orders: IDayOfWeekData;
  };

  // Análisis
  analysis?: {
    weekday_vs_weekend: {
      weekday_avg_sales: number;
      weekend_avg_sales: number;
      difference_percentage: number;
    };
  };
}

// ============================================
// RESPUESTA UNIFICADA DE COMPARACIÓN
// ============================================

/**
 * Respuesta genérica de comparación
 *
 * @description
 * Union type que puede ser cualquier tipo de comparación.
 */
export type IComparisonResponse =
  | IStoresComparisonResponse
  | IPeriodsComparisonResponse
  | IYearOverYearComparisonResponse
  | IMonthOverMonthComparisonResponse
  | IDaysOfWeekComparisonResponse;

/**
 * Respuesta de comparación rápida
 *
 * @description
 * Versión simplificada para endpoints de comparación rápida.
 */
export interface IQuickComparisonResponse {
  comparison_label: string; // "Hoy vs Ayer", "Esta Semana vs Anterior", etc.
  current_period_label: string;
  previous_period_label: string;

  // Métricas actuales
  current: IComparedMetrics;

  // Métricas anteriores
  previous: IComparedMetrics;

  // Diferencias
  differences: IMetricsWithDifferences['differences'];

  // Resumen
  summary: string; // "Ventas aumentaron 15% respecto al período anterior"
}
