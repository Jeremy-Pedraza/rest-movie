// src/modules/reports/interfaces/report-response.interface.ts

import { ReportTypeEnum } from '../enums';
import {
  OrderTypeEnum,
  PaymentMethodTypeEnum,
  DiscountTypeEnum,
  AdjustmentTypeEnum,
  OrderStatusEnum,
  ReportStatusEnum,
} from '../dto';

/**
 * Interfaces de respuesta para el módulo Reports
 */

// ============================================
// INTERFACES DE DETALLE (SUB-ENTIDADES)
// ============================================

/**
 * Respuesta de ventas por tipo de orden
 */
export interface ISalesByOrderTypeResponse {
  id: string;
  report_header_id: string;
  order_type: OrderTypeEnum;
  total_sales: number;
  orders_count: number;
  quantity: number;
  average_ticket: number;
  percentage_of_total?: number; // % del total de ventas
  created_at: Date;
}

/**
 * Respuesta de método de pago
 */
export interface IPaymentMethodResponse {
  id: string;
  report_header_id: string;
  payment_method: PaymentMethodTypeEnum;
  total_amount: number;
  transactions_count: number;
  average_amount: number;
  percentage_of_total?: number; // % del total recaudado
  created_at: Date;
}

/**
 * Respuesta de descuento dinámico
 */
export interface IDynamicDiscountResponse {
  id: string;
  report_header_id: string;
  discount_type: DiscountTypeEnum;
  discount_name: string;
  total_discount: number;
  times_applied: number;
  average_discount: number;
  percentage_of_sales?: number; // % de descuento sobre ventas
  created_at: Date;
}

/**
 * Respuesta de ajuste
 */
export interface IAdjustmentResponse {
  id: string;
  report_header_id: string;
  adjustment_type: AdjustmentTypeEnum;
  reason?: string;
  total_amount: number;
  count: number;
  average_amount: number;
  percentage_of_sales?: number; // % sobre ventas totales
  created_at: Date;
}

/**
 * Respuesta de orden efectiva
 */
export interface IEffectiveOrderResponse {
  id: string;
  report_header_id: string;
  order_number: string;
  order_type: OrderTypeEnum;
  total_amount: number;
  gross_amount: number;
  discounts: number;
  items_count: number;
  payment_method?: PaymentMethodTypeEnum;
  order_datetime: Date;
  status: OrderStatusEnum;
  metadata?: Record<string, any>;
  created_at: Date;
}

// ============================================
// INTERFACE PRINCIPAL DE REPORTE
// ============================================

/**
 * Respuesta estándar de un reporte
 *
 * @description
 * Estructura base de datos que se retorna en las respuestas de la API
 * para operaciones con reportes.
 */
export interface IReportResponse {
  id: string;
  store_id: string;
  report_date: Date;
  report_type: ReportTypeEnum;

  // Métricas principales
  total_sales: number;
  total_revenue: number;
  total_quantity: number;
  orders_count: number;
  average_ticket: number;

  // Descuentos y ajustes
  total_discounts: number;
  total_adjustments: number;

  // Metadata y estado
  status: ReportStatusEnum;
  metadata?: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at?: Date;
}

/**
 * Respuesta de reporte con información de tienda
 *
 * @description
 * Extiende IReportResponse agregando información de la tienda
 * para cuando se popula la relación.
 */
export interface IReportWithStoreResponse extends IReportResponse {
  store?: {
    id: string;
    nombre: string;
    codigo: string;
    ciudad: string;
    company_id: string;
    company_name?: string;
  };
}

/**
 * Respuesta de reporte con todos los detalles
 *
 * @description
 * Extiende IReportWithStoreResponse agregando todos los arrays
 * de detalle (ventas por tipo, pagos, descuentos, etc.)
 */
export interface IReportWithDetailsResponse extends IReportWithStoreResponse {
  sales_by_order_type?: ISalesByOrderTypeResponse[];
  payment_methods?: IPaymentMethodResponse[];
  dynamic_discounts?: IDynamicDiscountResponse[];
  adjustments?: IAdjustmentResponse[];
  effective_orders?: IEffectiveOrderResponse[];
}

/**
 * Respuesta de reporte con métricas calculadas
 *
 * @description
 * Extiende IReportResponse agregando métricas derivadas
 * y KPIs calculados.
 */
export interface IReportWithMetricsResponse extends IReportResponse {
  // KPIs calculados
  gross_margin?: number; // Margen bruto %
  discount_rate?: number; // Tasa de descuento %
  adjustment_rate?: number; // Tasa de ajustes %
  items_per_order?: number; // Promedio de items por orden
  revenue_per_item?: number; // Revenue por item

  // Variaciones vs período anterior
  sales_variation?: number; // % variación ventas
  orders_variation?: number; // % variación órdenes
  ticket_variation?: number; // % variación ticket promedio
}

// ============================================
// INTERFACES DE ESTADÍSTICAS
// ============================================

/**
 * Estadísticas globales de reportes
 */
export interface IReportStatsResponse {
  // Contadores
  total_reports: number;
  reports_today: number;
  reports_this_week: number;
  reports_this_month: number;

  // Totales del período
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  total_quantity: number;

  // Promedios
  average_daily_sales: number;
  average_daily_orders: number;
  average_ticket: number;

  // Distribución por tipo de reporte
  reports_by_type: Array<{
    report_type: ReportTypeEnum;
    count: number;
    total_sales: number;
  }>;

  // Distribución por estado
  reports_by_status: Array<{
    status: ReportStatusEnum;
    count: number;
  }>;
}

/**
 * Resumen diario de reportes
 */
export interface IDailySummaryResponse {
  date: Date;
  stores_reported: number;
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  average_ticket: number;

  // Comparación con día anterior
  sales_vs_yesterday?: number;
  orders_vs_yesterday?: number;

  // Comparación con mismo día semana anterior
  sales_vs_last_week?: number;
  orders_vs_last_week?: number;
}

/**
 * Tendencias de reportes
 */
export interface IReportTrendsResponse {
  period: 'daily' | 'weekly' | 'monthly';
  data: Array<{
    date: Date;
    total_sales: number;
    total_revenue: number;
    orders_count: number;
    average_ticket: number;
  }>;

  // Tendencias calculadas
  sales_trend: 'up' | 'down' | 'stable';
  sales_trend_percentage: number;
  orders_trend: 'up' | 'down' | 'stable';
  orders_trend_percentage: number;
}
