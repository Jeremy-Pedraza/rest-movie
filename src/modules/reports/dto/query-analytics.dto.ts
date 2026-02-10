// src/modules/reports/dto/query-analytics.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para endpoints de consulta analítica v1.1.0
 *
 * @description
 * Filtros de fecha obligatorios para consultas de análisis
 * por tienda o compañía: categorías, empleados, revenue centers,
 * payment analysis, etc.
 *
 * @example
 * ```
 * GET /reports/store/:id/categories?date_from=2026-01-01&date_to=2026-01-31
 * GET /reports/store/:id/categories?date_from=2026-01-01&date_to=2026-01-31&limit=5
 * ```
 */
export class QueryAnalyticsDto {
  @ApiProperty({
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsDateString({}, { message: 'date_from debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'date_from es requerido' })
  date_from: string;

  @ApiProperty({
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @IsDateString({}, { message: 'date_to debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'date_to es requerido' })
  date_to: string;

  @ApiPropertyOptional({
    description: 'Límite de resultados (default: 10, max: 50)',
    example: 10,
    default: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit mínimo es 1' })
  @Max(50, { message: 'limit máximo es 50' })
  @IsOptional()
  limit?: number;
}
