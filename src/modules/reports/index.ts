// src/modules/reports/index.ts

/**
 * Barrel export para el módulo Reports
 *
 * @description
 * Exporta todos los componentes públicos del módulo Reports
 * para facilitar las importaciones en otros módulos.
 *
 * @example
 * ```typescript
 * import { ReportsModule, ReportsService, CreateReportDto } from '@modules/reports';
 * ```
 *
 * Componentes exportados:
 * - Entities: ReportHeaderEntity, SalesByOrderTypeEntity, etc.
 * - DTOs: CreateReportDto, QueryReportDto, ConsolidateReportsDto, etc.
 * - Interfaces: IReportResponse, IConsolidatedReportResponse, etc.
 * - Enums: ReportTypeEnum, ReportStatusEnum, ConsolidationLevelEnum
 * - Guards: StoreAccessGuard, CompanyAccessGuard
 * - Repository: ReportsRepository
 * - Service: ReportsService
 * - Controller: ReportsController
 * - Module: ReportsModule
 */

// Entities
export * from './entities';

// Enums
export * from './enums';

// DTOs
export * from './dto';

// Interfaces
export * from './interfaces';

// Guards
export { ReportAccessGuard } from '@guards/report-access.guard';

// Repository
export * from './reports.repository';

// Service
export * from './reports.service';

// Controller
export * from './reports.controller';

// Module
export * from './reports.module';
