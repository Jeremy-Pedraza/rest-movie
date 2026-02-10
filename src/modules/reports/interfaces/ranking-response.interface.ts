// src/modules/reports/interfaces/ranking-response.interface.ts

import { RankingMetricEnum, RankingDirectionEnum } from '../dto';
import { ReportTypeEnum } from '../enums';

/**
 * Interfaces para rankings de reportes
 *
 * @description
 * Define las estructuras de respuesta para rankings
 * de tiendas y compañías por diferentes métricas.
 */

// ============================================
// INTERFACES BASE DE RANKING
// ============================================

/**
 * Cambio de posición en ranking
 */
export interface IPositionChange {
  previous_position: number | null; // null si no había posición anterior
  current_position: number;
  change: number; // Positivo = subió, Negativo = bajó
  direction: 'up' | 'down' | 'same' | 'new';
}

/**
 * Variación de valor
 */
export interface IValueVariation {
  current_value: number;
  previous_value: number | null;
  absolute_change: number;
  percentage_change: number;
  direction: 'up' | 'down' | 'same';
}

// ============================================
// RANKING DE TIENDAS
// ============================================

/**
 * Item del ranking de tiendas
 */
export interface IStoreRankingItem {
  // Posición
  position: number;
  position_change?: IPositionChange;

  // Datos de la tienda
  store_id: string;
  store_name: string;
  store_code: string;
  store_city?: string;

  // Datos de la compañía (opcional)
  company_id?: string;
  company_name?: string;

  // Valor de la métrica principal
  metric_value: number;
  metric_formatted?: string; // Valor formateado (ej: "$15,000.00")

  // Variación vs período anterior (opcional)
  variation?: IValueVariation;

  // Métricas secundarias
  secondary_metrics?: {
    total_sales?: number;
    total_revenue?: number;
    total_orders?: number;
    average_ticket?: number;
    total_quantity?: number;
  };

  // Porcentaje del total
  percentage_of_total: number;
}

/**
 * Respuesta de ranking de tiendas
 *
 * @description
 * Lista ordenada de tiendas según la métrica especificada.
 */
export interface IStoreRankingResponse {
  // Metadata del ranking
  metric: RankingMetricEnum;
  metric_label: string; // "Ventas Totales", "Órdenes", etc.
  direction: RankingDirectionEnum;
  direction_label: string; // "Top", "Bottom"

  // Período
  date_from: Date;
  date_to: Date;
  report_type: ReportTypeEnum;

  // Filtros aplicados
  filters: {
    company_id?: string;
    company_name?: string;
    only_active: boolean;
  };

  // Generación
  generated_at: Date;

  // Resultados
  items: IStoreRankingItem[];
  total_items: number;
  limit: number;

  // Totales del ranking
  totals: {
    sum: number; // Suma de todos los valores
    average: number; // Promedio
    median?: number; // Mediana
    min: number; // Mínimo
    max: number; // Máximo
  };

  // Stores no incluidas (sin datos en el período)
  excluded_stores_count: number;
}

/**
 * Respuesta de ranking rápido de tiendas
 *
 * @description
 * Versión simplificada para endpoints de ranking rápido.
 */
export interface IQuickStoreRankingResponse {
  period_label: string; // "Hoy", "Esta Semana", etc.
  metric_label: string;

  // Top 3 simplificado
  top_3: Array<{
    position: number;
    store_name: string;
    store_code: string;
    value: number;
    value_formatted: string;
  }>;

  // Estadísticas rápidas
  total_stores: number;
  total_value: number;
  average_value: number;
}

// ============================================
// RANKING DE COMPAÑÍAS
// ============================================

/**
 * Item del ranking de compañías
 */
export interface ICompanyRankingItem {
  // Posición
  position: number;
  position_change?: IPositionChange;

  // Datos de la compañía
  company_id: string;
  company_name: string;

  // Valor de la métrica principal
  metric_value: number;
  metric_formatted?: string;

  // Variación vs período anterior
  variation?: IValueVariation;

  // Métricas secundarias
  secondary_metrics?: {
    total_sales?: number;
    total_revenue?: number;
    total_orders?: number;
    average_ticket?: number;
    stores_count?: number;
  };

  // Porcentaje del total
  percentage_of_total: number;

  // Desglose por tiendas (opcional)
  stores_breakdown?: Array<{
    store_id: string;
    store_name: string;
    metric_value: number;
    percentage_of_company: number;
  }>;
}

/**
 * Respuesta de ranking de compañías
 *
 * @description
 * Lista ordenada de compañías según la métrica especificada.
 * Solo accesible para SUPER_ADMIN y ADMIN.
 */
export interface ICompanyRankingResponse {
  // Metadata del ranking
  metric: RankingMetricEnum;
  metric_label: string;
  direction: RankingDirectionEnum;
  direction_label: string;

  // Período
  date_from: Date;
  date_to: Date;

  // Generación
  generated_at: Date;

  // Resultados
  items: ICompanyRankingItem[];
  total_items: number;
  limit: number;

  // Totales del ranking
  totals: {
    sum: number;
    average: number;
    min: number;
    max: number;
    total_stores: number;
  };
}

// ============================================
// RANKINGS ESPECIALES
// ============================================

/**
 * Ranking de crecimiento
 *
 * @description
 * Tiendas con mayor/menor crecimiento vs período anterior.
 */
export interface IGrowthRankingItem {
  position: number;
  store_id: string;
  store_name: string;
  store_code: string;
  company_name?: string;

  // Valores actuales y anteriores
  current_value: number;
  previous_value: number;

  // Crecimiento
  growth_absolute: number;
  growth_percentage: number;
  growth_direction: 'up' | 'down';
}

export interface IGrowthRankingResponse {
  metric: RankingMetricEnum;
  current_period: {
    date_from: Date;
    date_to: Date;
  };
  previous_period: {
    date_from: Date;
    date_to: Date;
  };
  generated_at: Date;

  // Top crecimiento
  top_growth: IGrowthRankingItem[];

  // Mayor caída
  top_decline: IGrowthRankingItem[];

  // Estadísticas
  stats: {
    stores_with_growth: number;
    stores_with_decline: number;
    stores_stable: number;
    average_growth_percentage: number;
  };
}

/**
 * Ranking de consistencia
 *
 * @description
 * Tiendas con menor variabilidad en sus ventas (más consistentes).
 */
export interface IConsistencyRankingItem {
  position: number;
  store_id: string;
  store_name: string;
  store_code: string;

  // Métricas de consistencia
  average_daily_sales: number;
  standard_deviation: number;
  coefficient_of_variation: number; // std_dev / average
  consistency_score: number; // 0-100, mayor = más consistente

  // Extremos
  min_daily_sales: number;
  max_daily_sales: number;
  range: number;
}

export interface IConsistencyRankingResponse {
  date_from: Date;
  date_to: Date;
  days_analyzed: number;
  generated_at: Date;

  // Más consistentes
  most_consistent: IConsistencyRankingItem[];

  // Menos consistentes
  least_consistent: IConsistencyRankingItem[];

  // Estadísticas globales
  global_stats: {
    average_coefficient_of_variation: number;
    stores_analyzed: number;
  };
}

// ============================================
// RESPUESTA UNIFICADA DE RANKING
// ============================================

/**
 * Respuesta genérica de ranking
 */
export type IRankingResponse =
  | IStoreRankingResponse
  | ICompanyRankingResponse
  | IGrowthRankingResponse
  | IConsistencyRankingResponse;
