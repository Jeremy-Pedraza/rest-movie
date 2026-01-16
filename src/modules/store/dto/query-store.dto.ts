// src/modules/store/dto/query-store.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@shared/common';

/**
 * DTO para consultar/filtrar tiendas
 *
 * @description
 * Permite filtrar tiendas por múltiples criterios:
 * - Filtro por compañía
 * - Búsqueda por texto (nombre, código)
 * - Filtros por ciudad, zona, estado
 * - Paginación y ordenamiento
 *
 * @example
 * ```typescript
 * const query: QueryStoreDto = {
 *   company_id: 'uuid-company',
 *   search: 'centro',
 *   ciudad: 'Quito',
 *   activo: true,
 *   page: 1,
 *   limit: 10,
 *   sort_by: 'nombre',
 *   sort_order: 'ASC',
 * };
 * ```
 */
export class QueryStoreDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por compañía',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Buscar por nombre o código',
    example: 'centro',
  })
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ciudad',
    example: 'Quito',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsOptional()
  ciudad?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por zona',
    example: 'Norte',
  })
  @IsString({ message: 'La zona debe ser una cadena de texto' })
  @IsOptional()
  zona?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'activo debe ser un valor booleano' })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Ordenar por campo',
    enum: ['nombre', 'codigo', 'ciudad', 'created_at'],
    example: 'nombre',
  })
  @IsEnum(['nombre', 'codigo', 'ciudad', 'created_at'], {
    message: 'sort_by debe ser: nombre, codigo, ciudad o created_at',
  })
  @IsOptional()
  sort_by?: 'nombre' | 'codigo' | 'ciudad' | 'created_at';

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
