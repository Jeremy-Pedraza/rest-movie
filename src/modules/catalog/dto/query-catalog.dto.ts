// src/modules/catalog/dto/query-catalog.dto.ts

import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PaginationDto } from '@shared/common';

export class QueryCatalogDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Buscar por titulo o serial (ILIKE)',
    example: 'inception',
  })
  @IsOptional()
  @IsString({ message: 'El campo de busqueda debe ser texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por genero',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'genreId debe ser un UUID valido' })
  genreId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo (pelicula, serie, etc.)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'typeId debe ser un UUID valido' })
  typeId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por director',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID('4', { message: 'directorId debe ser un UUID valido' })
  directorId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por productora',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsOptional()
  @IsUUID('4', { message: 'producerId debe ser un UUID valido' })
  producerId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ano de lanzamiento',
    example: 2010,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'releaseYear debe ser un numero entero' })
  @Min(1888, { message: 'releaseYear debe ser mayor o igual a 1888' })
  @Max(2100, { message: 'releaseYear debe ser menor o igual a 2100' })
  releaseYear?: number;
}
