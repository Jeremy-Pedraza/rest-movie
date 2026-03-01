// src/modules/director/dto/create-director.dto.ts

import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDirectorDto {
  @ApiProperty({
    description: 'Nombres del director',
    example: 'Christopher Nolan',
    minLength: 3,
    maxLength: 150,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  names: string;
}
