// src/modules/auth/dto/login.dto.ts

import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electronico',
    example: 'admin@admin.com',
  })
  @IsEmail({}, { message: 'Correo electronico invalido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña',
    example: 'Admin@123',
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
