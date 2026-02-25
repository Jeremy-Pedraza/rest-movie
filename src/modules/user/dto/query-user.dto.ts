// src/modules/user/dto/query-user.dto.ts

/**
 * @fileoverview DTO para consultar usuarios
 * @module modules/user/dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean, IsDateString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto, SortOrder } from '@shared/common';

import { UserStatus } from '../entities/user.entity';

export class QueryUserDto extends PaginationDto {
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
    description: 'Campo para ordenar',
    default: 'createdAt',
    enum: ['createdAt', 'email', 'firstName', 'lastName', 'status', 'lastLoginAt'],
  })
  @IsOptional()
  @Transform(({ value, obj }): string => value ?? obj.sort_by ?? 'createdAt')
  @IsIn(['createdAt', 'email', 'firstName', 'lastName', 'status', 'lastLoginAt'])
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

