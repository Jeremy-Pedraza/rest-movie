// src/modules/role/dto/create-role.dto.ts

import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'administrador',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripcion del rol',
    example: 'Acceso completo al sistema',
  })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Estado activo del rol',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  isActive?: boolean = true;
}
