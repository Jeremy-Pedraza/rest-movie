// src/modules/store/dto/query-store.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsUUID, IsEnum, IsOptional, IsIn, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto, SortOrder } from '@shared/common';
import { VALID_LOCATION_TYPES, VALID_STORE_FORMATS, VALID_SALES_TIERS } from './create-store.dto';

/**
 * DTO para consultar/filtrar tiendas
 *
 * @description
 * Permite filtrar tiendas por múltiples criterios:
 * - Filtro por compañía
 * - Búsqueda por texto (nombre, código)
 * - Filtros por ciudad, zona, estado
 * - Filtros de segmentación (region, location_type, store_format, sales_tier)
 * - Filtros por servicios (has_drive_thru, has_delivery)
 * - Filtros por tags
 * - Paginación y ordenamiento
 *
 * @version 2.0.0 - Agregados filtros de segmentación (FASE 2)
 *
 * @example
 * ```typescript
 * const query: QueryStoreDto = {
 *   company_id: 'uuid-company',
 *   region: 'Metropolitana',
 *   location_type: 'mall',
 *   store_format: 'regular',
 *   sales_tier: 'A',
 *   has_drive_thru: true,
 *   activo: true,
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'nombre',
 *   sortOrder: 'ASC',
 * };
 * ```
 */
export class QueryStoreDto extends PaginationDto {
  // ============================================
  // FILTROS BÁSICOS
  // ============================================

  @ApiPropertyOptional({
    description: 'Filtrar por compañía',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsOptional()
  company_id?: string;

  @ApiPropertyOptional({
    description: 'Buscar por nombre o código',
    example: 'agora',
  })
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ciudad',
    example: 'Santo Domingo',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsOptional()
  ciudad?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por zona',
    example: 'Piantini',
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

  // ============================================
  // FILTROS DE SEGMENTACIÓN (FASE 2)
  // ============================================

  @ApiPropertyOptional({
    description: 'Filtrar por región geográfica',
    example: 'Metropolitana',
  })
  @IsString({ message: 'region debe ser una cadena de texto' })
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de ubicación',
    example: 'mall',
    enum: VALID_LOCATION_TYPES,
  })
  @IsString({ message: 'location_type debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_LOCATION_TYPES, {
    message: `location_type debe ser uno de: ${VALID_LOCATION_TYPES.join(', ')}`,
  })
  location_type?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por formato de tienda',
    example: 'regular',
    enum: VALID_STORE_FORMATS,
  })
  @IsString({ message: 'store_format debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_STORE_FORMATS, {
    message: `store_format debe ser uno de: ${VALID_STORE_FORMATS.join(', ')}`,
  })
  store_format?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por clasificación de ventas',
    example: 'A',
    enum: VALID_SALES_TIERS,
  })
  @IsString({ message: 'sales_tier debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_SALES_TIERS, {
    message: `sales_tier debe ser uno de: ${VALID_SALES_TIERS.join(', ')}`,
  })
  sales_tier?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por servicio drive-thru',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'has_drive_thru debe ser un valor booleano' })
  @IsOptional()
  has_drive_thru?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por servicio de delivery',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'has_delivery debe ser un valor booleano' })
  @IsOptional()
  has_delivery?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por tags (cualquiera que coincida)',
    example: ['nuevo', 'wifi'],
    type: [String],
  })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray({ message: 'tags debe ser un array' })
  @IsString({ each: true, message: 'Cada tag debe ser una cadena de texto' })
  @IsOptional()
  tags?: string[];

  // ============================================
  // ORDENAMIENTO
  // ============================================

  @ApiPropertyOptional({
    description: 'Alias legacy de sortBy (deprecado)',
    enum: [
      'nombre',
      'codigo',
      'ciudad',
      'region',
      'location_type',
      'store_format',
      'sales_tier',
      'created_at',
    ],
    example: 'nombre',
    deprecated: true,
  })
  @IsEnum(
    [
      'nombre',
      'codigo',
      'ciudad',
      'region',
      'location_type',
      'store_format',
      'sales_tier',
      'created_at',
    ],
    {
      message:
        'sort_by debe ser: nombre, codigo, ciudad, region, location_type, store_format, sales_tier o created_at',
    },
  )
  @IsOptional()
  sort_by?:
    | 'nombre'
    | 'codigo'
    | 'ciudad'
    | 'region'
    | 'location_type'
    | 'store_format'
    | 'sales_tier'
    | 'created_at' = undefined;

  @ApiPropertyOptional({
    description: 'Alias legacy de sortOrder (deprecado)',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
    deprecated: true,
  })
  @IsEnum(['ASC', 'DESC'], {
    message: 'sort_order debe ser ASC o DESC',
  })
  @IsOptional()
  sort_order?: SortOrder = undefined;
}
