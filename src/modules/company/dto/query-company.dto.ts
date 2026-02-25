// src/modules/company/dto/query-company.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsEnum, IsOptional, Length, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '@shared/common';
import { VALID_COUNTRY_CODES, VALID_CURRENCY_CODES, VALID_TIMEZONES } from './create-company.dto';

/**
 * DTO para consultar/filtrar compañías
 *
 * @description
 * Permite filtrar compañías por múltiples criterios:
 * - Búsqueda por texto (nombre, email, RUC)
 * - Filtros por país, ciudad, estado, plan
 * - Filtros de internacionalización (country_code, currency_code, timezone)
 * - Paginación y ordenamiento
 *
 * @example
 * ```typescript
 * const query: QueryCompanyDto = {
 *   search: 'taco bell',
 *   country_code: 'DO',
 *   currency_code: 'DOP',
 *   is_active: true,
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'name',
 *   sortOrder: 'ASC',
 * };
 * ```
 */
export class QueryCompanyDto extends PaginationDto {
  // ============================================
  // BÚSQUEDA GENERAL
  // ============================================

  @ApiPropertyOptional({
    description: 'Buscar por nombre, email o RUC',
    example: 'taco bell',
  })
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsOptional()
  search?: string;

  // ============================================
  // FILTROS DE UBICACIÓN
  // ============================================

  @ApiPropertyOptional({
    description: 'Filtrar por país',
    example: 'República Dominicana',
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsOptional()
  pais?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ciudad',
    example: 'Santo Domingo',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsOptional()
  ciudad?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por departamento/estado/provincia',
    example: 'Distrito Nacional',
  })
  @IsString({ message: 'El departamento debe ser una cadena de texto' })
  @IsOptional()
  departamento?: string;

  // ============================================
  // FILTROS DE INTERNACIONALIZACIÓN (FASE 1)
  // ============================================

  @ApiPropertyOptional({
    description: 'Filtrar por código de país ISO 3166-1 alpha-2',
    example: 'DO',
    enum: VALID_COUNTRY_CODES,
  })
  @IsString({ message: 'country_code debe ser una cadena de texto' })
  @IsOptional()
  @Length(2, 2, { message: 'country_code debe tener exactamente 2 caracteres' })
  @IsIn(VALID_COUNTRY_CODES, {
    message: `country_code debe ser uno de: ${VALID_COUNTRY_CODES.join(', ')}`,
  })
  country_code?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por código de moneda ISO 4217',
    example: 'DOP',
    enum: VALID_CURRENCY_CODES,
  })
  @IsString({ message: 'currency_code debe ser una cadena de texto' })
  @IsOptional()
  @Length(3, 3, { message: 'currency_code debe tener exactamente 3 caracteres' })
  @IsIn(VALID_CURRENCY_CODES, {
    message: `currency_code debe ser uno de: ${VALID_CURRENCY_CODES.join(', ')}`,
  })
  currency_code?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por zona horaria IANA',
    example: 'America/Santo_Domingo',
    enum: VALID_TIMEZONES,
  })
  @IsString({ message: 'timezone debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_TIMEZONES, {
    message: `timezone debe ser uno de: ${VALID_TIMEZONES.join(', ')}`,
  })
  timezone?: string;

  // ============================================
  // FILTROS DE CONFIGURACIÓN
  // ============================================

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

  // ============================================
  // ORDENAMIENTO
  // ============================================

  @ApiPropertyOptional({
    description: 'Alias legacy de sortBy (deprecado)',
    enum: ['name', 'created_at', 'pais', 'ciudad', 'country_code', 'currency_code'],
    example: 'name',
    deprecated: true,
  })
  @IsEnum(['name', 'created_at', 'pais', 'ciudad', 'country_code', 'currency_code'], {
    message: 'sort_by debe ser: name, created_at, pais, ciudad, country_code o currency_code',
  })
  @IsOptional()
  sort_by?: 'name' | 'created_at' | 'pais' | 'ciudad' | 'country_code' | 'currency_code';

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
  sort_order?: 'ASC' | 'DESC';
}

