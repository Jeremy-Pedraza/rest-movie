// src/modules/geography/dto/geography-response.dto.ts

/**
 * @fileoverview DTOs de respuesta para el módulo Geography
 * @module modules/geography
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuesta de País
 */
export class CountryResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'DO', description: 'Código ISO alpha-2' })
  code: string;

  @ApiPropertyOptional({ example: 'DOM', description: 'Código ISO alpha-3' })
  code_alpha3?: string;

  @ApiProperty({ example: 'República Dominicana' })
  name: string;

  @ApiPropertyOptional({ example: 'Dominican Republic' })
  name_en?: string;

  @ApiProperty({ example: 'America/Santo_Domingo' })
  timezone: string;

  @ApiProperty({ example: 'DOP', description: 'Código ISO moneda' })
  currency_code: string;

  @ApiProperty({ example: 'RD$' })
  currency_symbol: string;

  @ApiPropertyOptional({ example: '+1-809' })
  phone_code?: string;

  @ApiPropertyOptional({ example: 'ITBIS' })
  tax_name?: string;

  @ApiPropertyOptional({ example: 0.18 })
  tax_rate?: number;

  @ApiProperty({ example: true })
  is_active: boolean;
}

/**
 * Respuesta de Departamento
 */
export class DepartmentResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-country' })
  country_id: string;

  @ApiPropertyOptional({ example: 'DN' })
  code?: string;

  @ApiPropertyOptional({ example: 'DO-01' })
  iso_code?: string;

  @ApiProperty({ example: 'Distrito Nacional' })
  name: string;

  @ApiPropertyOptional({ example: 'provincia' })
  division_type?: string;

  @ApiProperty({ example: true })
  is_capital: boolean;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiPropertyOptional({
    description: 'País (solo si se solicita con include)',
    type: () => CountryResponseDto,
  })
  country?: CountryResponseDto;
}

/**
 * Respuesta de Ciudad
 */
export class CityResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'uuid-department' })
  department_id: string;

  @ApiProperty({ example: 'Santo Domingo' })
  name: string;

  @ApiPropertyOptional({ example: ['SD', 'Sto Domingo'] })
  aliases?: string[];

  @ApiProperty({ example: true })
  is_capital: boolean;

  @ApiProperty({ example: false })
  is_country_capital: boolean;

  @ApiPropertyOptional({ example: 965040 })
  population?: number;

  @ApiPropertyOptional({ example: '10101' })
  postal_code?: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiPropertyOptional({
    description: 'Departamento (solo si se solicita con include)',
    type: () => DepartmentResponseDto,
  })
  department?: DepartmentResponseDto;
}

/**
 * Respuesta de búsqueda con jerarquía completa
 */
export class GeographySearchResultDto {
  @ApiProperty({ example: 'uuid-city' })
  id: string;

  @ApiProperty({ example: 'city', enum: ['country', 'department', 'city'] })
  type: 'country' | 'department' | 'city';

  @ApiProperty({ example: 'Santo Domingo' })
  name: string;

  @ApiProperty({
    example: 'Santo Domingo, Distrito Nacional, República Dominicana',
    description: 'Nombre completo con jerarquía',
  })
  full_name: string;

  @ApiPropertyOptional({ example: 'DO' })
  country_code?: string;

  @ApiPropertyOptional({ example: 'República Dominicana' })
  country_name?: string;

  @ApiPropertyOptional({ example: 'Distrito Nacional' })
  department_name?: string;
}

/**
 * Respuesta paginada de países
 */
export class CountriesListResponseDto {
  @ApiProperty({ type: [CountryResponseDto] })
  data: CountryResponseDto[];

  @ApiProperty({ example: 20 })
  total: number;
}

/**
 * Respuesta paginada de departamentos
 */
export class DepartmentsListResponseDto {
  @ApiProperty({ type: [DepartmentResponseDto] })
  data: DepartmentResponseDto[];

  @ApiProperty({ example: 32 })
  total: number;
}

/**
 * Respuesta paginada de ciudades
 */
export class CitiesListResponseDto {
  @ApiProperty({ type: [CityResponseDto] })
  data: CityResponseDto[];

  @ApiProperty({ example: 150 })
  total: number;
}

/**
 * Respuesta de búsqueda
 */
export class GeographySearchResponseDto {
  @ApiProperty({ type: [GeographySearchResultDto] })
  data: GeographySearchResultDto[];

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 'santo' })
  query: string;
}
