// src/modules/auth/dto/forgot-password.dto.ts

/**
 * @fileoverview DTO para solicitar reset de contraseña
 * @module modules/auth/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email del usuario que olvidó su contraseña',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;
}
