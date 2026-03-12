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
  IsIn,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto, SortOrder } from '@shared/common/dto/pagination.dto';

import { LogLevel, LogContext } from '../entities/log.entity';

export class QueryLogDto extends PaginationDto {
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
    description: 'Registros por página',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    default: 'created_at',
    enum: ['created_at', 'level', 'context', 'status_code', 'response_time'],
  })
  @IsOptional()
  @Transform(({ value, obj }): string => {
    const raw: string = value ?? obj.sort_by ?? 'createdAt';
    return raw === 'created_at' ? 'createdAt' : raw;
  })
  @IsIn(['createdAt', 'created_at', 'level', 'context', 'status_code', 'response_time'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Orden',
    default: SortOrder.DESC,
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @Transform(({ value, obj }): SortOrder => value ?? obj.sort_order ?? SortOrder.DESC)
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
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
