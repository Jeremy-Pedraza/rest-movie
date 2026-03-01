// src/modules/genre/dto/create-genre.dto.ts

import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGenreDto {
  @ApiProperty({
    description: 'Nombre del genero',
    example: 'Accion',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripcion del genero',
    example: 'Peliculas con escenas de accion y aventura',
  })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser texto' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Estado activo del genero',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  isActive?: boolean = true;
}
