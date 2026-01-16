// src/modules/company/dto/query-company.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@shared/common';

/**
 * DTO para consultar/filtrar compañías
 *
 * @description
 * Permite filtrar compañías por múltiples criterios:
 * - Búsqueda por texto (nombre, email, RUC)
 * - Filtros por país, ciudad, estado, plan
 * - Paginación y ordenamiento
 *
 * @example
 * ```typescript
 * const query: QueryCompanyDto = {
 *   search: 'restaurante',
 *   pais: 'Ecuador',
 *   is_active: true,
 *   page: 1,
 *   limit: 10,
 *   sort_by: 'name',
 *   sort_order: 'ASC',
 * };
 * ```
 */
export class QueryCompanyDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Buscar por nombre, email o RUC',
    example: 'restaurante',
  })
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por país',
    example: 'Ecuador',
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  pais?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ciudad',
    example: 'Quito',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsOptional()
  ciudad?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por plan',
    example: 'premium',
  })
  @IsString({ message: 'El plan debe ser una cadena de texto' })
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({
    description: 'Ordenar por campo',
    enum: ['name', 'created_at', 'pais', 'ciudad'],
    example: 'name',
  })
  @IsEnum(['name', 'created_at', 'pais', 'ciudad'], {
    message: 'sort_by debe ser: name, created_at, pais o ciudad',
  })
  @IsOptional()
  sort_by?: 'name' | 'created_at' | 'pais' | 'ciudad';

  @ApiPropertyOptional({
    description: 'Dirección de ordenamiento',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @IsEnum(['ASC', 'DESC'], {
    message: 'sort_order debe ser ASC o DESC',
  })
  @IsOptional()
  sort_order?: 'ASC' | 'DESC';
}
