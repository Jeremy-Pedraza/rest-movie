// src/modules/user/dto/query-user.dto.ts

/**
 * @fileoverview DTO para consultar usuarios
 * @module modules/user/dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

import { UserStatus } from '../entities/user.entity';

export class QueryUserDto {
  @ApiPropertyOptional({
    description: 'Buscar por email, nombre o apellido',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por rol (nombre)',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por email verificado',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha desde (ISO)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (ISO)',
    example: '2025-12-31T23:59:59Z',
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
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo para ordenar',
    default: 'createdAt',
    enum: ['createdAt', 'email', 'firstName', 'lastName', 'status', 'lastLoginAt'],
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
