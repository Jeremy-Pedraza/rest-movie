// src/modules/user/dto/create-user.dto.ts

/**
 * @fileoverview DTO para crear usuarios
 * @module modules/user/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres, una mayúscula, una minúscula, un número)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MinLength(2, { message: 'El apellido debe tener mínimo 2 caracteres' })
  @MaxLength(100)
  lastName: string;

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
    description: 'IDs de roles a asignar',
    type: [String],
    example: ['uuid-rol-1', 'uuid-rol-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada rol debe ser un UUID válido' })
  roleIds?: string[];
}
