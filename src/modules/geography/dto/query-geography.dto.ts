// src/modules/geography/dto/query-geography.dto.ts

/**
 * @fileoverview DTOs para consultas del módulo Geography
 * @module modules/geography
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { toBoolean } from '@shared/utils';

/**
 * DTO para consultar países
 */
export class QueryCountriesDto {
  @ApiPropertyOptional({
    description: 'Filtrar solo países activos',
    default: true,
  })
  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  is_active?: boolean = true;

  @ApiPropertyOptional({
    description: 'Buscar por nombre (parcial)',
    example: 'domin',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

/**
 * DTO para consultar departamentos
 */
export class QueryDepartmentsDto {
  @ApiPropertyOptional({
    description: 'Código ISO del país (2 letras)',
    example: 'DO',
    maxLength: 2,
  })
  @IsString()
  @MaxLength(2)
  @IsOptional()
  country_code?: string;

  @ApiPropertyOptional({
    description: 'ID del país (UUID)',
  })
  @IsUUID('4')
  @IsOptional()
  country_id?: string;

  @ApiPropertyOptional({
    description: 'Filtrar solo departamentos activos',
    default: true,
  })
  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  is_active?: boolean = true;

  @ApiPropertyOptional({
    description: 'Buscar por nombre (parcial)',
    example: 'santo',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

/**
 * DTO para consultar ciudades
 */
export class QueryCitiesDto {
  @ApiPropertyOptional({
    description: 'ID del departamento (UUID)',
  })
  @IsUUID('4')
  @IsOptional()
  department_id?: string;

  @ApiPropertyOptional({
    description: 'Código ISO del país (2 letras)',
    example: 'DO',
    maxLength: 2,
  })
  @IsString()
  @MaxLength(2)
  @IsOptional()
  country_code?: string;

  @ApiPropertyOptional({
    description: 'Filtrar solo ciudades activas',
    default: true,
  })
  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  is_active?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filtrar solo capitales',
  })
  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  is_capital?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por nombre (parcial)',
    example: 'santo',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Límite de resultados',
    default: 50,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  limit?: number = 50;
}

/**
 * DTO para búsqueda global de ubicaciones (autocomplete)
 */
export class SearchGeographyDto {
  @ApiProperty({
    description: 'Texto a buscar (mínimo 2 caracteres)',
    example: 'santo',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'La búsqueda debe tener al menos 2 caracteres' })
  q: string;

  @ApiPropertyOptional({
    description: 'Código ISO del país para filtrar (2 letras)',
    example: 'DO',
    maxLength: 2,
  })
  @IsString()
  @MaxLength(2)
  @IsOptional()
  country_code?: string;

  @ApiPropertyOptional({
    description: 'Límite de resultados',
    default: 20,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  limit?: number = 20;
}
