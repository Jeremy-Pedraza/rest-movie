// src/modules/cache/dto/cache-admin.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

/**
 * Módulos válidos para flush
 */
export enum CacheModuleName {
  USER = 'user',
  AUTH = 'auth',
  PRODUCT = 'product',
  STATS = 'stats',
}

/**
 * DTO para invalidar múltiples tags
 */
export class InvalidateTagsDto {
  @ApiProperty({
    description: 'Lista de tags a invalidar',
    example: ['users', 'user-stats', 'products'],
    type: [String],
  })
  @IsArray({ message: 'tags debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un tag' })
  @ArrayMaxSize(50, { message: 'Máximo 50 tags por operación' })
  @IsString({ each: true, message: 'Cada tag debe ser un string' })
  @Matches(/^[a-zA-Z0-9_:\-\.]+$/, {
    each: true,
    message: 'Los tags solo pueden contener letras, números, _, :, - y .',
  })
  tags: string[];
}

/**
 * DTO para invalidar por patrón
 */
export class InvalidatePatternDto {
  @ApiProperty({
    description: 'Patrón de keys a invalidar (ej: user:*)',
    example: 'user:*',
  })
  @IsString({ message: 'El patrón debe ser un string' })
  @IsNotEmpty({ message: 'El patrón es requerido' })
  @MaxLength(200, { message: 'El patrón debe tener máximo 200 caracteres' })
  @Matches(/^[a-zA-Z0-9_:\-\.\*\?\[\]]+$/, {
    message: 'El patrón contiene caracteres no permitidos',
  })
  pattern: string;
}

/**
 * DTO para validar parámetro tag en URL
 */
export class TagParamDto {
  @ApiProperty({
    description: 'Tag a consultar/invalidar',
    example: 'users',
  })
  @IsString({ message: 'El tag debe ser un string' })
  @IsNotEmpty({ message: 'El tag es requerido' })
  @MaxLength(100, { message: 'El tag debe tener máximo 100 caracteres' })
  @Matches(/^[a-zA-Z0-9_:\-\.]+$/, {
    message: 'El tag solo puede contener letras, números, _, :, - y .',
  })
  tag: string;
}

/**
 * DTO para parámetros de consulta de keys
 */
export class ListKeysQueryDto {
  @ApiPropertyOptional({
    description: 'Patrón para filtrar keys (ej: user:*)',
    example: 'user:*',
    default: '*',
  })
  @IsOptional()
  @IsString({ message: 'El patrón debe ser un string' })
  @MaxLength(200, { message: 'El patrón debe tener máximo 200 caracteres' })
  @Matches(/^[a-zA-Z0-9_:\-\.\*\?\[\]]*$/, {
    message: 'El patrón contiene caracteres no permitidos',
  })
  pattern?: string;

  @ApiPropertyOptional({
    description: 'Cursor de paginación (0 para la primera página)',
    example: '0',
    default: '0',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Cantidad sugerida de keys por página (máx: 500)',
    example: '100',
    default: '100',
  })
  @IsOptional()
  @IsString()
  count?: string;
}

/**
 * DTO para parámetros de conteo
 */
export class CountKeysQueryDto {
  @ApiPropertyOptional({
    description: 'Patrón para filtrar keys',
    example: 'user:*',
    default: '*',
  })
  @IsOptional()
  @IsString({ message: 'El patrón debe ser un string' })
  @MaxLength(200, { message: 'El patrón debe tener máximo 200 caracteres' })
  @Matches(/^[a-zA-Z0-9_:\-\.\*\?\[\]]*$/, {
    message: 'El patrón contiene caracteres no permitidos',
  })
  pattern?: string;
}
