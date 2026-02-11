// src/modules/auth/dto/change-password.dto.ts

/**
 * @fileoverview DTO para cambiar contraseña
 * @module modules/auth/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { Match } from '@decorators/match.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'OldPass123!@#',
    minLength: 8,
    format: 'password',
  })
  @IsString({ message: 'La contraseña actual debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  @MinLength(8, { message: 'La contraseña actual debe tener mínimo 8 caracteres' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'NewPass123!@#',
    minLength: 8,
    maxLength: 128,
    format: 'password',
  })
  @IsString({ message: 'La nueva contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, { message: 'La nueva contraseña debe tener mínimo 8 caracteres' })
  @MaxLength(128, { message: 'La nueva contraseña debe tener máximo 128 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,128}$/, {
    message:
      'La nueva contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&#)',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmación de nueva contraseña',
    example: 'NewPass123!@#',
    minLength: 8,
    format: 'password',
  })
  @IsString({ message: 'La confirmación debe ser texto' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @Match('newPassword', { message: 'Las contraseñas no coinciden' })
  newPasswordConfirmation: string;
}
