// src/modules/cache/dto/cache-stats.dto.ts

/**
 * @fileoverview DTO para estadísticas de cache
 * @module modules/cache
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para estadísticas por tag
 */
export class TagStatsDto {
  @ApiProperty({ description: 'Hits del tag', example: 150 })
  hits: number;

  @ApiProperty({ description: 'Misses del tag', example: 30 })
  misses: number;

  @ApiProperty({ description: 'Keys con este tag', example: 50 })
  keys: number;

  @ApiProperty({ description: 'Hit ratio', example: 0.83 })
  hitRatio: number;
}

/**
 * DTO para estadísticas de cache
 */
export class CacheStatsDto {
  @ApiProperty({ description: 'Total de hits', example: 1500 })
  hits: number;

  @ApiProperty({ description: 'Total de misses', example: 300 })
  misses: number;

  @ApiProperty({ description: 'Hit ratio', example: 0.83 })
  hitRatio: number;

  @ApiProperty({ description: 'Total de keys', example: 250 })
  totalKeys: number;

  @ApiPropertyOptional({ description: 'Memoria usada', example: '12.5 MB' })
  memoryUsage?: string;

  @ApiPropertyOptional({
    description: 'Estadísticas por tag',
    type: 'object',
    additionalProperties: true,
    example: {
      users: { hits: 800, misses: 100, keys: 50, hitRatio: 0.88 },
      products: { hits: 700, misses: 200, keys: 80, hitRatio: 0.77 },
    },
  })
  byTag?: Record<string, TagStatsDto>;

  @ApiProperty({ description: 'Última actualización', example: '2025-01-12T15:30:00.000Z' })
  lastUpdated: Date;
}
