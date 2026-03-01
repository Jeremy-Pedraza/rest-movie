// src/modules/type/dto/create-type.dto.ts

import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo',
    example: 'Pelicula',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descripcion del tipo',
    example: 'Contenido audiovisual de larga duracion',
  })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser texto' })
  description?: string;
}
