// src/modules/logger/dto/create-log.dto.ts

/**
 * @fileoverview DTO para crear logs
 * @module modules/logger/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsIP,
  MaxLength,
  IsObject,
  Min,
  Max,
} from 'class-validator';

import { LogLevel, LogContext } from '../entities/log.entity';

export class CreateLogDto {
  @ApiProperty({
    enum: LogLevel,
    default: LogLevel.INFO,
    description: 'Nivel del log',
  })
  @IsEnum(LogLevel)
  @IsNotEmpty()
  level: LogLevel;

  @ApiProperty({
    enum: LogContext,
    default: LogContext.SYSTEM,
    description: 'Contexto del log',
  })
  @IsEnum(LogContext)
  @IsNotEmpty()
  context: LogContext;

  @ApiProperty({
    description: 'Mensaje del log',
    example: 'Usuario creado exitosamente',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    description: 'Metadata adicional',
    example: { userId: '123', action: 'create' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Stack trace del error',
  })
  @IsOptional()
  @IsString()
  stack?: string;

  @ApiPropertyOptional({
    description: 'ID de la petición HTTP',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'IP del cliente',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsIP()
  ip?: string;

  @ApiPropertyOptional({
    description: 'User Agent',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Método HTTP',
    example: 'POST',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  method?: string;

  @ApiPropertyOptional({
    description: 'URL de la petición',
    example: '/api/users',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @ApiPropertyOptional({
    description: 'Código de estado HTTP',
    example: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode?: number;

  @ApiPropertyOptional({
    description: 'Tiempo de respuesta en ms',
    example: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;

  @ApiPropertyOptional({
    description: 'Nombre del servicio',
    example: 'UserService',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  service?: string;

  @ApiPropertyOptional({
    description: 'Nombre de la acción',
    example: 'createUser',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @ApiPropertyOptional({
    description: 'Código de error',
    example: 'USER_NOT_FOUND',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  errorCode?: string;
}
