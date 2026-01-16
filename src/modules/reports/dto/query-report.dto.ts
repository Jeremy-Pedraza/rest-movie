// src/modules/reports/dto/query-report.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsEnum, IsOptional, IsDateString, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '@shared/common';
import { ReportTypeEnum } from '../enums';
import { ReportStatusEnum } from './create-report.dto';

/**
 * DTO para consultar reportes con filtros
 *
 * @description
 * Extiende PaginationDto e incluye todos los filtros disponibles
 * para buscar y filtrar reportes.
 *
 * @example
 * ```typescript
 * const query: QueryReportDto = {
 *   store_id: 'uuid-store',
 *   date_from: '2025-01-01',
 *   date_to: '2025-01-31',
 *   report_type: 'daily',
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'report_date',
 *   sortOrder: 'DESC',
 * };
 * ```
 */
export class QueryReportDto extends PaginationDto {
  // ============================================
  // FILTROS POR ENTIDAD
  // ============================================

  @ApiPropertyOptional({
    description: 'Filtrar por ID de tienda',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'store_id debe ser un UUID válido' })
  @IsOptional()
  store_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por múltiples IDs de tiendas',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray({ message: 'store_ids debe ser un array' })
  @IsUUID('4', { each: true, message: 'Cada store_id debe ser un UUID válido' })
  @IsOptional()
  store_ids?: string[];

  @ApiPropertyOptional({
    description: 'Filtrar por ID de compañía (requiere join con stores)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsOptional()
  company_id?: string;

  // ============================================
  // FILTROS POR FECHA
  // ============================================

  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (formato YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString({}, { message: 'date_from debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsOptional()
  date_from?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (formato YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsDateString({}, { message: 'date_to debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsOptional()
  date_to?: string;

  @ApiPropertyOptional({
    description: 'Fecha exacta del reporte (formato YYYY-MM-DD)',
    example: '2025-01-16',
  })
  @IsDateString({}, { message: 'report_date debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsOptional()
  report_date?: string;

  // ============================================
  // FILTROS POR TIPO Y ESTADO
  // ============================================

  @ApiPropertyOptional({
    description: 'Tipo de reporte',
    enum: ReportTypeEnum,
    example: ReportTypeEnum.DAILY,
  })
  @IsEnum(ReportTypeEnum, {
    message: 'El tipo de reporte debe ser: daily, weekly o monthly',
  })
  @IsOptional()
  report_type?: ReportTypeEnum;

  @ApiPropertyOptional({
    description: 'Estado del reporte',
    enum: ReportStatusEnum,
    example: ReportStatusEnum.PUBLISHED,
  })
  @IsEnum(ReportStatusEnum, {
    message: 'El estado debe ser: draft, published o archived',
  })
  @IsOptional()
  status?: ReportStatusEnum;

  // ============================================
  // FILTROS POR MÉTRICAS
  // ============================================

  @ApiPropertyOptional({
    description: 'Ventas mínimas',
    example: 1000,
  })
  @Type(() => Number)
  @IsOptional()
  min_sales?: number;

  @ApiPropertyOptional({
    description: 'Ventas máximas',
    example: 50000,
  })
  @Type(() => Number)
  @IsOptional()
  max_sales?: number;

  @ApiPropertyOptional({
    description: 'Órdenes mínimas',
    example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  min_orders?: number;

  // ============================================
  // OPCIONES DE CARGA
  // ============================================

  @ApiPropertyOptional({
    description: 'Incluir datos de ventas por tipo de orden',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_sales_by_order_type debe ser booleano' })
  @IsOptional()
  include_sales_by_order_type?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir datos de métodos de pago',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_payment_methods debe ser booleano' })
  @IsOptional()
  include_payment_methods?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir datos de descuentos',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_discounts debe ser booleano' })
  @IsOptional()
  include_discounts?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir datos de ajustes',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_adjustments debe ser booleano' })
  @IsOptional()
  include_adjustments?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir detalle de órdenes efectivas',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_effective_orders debe ser booleano' })
  @IsOptional()
  include_effective_orders?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir información de la tienda',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_store debe ser booleano' })
  @IsOptional()
  include_store?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir todos los detalles relacionados',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_all debe ser booleano' })
  @IsOptional()
  include_all?: boolean;
}

/**
 * DTO para obtener reportes por rango de fechas
 *
 * @description
 * DTO específico para consultas de rango de fechas obligatorio.
 */
export class QueryReportByDateRangeDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de tienda',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'store_id debe ser un UUID válido' })
  @IsOptional()
  store_id?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (formato YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString({}, { message: 'date_from debe ser una fecha válida' })
  date_from: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (formato YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsDateString({}, { message: 'date_to debe ser una fecha válida' })
  date_to: string;

  @ApiPropertyOptional({
    description: 'Tipo de reporte',
    enum: ReportTypeEnum,
    default: ReportTypeEnum.DAILY,
  })
  @IsEnum(ReportTypeEnum)
  @IsOptional()
  report_type?: ReportTypeEnum;
}
