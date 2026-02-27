// src/modules/reports/dto/compare-reports.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { toBoolean } from '@shared/utils';
import { ReportTypeEnum, ConsolidationLevelEnum } from '../enums';

/**
 * Tipos de comparación disponibles
 */
export enum ComparisonTypeEnum {
  STORES = 'stores', // Comparar múltiples tiendas en el mismo período
  PERIODS = 'periods', // Comparar múltiples períodos de una tienda
  DAYS_OF_WEEK = 'days_of_week', // Comparar días de la semana
  YEAR_OVER_YEAR = 'year_over_year', // Comparar mismo período año anterior
  MONTH_OVER_MONTH = 'month_over_month', // Comparar mes a mes
}

/**
 * DTO para comparar reportes
 *
 * @description
 * Valida los campos para generar comparativas entre reportes.
 * Permite comparar tiendas, períodos, días de la semana, etc.
 *
 * @example
 * ```typescript
 * // Comparar 3 tiendas durante enero 2025
 * const dto: CompareReportsDto = {
 *   comparison_type: ComparisonTypeEnum.STORES,
 *   storeIds: ['uuid-1', 'uuid-2', 'uuid-3'],
 *   date_from: '2025-01-01',
 *   date_to: '2025-01-31',
 * };
 *
 * // Comparar enero 2025 vs enero 2024
 * const dto2: CompareReportsDto = {
 *   comparison_type: ComparisonTypeEnum.YEAR_OVER_YEAR,
 *   storeId: 'uuid-store',
 *   date_from: '2025-01-01',
 *   date_to: '2025-01-31',
 * };
 * ```
 */
export class CompareReportsDto {
  @ApiProperty({
    description: 'Tipo de comparación',
    enum: ComparisonTypeEnum,
    example: ComparisonTypeEnum.STORES,
  })
  @IsEnum(ComparisonTypeEnum, {
    message:
      'El tipo de comparación debe ser: stores, periods, days_of_week, year_over_year o month_over_month',
  })
  @IsNotEmpty({ message: 'El tipo de comparación es requerido' })
  comparison_type: ComparisonTypeEnum;

  // ============================================
  // PARA COMPARACIÓN DE TIENDAS
  // ============================================

  @ApiPropertyOptional({
    description: 'IDs de tiendas a comparar (para comparison_type = stores)',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray({ message: 'storeIds debe ser un array' })
  @ArrayMinSize(2, { message: 'Debe proporcionar al menos 2 tiendas para comparar' })
  @ArrayMaxSize(10, { message: 'Máximo 10 tiendas para comparar' })
  @IsUUID('4', { each: true, message: 'Cada storeId debe ser un UUID válido' })
  @IsOptional()
  storeIds?: string[];

  // ============================================
  // PARA COMPARACIÓN DE PERÍODOS
  // ============================================

  @ApiPropertyOptional({
    description: 'ID de tienda (para comparaciones temporales)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'storeId debe ser un UUID válido' })
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'ID de compañía (para comparar todas sus tiendas)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsOptional()
  company_id?: string;

  // ============================================
  // PERÍODO PRINCIPAL
  // ============================================

  @ApiProperty({
    description: 'Fecha de inicio del período principal (formato YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString({}, { message: 'date_from debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  date_from: string;

  @ApiProperty({
    description: 'Fecha de fin del período principal (formato YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsDateString({}, { message: 'date_to debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  date_to: string;

  // ============================================
  // PERÍODO DE COMPARACIÓN (para types temporales)
  // ============================================

  @ApiPropertyOptional({
    description: 'Fecha de inicio del período de comparación (formato YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'compare_date_from debe ser una fecha válida' })
  @IsOptional()
  compare_date_from?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del período de comparación (formato YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @IsDateString({}, { message: 'compare_date_to debe ser una fecha válida' })
  @IsOptional()
  compare_date_to?: string;

  // ============================================
  // OPCIONES DE COMPARACIÓN
  // ============================================

  @ApiPropertyOptional({
    description: 'Tipo de reportes a comparar',
    enum: ReportTypeEnum,
    default: ReportTypeEnum.DAILY,
    example: ReportTypeEnum.DAILY,
  })
  @IsEnum(ReportTypeEnum, {
    message: 'El tipo de reporte debe ser: daily, weekly o monthly',
  })
  @IsOptional()
  report_type?: ReportTypeEnum;

  @ApiPropertyOptional({
    description: 'Calcular diferencias absolutas',
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'calculate_differences debe ser booleano' })
  @IsOptional()
  calculate_differences?: boolean;

  @ApiPropertyOptional({
    description: 'Calcular diferencias porcentuales',
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'calculate_percentages debe ser booleano' })
  @IsOptional()
  calculate_percentages?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir desglose por tipo de orden en la comparación',
    default: false,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'include_order_type_comparison debe ser booleano' })
  @IsOptional()
  include_order_type_comparison?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir desglose por método de pago en la comparación',
    default: false,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'include_payment_method_comparison debe ser booleano' })
  @IsOptional()
  include_payment_method_comparison?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir gráficos y tendencias',
    default: true,
  })
  @Transform(toBoolean)
  @IsBoolean({ message: 'include_trends debe ser booleano' })
  @IsOptional()
  include_trends?: boolean;
}

/**
 * DTO para comparación rápida predefinida
 *
 * @description
 * DTO simplificado para comparaciones rápidas comunes.
 */
export class QuickCompareDto {
  @ApiProperty({
    description: 'Tipo de comparación rápida',
    enum: ['today_vs_yesterday', 'this_week_vs_last_week', 'this_month_vs_last_month', 'yoy'],
    example: 'this_week_vs_last_week',
  })
  @IsEnum(['today_vs_yesterday', 'this_week_vs_last_week', 'this_month_vs_last_month', 'yoy'], {
    message:
      'El tipo debe ser: today_vs_yesterday, this_week_vs_last_week, this_month_vs_last_month o yoy',
  })
  @IsNotEmpty({ message: 'El tipo de comparación es requerido' })
  quick_compare_type:
    | 'today_vs_yesterday'
    | 'this_week_vs_last_week'
    | 'this_month_vs_last_month'
    | 'yoy';

  @ApiPropertyOptional({
    description: 'ID de la tienda',
  })
  @IsUUID('4')
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'ID de la compañía',
  })
  @IsUUID('4')
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Nivel de consolidación',
    enum: ConsolidationLevelEnum,
    default: ConsolidationLevelEnum.STORE,
  })
  @IsEnum(ConsolidationLevelEnum)
  @IsOptional()
  consolidation_level?: ConsolidationLevelEnum;
}
