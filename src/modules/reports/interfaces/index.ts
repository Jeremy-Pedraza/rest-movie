// src/modules/reports/interfaces/index.ts

/**
 * Barrel export para Interfaces del módulo Reports
 *
 * @description
 * Exporta todas las interfaces de respuesta del módulo de reportes.
 *
 * Interfaces de respuesta base:
 * - ISalesByOrderTypeResponse, IPaymentMethodResponse, etc.
 * - IReportResponse, IReportWithStoreResponse, IReportWithDetailsResponse
 * - IReportStatsResponse, IDailySummaryResponse, IReportTrendsResponse
 *
 * Interfaces de consolidación:
 * - IConsolidatedReportResponse
 * - IStoreConsolidatedResponse, ICompanyConsolidatedResponse
 * - IGlobalConsolidatedResponse
 *
 * Interfaces de comparación:
 * - IStoresComparisonResponse, IPeriodsComparisonResponse
 * - IYearOverYearComparisonResponse, IMonthOverMonthComparisonResponse
 * - IDaysOfWeekComparisonResponse
 *
 * Interfaces de ranking:
 * - IStoreRankingResponse, ICompanyRankingResponse
 * - IGrowthRankingResponse, IConsistencyRankingResponse
 */

// ============================================
// INTERFACES DE RESPUESTA BASE
// ============================================

export {
  // Respuestas de detalle (sub-entidades)
  ISalesByOrderTypeResponse,
  IPaymentMethodResponse,
  IDynamicDiscountResponse,
  IAdjustmentResponse,
  IEffectiveOrderResponse,
  // Respuestas principales de reporte
  IReportResponse,
  IReportWithStoreResponse,
  IReportWithDetailsResponse,
  IReportWithMetricsResponse,
  // Estadísticas y tendencias
  IReportStatsResponse,
  IDailySummaryResponse,
  IReportTrendsResponse,
} from './report-response.interface';

// ============================================
// INTERFACES DE CONSOLIDACIÓN
// ============================================

export {
  // Interfaces base de consolidación
  IConsolidatedTotals,
  IConsolidatedSalesByOrderType,
  IConsolidatedPaymentMethod,
  IStoreBreakdown,
  IDailyBreakdown,
  // Respuesta principal de consolidación
  IConsolidatedReportResponse,
  // Por nivel de consolidación
  IStoreConsolidatedResponse,
  ICompanyConsolidatedResponse,
  ICompanyBreakdown,
  IGlobalConsolidatedResponse,
  // Consolidación rápida
  IQuickConsolidatedResponse,
} from './consolidated-report.interface';

// ============================================
// INTERFACES DE COMPARACIÓN
// ============================================

export {
  // Interfaces base de comparación
  IValueDifference,
  IComparedMetrics,
  IMetricsWithDifferences,
  // Comparación de tiendas
  IStoreComparisonData,
  IStoresComparisonResponse,
  // Comparación de períodos
  IPeriodComparisonData,
  IPeriodsComparisonResponse,
  // Comparaciones temporales específicas
  IYearOverYearComparisonResponse,
  IMonthOverMonthComparisonResponse,
  // Comparación por días de la semana
  IDayOfWeekData,
  IDaysOfWeekComparisonResponse,
  // Tipos unificados
  IComparisonResponse,
  IQuickComparisonResponse,
} from './comparison-report.interface';

// ============================================
// INTERFACES DE RANKING
// ============================================

export {
  // Interfaces base de ranking
  IPositionChange,
  IValueVariation,
  // Ranking de tiendas
  IStoreRankingItem,
  IStoreRankingResponse,
  IQuickStoreRankingResponse,
  // Ranking de compañías
  ICompanyRankingItem,
  ICompanyRankingResponse,
  // Rankings especiales
  IGrowthRankingItem,
  IGrowthRankingResponse,
  IConsistencyRankingItem,
  IConsistencyRankingResponse,
  // Tipo unificado
  IRankingResponse,
} from './ranking-response.interface';
