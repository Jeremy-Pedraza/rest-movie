// src/modules/reports/dto/consolidate-reports.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ReportTypeEnum, ConsolidationLevelEnum, ReportScopeEnum } from '../enums';

/**
 * DTO para consolidar reportes
 *
 * @description
 * Valida los campos para generar un reporte consolidado.
 * Permite consolidar a nivel de tienda, compañía o todas las compañías.
 *
 * Permisos por rol:
 * - SUPER_ADMIN/ADMIN: Puede consolidar a todos los niveles
 * - MANAGER: Solo puede consolidar su compañía y sus tiendas
 * - USER: Solo puede consolidar sus tiendas asignadas (nivel STORE)
 *
 * @example
 * ```typescript
 * // Consolidar todas las tiendas de una compañía en enero 2025
 * const dto: ConsolidateReportsDto = {
 *   consolidation_level: ConsolidationLevelEnum.COMPANY,
 *   company_id: 'uuid-company',
 *   date_from: '2025-01-01',
 *   date_to: '2025-01-31',
 *   report_type: ReportTypeEnum.DAILY,
 * };
 * ```
 */
export class ConsolidateReportsDto {
  @ApiProperty({
    description: 'Nivel de consolidación',
    enum: ConsolidationLevelEnum,
    example: ConsolidationLevelEnum.COMPANY,
  })
  @IsEnum(ConsolidationLevelEnum, {
    message: 'El nivel de consolidación debe ser: store, company o all_companies',
  })
  @IsNotEmpty({ message: 'El nivel de consolidación es requerido' })
  consolidation_level: ConsolidationLevelEnum;

  // ============================================
  // FILTROS POR ENTIDAD (según nivel)
  // ============================================

  @ApiPropertyOptional({
    description: 'ID de la compañía (requerido para nivel COMPANY)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({
    description: 'ID de la tienda (requerido para nivel STORE)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'store_id debe ser un UUID válido' })
  @IsOptional()
  store_id?: string;

  @ApiPropertyOptional({
    description: 'IDs de tiendas específicas a consolidar',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray({ message: 'store_ids debe ser un array' })
  @IsUUID('4', { each: true, message: 'Cada store_id debe ser un UUID válido' })
  @IsOptional()
  store_ids?: string[];

  // ============================================
  // RANGO DE FECHAS
  // ============================================

  @ApiProperty({
    description: 'Fecha de inicio del rango a consolidar (formato YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsDateString({}, { message: 'date_from debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  date_from: string;

  @ApiProperty({
    description: 'Fecha de fin del rango a consolidar (formato YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @IsDateString({}, { message: 'date_to debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  date_to: string;

  // ============================================
  // OPCIONES DE CONSOLIDACIÓN
  // ============================================

  @ApiPropertyOptional({
    description: 'Tipo de reportes a consolidar',
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
    description: 'Incluir desglose por tiendas en el consolidado',
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_store_breakdown debe ser booleano' })
  @IsOptional()
  include_store_breakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir desglose por días en el consolidado',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_daily_breakdown debe ser booleano' })
  @IsOptional()
  include_daily_breakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir desglose por tipo de orden',
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_order_type_breakdown debe ser booleano' })
  @IsOptional()
  include_order_type_breakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir desglose por método de pago',
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'include_payment_method_breakdown debe ser booleano' })
  @IsOptional()
  include_payment_method_breakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Calcular porcentajes y variaciones',
    default: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'calculate_percentages debe ser booleano' })
  @IsOptional()
  calculate_percentages?: boolean;

  // ============================================
  // FILTRO DE ALCANCE (EVITAR DOBLE CONTEO)
  // ============================================

  @ApiPropertyOptional({
    description:
      'Alcance de reportes a incluir en la consolidación. ' +
      'Usar para evitar doble conteo cuando existen reportes individuales (por empleado) ' +
      'y consolidados (sin empleado) para el mismo día/tienda.\n\n' +
      '- `individual`: Solo reportes por empleado (employee_id IS NOT NULL)\n' +
      '- `consolidated`: Solo reportes consolidados (employee_id IS NULL)\n' +
      '- `all`: Todos los reportes (⚠️ puede causar doble conteo)',
    enum: ReportScopeEnum,
    default: ReportScopeEnum.INDIVIDUAL,
    example: ReportScopeEnum.INDIVIDUAL,
  })
  @IsEnum(ReportScopeEnum, {
    message: 'report_scope debe ser: individual, consolidated o all',
  })
  @IsOptional()
  report_scope?: ReportScopeEnum;
}

/**
 * DTO para consolidación rápida por período predefinido
 *
 * @description
 * DTO simplificado para consolidaciones rápidas (hoy, ayer, esta semana, este mes).
 */
export class QuickConsolidateDto {
  @ApiProperty({
    description: 'Período predefinido',
    enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'],
    example: 'this_week',
  })
  @IsEnum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'], {
    message: 'El período debe ser: today, yesterday, this_week, last_week, this_month o last_month',
  })
  @IsNotEmpty({ message: 'El período es requerido' })
  period: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month';

  @ApiProperty({
    description: 'Nivel de consolidación',
    enum: ConsolidationLevelEnum,
    example: ConsolidationLevelEnum.COMPANY,
  })
  @IsEnum(ConsolidationLevelEnum)
  @IsNotEmpty()
  consolidation_level: ConsolidationLevelEnum;

  @ApiPropertyOptional({
    description: 'ID de la compañía (para nivel COMPANY)',
  })
  @IsUUID('4')
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({
    description: 'ID de la tienda (para nivel STORE)',
  })
  @IsUUID('4')
  @IsOptional()
  store_id?: string;

  @ApiPropertyOptional({
    description: 'Alcance de reportes a incluir. Default: individual (evita doble conteo)',
    enum: ReportScopeEnum,
    default: ReportScopeEnum.INDIVIDUAL,
  })
  @IsEnum(ReportScopeEnum)
  @IsOptional()
  report_scope?: ReportScopeEnum;
}
