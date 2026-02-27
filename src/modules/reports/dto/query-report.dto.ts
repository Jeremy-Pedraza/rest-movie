// src/modules/reports/dto/query-report.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '@shared/common';
import { toBoolean } from '@shared/utils';
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
 *   storeId: 'uuid-store',
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
  @IsUUID('4', { message: 'storeId debe ser un UUID válido' })
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por múltiples IDs de tiendas',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray({ message: 'storeIds debe ser un array' })
  @IsUUID('4', { each: true, message: 'Cada storeId debe ser un UUID válido' })
  @IsOptional()
  storeIds?: string[];

  @ApiPropertyOptional({
    description: 'Filtrar por ID de compañía (requiere join con stores)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsOptional()
  company_id?: string;

  // ============================================
  // FILTROS GEOGRÁFICOS
  // ============================================
  //
  // Permite filtrar reportes por ubicación geográfica.
  // Los filtros hacen JOIN con la tabla stores y companies.
  // ============================================

  @ApiPropertyOptional({
    description:
      'Filtrar por ciudad de la tienda. ' + 'Busca coincidencia exacta en stores.ciudad.',
    example: 'Santo Domingo',
  })
  @IsString({ message: 'city debe ser una cadena de texto' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar por región de la tienda. ' + 'Busca coincidencia exacta en stores.region.',
    example: 'Norte',
  })
  @IsString({ message: 'region debe ser una cadena de texto' })
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description:
      'Filtrar por código ISO del país (2 letras). ' +
      'Busca en companies.country_code a través de la relación store→company.',
    example: 'DO',
  })
  @IsString({ message: 'country_code debe ser una cadena de texto' })
  @MaxLength(2, { message: 'country_code debe tener máximo 2 caracteres' })
  @IsOptional()
  country_code?: string;

  // ============================================
  // FILTROS POR EMPLEADO
  // ============================================
  //
  // Permite filtrar reportes por empleado específico o por tipo:
  // - employee_id: Obtener reportes de un empleado específico
  // - consolidated: Filtrar por reportes consolidados (true) o individuales (false)
  //
  // NOTA: employee_id y consolidated son mutuamente excluyentes.
  // Si se usa employee_id, se ignora consolidated.
  // ============================================

  @ApiPropertyOptional({
    description:
      'Filtrar por ID de empleado específico (Simphony). ' +
      'Retorna solo los reportes de ese empleado.',
    example: 12345,
  })
  @Type(() => Number)
  @IsInt({ message: 'employee_id debe ser un número entero' })
  @IsOptional()
  employee_id?: number;

  @ApiPropertyOptional({
    description:
      'Filtrar por tipo de reporte según empleado:\n' +
      '- true = Solo reportes CONSOLIDADOS (employee_id IS NULL)\n' +
      '- false = Solo reportes INDIVIDUALES (employee_id IS NOT NULL)\n' +
      '- No enviar = Todos los reportes\n\n' +
      'NOTA: Se ignora si se especifica employee_id.',
    example: true,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'consolidated debe ser booleano' })
  @IsOptional()
  consolidated?: boolean;

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
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'include_sales_by_order_type debe ser booleano' })
  @IsOptional()
  include_sales_by_order_type?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir datos de métodos de pago',
    default: false,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'include_payment_methods debe ser booleano' })
  @IsOptional()
  include_payment_methods?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir datos de descuentos',
    default: false,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'include_discounts debe ser booleano' })
  @IsOptional()
  include_discounts?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir datos de ajustes',
    default: false,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'include_adjustments debe ser booleano' })
  @IsOptional()
  include_adjustments?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir detalle de órdenes efectivas',
    default: false,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'include_effective_orders debe ser booleano' })
  @IsOptional()
  include_effective_orders?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir información de la tienda',
    default: false,
  })
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'include_store debe ser booleano' })
  @IsOptional()
  include_store?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir todos los detalles relacionados',
    default: false,
  })
  @Transform(({ value }) => toBoolean(value))
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
  @IsUUID('4', { message: 'storeId debe ser un UUID válido' })
  @IsOptional()
  storeId?: string;

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
