// src/modules/user/dto/change-password.dto.ts

/**
 * @fileoverview DTO para cambiar contraseña
 * @module modules/user/dto
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Match } from '@decorators/match.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'CurrentPass123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres, una mayúscula, una minúscula, un número)',
    example: 'NewPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirmación de la nueva contraseña',
    example: 'NewPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'La confirmación es requerida' })
  @Match('newPassword', { message: 'Las contraseñas no coinciden' })
  confirmPassword: string;
}
