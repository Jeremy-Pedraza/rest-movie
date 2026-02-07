// src/modules/reports/dto/index.ts

/**
 * Barrel export para DTOs del módulo Reports
 *
 * @description
 * Exporta todos los DTOs, enums y clases de respuesta del módulo de reportes.
 *
 * DTOs de detalle (sub-entidades):
 * - CreateSalesByOrderTypeDto, SalesByOrderTypeResponseDto
 * - CreatePaymentMethodDto, PaymentMethodResponseDto
 * - CreateDynamicDiscountDto, DynamicDiscountResponseDto
 * - CreateAdjustmentDto, AdjustmentResponseDto
 * - CreateEffectiveOrderDto, EffectiveOrderResponseDto
 *
 * DTOs principales:
 * - CreateReportDto, UpdateReportDto, QueryReportDto
 *
 * DTOs especiales:
 * - ConsolidateReportsDto, QuickConsolidateDto
 * - CompareReportsDto, QuickCompareDto
 * - RankingStoresDto, QuickRankingDto, RankingCompaniesDto
 *
 * Enums:
 * - OrderTypeEnum, PaymentMethodTypeEnum, DiscountTypeEnum
 * - AdjustmentTypeEnum, OrderStatusEnum, ReportStatusEnum
 * - ComparisonTypeEnum, RankingMetricEnum, RankingDirectionEnum
 */

// ============================================
// DTOs DE DETALLE (SUB-ENTIDADES)
// ============================================

export {
  CreateSalesByOrderTypeDto,
  SalesByOrderTypeResponseDto,
  OrderTypeEnum,
} from './sales-by-order-type.dto';

export {
  CreatePaymentMethodDto,
  PaymentMethodResponseDto,
  PaymentMethodTypeEnum,
} from './payment-method.dto';

export {
  CreateDynamicDiscountDto,
  DynamicDiscountResponseDto,
  DiscountTypeEnum,
} from './dynamic-discount.dto';

export { CreateAdjustmentDto, AdjustmentResponseDto, AdjustmentTypeEnum } from './adjustment.dto';

export {
  CreateEffectiveOrderDto,
  EffectiveOrderResponseDto,
  OrderStatusEnum,
} from './effective-order.dto';

export { CreateShortageOverageDto, ShortageOverageResponseDto } from './shortage-overage.dto';

export { CreateCashSummaryDto, CashSummaryResponseDto } from './cash-summary.dto';

export { CreateEmployeeSalesDto, EmployeeSalesResponseDto } from './employee-sales.dto';

export { CreateCategorySalesDto, CategorySalesResponseDto } from './category-sales.dto';

export {
  CreateRevenueCenterSalesDto,
  RevenueCenterSalesResponseDto,
} from './revenue-center-sales.dto';

export { CreateServiceChargeDto, ServiceChargeResponseDto } from './service-charge.dto';

export { CreateIncomeByClassDto, IncomeByClassResponseDto } from './income-by-class.dto';

export {
  CreateIncomeByTenderTypeDto,
  IncomeByTenderTypeResponseDto,
} from './income-by-tender-type.dto';

// ============================================
// DTOs PRINCIPALES
// ============================================

export { CreateReportDto, ReportStatusEnum } from './create-report.dto';

export { UpdateReportDto } from './update-report.dto';

export { QueryReportDto, QueryReportByDateRangeDto } from './query-report.dto';

// ============================================
// DTOs ESPECIALES
// ============================================

export { ConsolidateReportsDto, QuickConsolidateDto } from './consolidate-reports.dto';

export { CompareReportsDto, QuickCompareDto, ComparisonTypeEnum } from './compare-reports.dto';

export {
  RankingStoresDto,
  QuickRankingDto,
  RankingCompaniesDto,
  RankingMetricEnum,
  RankingDirectionEnum,
} from './ranking-stores.dto';

export {
  QueryDailySummaryDto,
  EmployeeSummaryDto,
  DailySummaryResponseDto,
} from './daily-summary.dto';

export { QueryAnalyticsDto } from './query-analytics.dto';

// ============================================
// DTOs DE METADATA Y SYSTEM METRICS
// ============================================

export {
  SystemMetricsDto,
  CpuMetricsDto,
  MemoryMetricsDto,
  DiskMetricsDto,
  DatabaseMetricsDto,
  ReportMetadataDto,
} from './system-metrics.dto';
