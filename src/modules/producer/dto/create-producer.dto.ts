// src/modules/producer/dto/create-producer.dto.ts

import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProducerDto {
  @ApiProperty({
    description: 'Nombre de la productora',
    example: 'Walt Disney Pictures',
    minLength: 3,
    maxLength: 150,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Slogan de la productora',
    example: 'Where Dreams Come True',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'El slogan debe ser texto' })
  @MaxLength(255, { message: 'El slogan no puede exceder 255 caracteres' })
  slogan?: string;

  @ApiPropertyOptional({
    description: 'Descripcion de la productora',
    example: 'Compania de entretenimiento multinacional',
  })
  @IsOptional()
  @IsString({ message: 'La descripcion debe ser texto' })
  description?: string;
}
