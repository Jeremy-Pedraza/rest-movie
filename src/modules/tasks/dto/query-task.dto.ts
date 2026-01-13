/**
 * @fileoverview DTO para consultar/filtrar tareas programadas
 * @module modules/tasks/dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { JOB_STATUS, JobStatus } from '../tasks.constants';

/**
 * DTO para consultar y filtrar tareas programadas
 *
 * @example
 * GET /tasks?status=active&enabled=true&page=1&limit=10
 */
export class QueryTaskDto {
  // ============================================
  // PAGINACIÓN
  // ============================================

  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Registros por página',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(50, { message: 'El límite máximo es 50' })
  limit?: number = 10;

  // ============================================
  // FILTROS
  // ============================================

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: Object.values(JOB_STATUS),
    example: 'active',
  })
  @IsOptional()
  @IsString({ message: 'El estado debe ser texto' })
  @IsEnum(Object.values(JOB_STATUS), {
    message: `El estado debe ser uno de: ${Object.values(JOB_STATUS).join(', ')}`,
  })
  status?: JobStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por habilitado/deshabilitado',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'enabled debe ser booleano' })
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por nombre o descripción',
    example: 'cleanup',
  })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  search?: string;

  // ============================================
  // FILTROS DE FECHA
  // ============================================

  @ApiPropertyOptional({
    description: 'Última ejecución después de esta fecha (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'lastRunAfter debe ser una fecha válida ISO 8601' })
  lastRunAfter?: string;

  @ApiPropertyOptional({
    description: 'Última ejecución antes de esta fecha (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'lastRunBefore debe ser una fecha válida ISO 8601' })
  lastRunBefore?: string;

  // ============================================
  // ORDENAMIENTO
  // ============================================

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    enum: ['name', 'lastRun', 'nextRun', 'status', 'createdAt'],
    default: 'name',
  })
  @IsOptional()
  @IsString({ message: 'sortBy debe ser texto' })
  @IsEnum(['name', 'lastRun', 'nextRun', 'status', 'createdAt'], {
    message: 'sortBy debe ser: name, lastRun, nextRun, status o createdAt',
  })
  sortBy?: 'name' | 'lastRun' | 'nextRun' | 'status' | 'createdAt' = 'name';

  @ApiPropertyOptional({
    description: 'Orden de resultados',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'sortOrder debe ser ASC o DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

/**
 * DTO para consultar historial de ejecuciones de una tarea
 */
export class QueryTaskHistoryDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Registros por página',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de ejecución',
    enum: ['completed', 'failed', 'timeout', 'cancelled'],
    example: 'completed',
  })
  @IsOptional()
  @IsEnum(['completed', 'failed', 'timeout', 'cancelled'], {
    message: 'status debe ser: completed, failed, timeout o cancelled',
  })
  status?: 'completed' | 'failed' | 'timeout' | 'cancelled';

  @ApiPropertyOptional({
    description: 'Ejecuciones después de esta fecha (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'after debe ser una fecha válida ISO 8601' })
  after?: string;

  @ApiPropertyOptional({
    description: 'Ejecuciones antes de esta fecha (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'before debe ser una fecha válida ISO 8601' })
  before?: string;

  @ApiPropertyOptional({
    description: 'Solo ejecuciones manuales',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'manualOnly debe ser booleano' })
  manualOnly?: boolean;
}

/**
 * DTO para ejecutar una tarea manualmente
 */
export class RunTaskDto {
  @ApiPropertyOptional({
    description: 'Forzar ejecución aunque esté deshabilitada',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'force debe ser booleano' })
  force?: boolean = false;

  @ApiPropertyOptional({
    description: 'Ejecutar en modo dry-run (sin cambios reales)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'dryRun debe ser booleano' })
  dryRun?: boolean = false;

  @ApiPropertyOptional({
    description: 'Parámetros adicionales para la ejecución',
    example: { retentionDays: 7 },
    type: 'object',
  })
  @IsOptional()
  params?: Record<string, unknown>;
}
