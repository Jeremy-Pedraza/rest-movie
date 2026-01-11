// src/modules/logger/dto/query-log.dto.ts

/**
 * @fileoverview DTO para consultar logs
 * @module modules/logger/dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

import { LogLevel, LogContext } from '../entities/log.entity';

export class QueryLogDto {
  @ApiPropertyOptional({
    enum: LogLevel,
    description: 'Filtrar por nivel',
  })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({
    enum: LogContext,
    description: 'Filtrar por contexto',
  })
  @IsOptional()
  @IsEnum(LogContext)
  context?: LogContext;

  @ApiPropertyOptional({
    description: 'Buscar en mensaje',
    example: 'error',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por request ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por user ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por servicio',
    example: 'UserService',
  })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por código de error',
    example: 'USER_NOT_FOUND',
  })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por método HTTP',
    example: 'POST',
  })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por código de estado HTTP',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  statusCode?: number;

  @ApiPropertyOptional({
    description: 'Fecha desde (ISO)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (ISO)',
    example: '2025-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Registros por página',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    default: 'createdAt',
    enum: ['createdAt', 'level', 'context', 'statusCode', 'responseTime'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Orden',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * DTO para estadísticas de logs
 */
export class LogStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha desde (ISO)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (ISO)',
    example: '2025-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Agrupar por',
    enum: ['level', 'context', 'hour', 'day'],
    default: 'level',
  })
  @IsOptional()
  @IsString()
  groupBy?: 'level' | 'context' | 'hour' | 'day' = 'level';
}
