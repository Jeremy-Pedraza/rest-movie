// src/modules/reports/dto/ranking-stores.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ReportTypeEnum } from '../enums';

/**
 * Métricas disponibles para ranking
 */
export enum RankingMetricEnum {
  TOTAL_SALES = 'total_sales',
  TOTAL_REVENUE = 'total_revenue',
  ORDERS_COUNT = 'orders_count',
  AVERAGE_TICKET = 'average_ticket',
  TOTAL_QUANTITY = 'total_quantity',
  GROWTH_RATE = 'growth_rate', // % crecimiento vs período anterior
}

/**
 * Dirección del ranking
 */
export enum RankingDirectionEnum {
  TOP = 'top', // Mejores (descendente)
  BOTTOM = 'bottom', // Peores (ascendente)
}

/**
 * DTO para obtener ranking de tiendas
 *
 * @description
 * Valida los campos para generar rankings de tiendas por diferentes métricas.
 * Permite filtrar por compañía, período y ordenar por diferentes criterios.
 *
 * @example
 * ```typescript
 * // Top 10 tiendas por ventas en enero 2025
 * const dto: RankingStoresDto = {
 *   metric: RankingMetricEnum.TOTAL_SALES,
 *   direction: RankingDirectionEnum.TOP,
 *   limit: 10,
 *   date_from: '2025-01-01',
 *   date_to: '2025-01-31',
 * };
 *
 * // Bottom 5 tiendas por órdenes de una compañía
 * const dto2: RankingStoresDto = {
 *   metric: RankingMetricEnum.ORDERS_COUNT,
 *   direction: RankingDirectionEnum.BOTTOM,
 *   limit: 5,
 *   company_id: 'uuid-company',
 *   date_from: '2025-01-01',
 *   date_to: '2025-01-31',
 * };
 * ```
 */
export class RankingStoresDto {
  @ApiProperty({
    description: 'Métrica para el ranking',
    enum: RankingMetricEnum,
    example: RankingMetricEnum.TOTAL_SALES,
  })
  @IsEnum(RankingMetricEnum, {
    message:
      'La métrica debe ser: total_sales, total_revenue, orders_count, average_ticket, total_quantity o growth_rate',
  })
  @IsNotEmpty({ message: 'La métrica es requerida' })
  metric: RankingMetricEnum;

  @ApiPropertyOptional({
    description: 'Dirección del ranking',
    enum: RankingDirectionEnum,
    default: RankingDirectionEnum.TOP,
    example: RankingDirectionEnum.TOP,
  })
  @IsEnum(RankingDirectionEnum, {
    message: 'La dirección debe ser: top o bottom',
  })
  @IsOptional()
  direction?: RankingDirectionEnum;

  @ApiPropertyOptional({
    description: 'Cantidad de tiendas a mostrar en el ranking',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'limit debe ser un número' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(100, { message: 'limit no puede ser mayor a 100' })
  @IsOptional()
  limit?: number;

  // ============================================
  // FILTROS
  // ============================================

  @ApiPropertyOptional({
    description: 'Filtrar por compañía (solo tiendas de esta compañía)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsOptional()
  company_id?: string;

  @ApiProperty({
    description: 'Fecha de inicio del período (formato YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString({}, { message: 'date_from debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  date_from: string;

  @ApiProperty({
    description: 'Fecha de fin del período (formato YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsDateString({}, { message: 'date_to debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  date_to: string;

  @ApiPropertyOptional({
    description: 'Tipo de reportes a considerar',
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
    description: 'Solo incluir tiendas activas',
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'only_active debe ser booleano' })
  @IsOptional()
  only_active?: boolean;

  // ============================================
  // OPCIONES DE RESULTADO
  // ============================================

  @ApiPropertyOptional({
    description: 'Incluir datos de la tienda (nombre, código, etc.)',
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_store_info debe ser booleano' })
  @IsOptional()
  include_store_info?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir datos de la compañía',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_company_info debe ser booleano' })
  @IsOptional()
  include_company_info?: boolean;

  @ApiPropertyOptional({
    description: 'Calcular variación vs período anterior',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'calculate_variation debe ser booleano' })
  @IsOptional()
  calculate_variation?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir posición anterior en el ranking',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_previous_position debe ser booleano' })
  @IsOptional()
  include_previous_position?: boolean;
}

/**
 * DTO para ranking rápido predefinido
 *
 * @description
 * DTO simplificado para rankings rápidos comunes.
 */
export class QuickRankingDto {
  @ApiProperty({
    description: 'Período predefinido',
    enum: ['today', 'yesterday', 'this_week', 'this_month', 'this_year'],
    example: 'this_month',
  })
  @IsEnum(['today', 'yesterday', 'this_week', 'this_month', 'this_year'], {
    message: 'El período debe ser: today, yesterday, this_week, this_month o this_year',
  })
  @IsNotEmpty({ message: 'El período es requerido' })
  period: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year';

  @ApiPropertyOptional({
    description: 'Métrica para el ranking',
    enum: RankingMetricEnum,
    default: RankingMetricEnum.TOTAL_SALES,
  })
  @IsEnum(RankingMetricEnum)
  @IsOptional()
  metric?: RankingMetricEnum;

  @ApiPropertyOptional({
    description: 'Filtrar por compañía',
  })
  @IsUUID('4')
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Cantidad de tiendas',
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;
}

/**
 * DTO para ranking de compañías
 *
 * @description
 * Valida los campos para generar rankings de compañías.
 * Solo accesible para SUPER_ADMIN y ADMIN.
 */
export class RankingCompaniesDto {
  @ApiProperty({
    description: 'Métrica para el ranking',
    enum: RankingMetricEnum,
    example: RankingMetricEnum.TOTAL_SALES,
  })
  @IsEnum(RankingMetricEnum)
  @IsNotEmpty()
  metric: RankingMetricEnum;

  @ApiPropertyOptional({
    description: 'Dirección del ranking',
    enum: RankingDirectionEnum,
    default: RankingDirectionEnum.TOP,
  })
  @IsEnum(RankingDirectionEnum)
  @IsOptional()
  direction?: RankingDirectionEnum;

  @ApiPropertyOptional({
    description: 'Cantidad de compañías',
    default: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Fecha de inicio',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  date_from: string;

  @ApiProperty({
    description: 'Fecha de fin',
    example: '2025-01-31',
  })
  @IsDateString()
  @IsNotEmpty()
  date_to: string;

  @ApiPropertyOptional({
    description: 'Incluir desglose por tiendas',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  include_stores_breakdown?: boolean;
}
