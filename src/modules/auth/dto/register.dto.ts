// src/modules/auth/dto/register.dto.ts

/**
 * @fileoverview DTO para registro de usuarios
 * @module modules/auth/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

import { Match } from '@decorators/match.decorator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @MaxLength(255, { message: 'El email debe tener máximo 255 caracteres' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'SecurePass123!@#',
    minLength: 8,
    maxLength: 128,
    format: 'password',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña debe tener máximo 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,128}$/, {
    message:
      'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&#)',
  })
  password: string;

  @ApiProperty({
    description: 'Confirmación de contraseña',
    example: 'SecurePass123!@#',
    minLength: 8,
    format: 'password',
  })
  @IsString({ message: 'La confirmación de contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @Match('password', { message: 'Las contraseñas no coinciden' })
  passwordConfirmation: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  @MaxLength(50, { message: 'El nombre debe tener máximo 50 caracteres' })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'El apellido debe ser texto' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MinLength(2, { message: 'El apellido debe tener mínimo 2 caracteres' })
  @MaxLength(50, { message: 'El apellido debe tener máximo 50 caracteres' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Teléfono del usuario',
    example: '+573001234567',
    pattern: '^\\+?[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'El teléfono debe estar en formato E.164 (ej: +573001234567)',
  })
  phone?: string;
}
