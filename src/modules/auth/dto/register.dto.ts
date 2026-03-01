// src/modules/auth/dto/register.dto.ts

import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Perez',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'El apellido debe ser texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  lastName: string;

  @ApiProperty({
    description: 'Correo electronico',
    example: 'juan@email.com',
  })
  @IsEmail({}, { message: 'Correo electronico invalido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña',
    example: 'Admin@123',
    minLength: 6,
    maxLength: 100,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100, { message: 'La contraseña no puede exceder 100 caracteres' })
  password: string;

  @ApiPropertyOptional({
    description: 'IDs de roles a asignar',
    type: [String],
    example: [],
  })
  @IsOptional()
  @IsArray({ message: 'roleIds debe ser un array' })
  @IsUUID('4', { each: true, message: 'Cada roleId debe ser un UUID valido' })
  roleIds?: string[];
}
