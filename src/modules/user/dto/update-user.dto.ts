// src/modules/user/dto/update-user.dto.ts

/**
 * @fileoverview DTO para actualizar usuarios
 * @module modules/user/dto
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsObject,
} from 'class-validator';

import { UserStatus } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Email del usuario',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener mínimo 2 caracteres' })
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del usuario',
    example: '+573001234567',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Número de teléfono inválido' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'URL del avatar',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Estado del usuario',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Estado inválido' })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'IDs de roles a asignar',
    type: [String],
    example: ['uuid-rol-1', 'uuid-rol-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada rol debe ser un UUID válido' })
  roleIds?: string[];

  @ApiPropertyOptional({
    description: 'Metadata adicional',
    example: { department: 'IT', position: 'Developer' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Preferencias del usuario',
    example: { theme: 'dark', language: 'es' },
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
