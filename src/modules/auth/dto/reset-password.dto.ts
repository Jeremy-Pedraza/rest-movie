// src/modules/auth/dto/reset-password.dto.ts

/**
 * @fileoverview DTO para resetear contraseña con token
 * @module modules/auth/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { Match } from '@decorators/match.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset recibido por email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'El token debe ser texto' })
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'NewSecurePass123!@#',
    minLength: 8,
    maxLength: 128,
    format: 'password',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña debe tener máximo 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/, {
    message:
      'La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&#)',
  })
  password: string;

  @ApiProperty({
    description: 'Confirmación de contraseña',
    example: 'NewSecurePass123!@#',
    minLength: 8,
    format: 'password',
  })
  @IsString({ message: 'La confirmación debe ser texto' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @Match('password', { message: 'Las contraseñas no coinciden' })
  passwordConfirmation: string;
}
