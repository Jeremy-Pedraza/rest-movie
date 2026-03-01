// src/modules/media/dto/create-media.dto.ts

import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMediaDto {
  @ApiProperty({
    description: 'Serial unico del media',
    example: 'MOV-001',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'El serial debe ser texto' })
  @MinLength(1, { message: 'El serial no puede estar vacio' })
  @MaxLength(100, { message: 'El serial no puede exceder 100 caracteres' })
  serial: string;

  @ApiProperty({
    description: 'Titulo del media',
    example: 'Inception',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'El titulo debe ser texto' })
  @MinLength(1, { message: 'El titulo no puede estar vacio' })
  @MaxLength(255, { message: 'El titulo no puede exceder 255 caracteres' })
  title: string;

  @ApiPropertyOptional({
    description: 'Sinopsis del media',
    example: 'Un ladron que roba secretos corporativos a traves del uso de la tecnologia de suenos compartidos.',
  })
  @IsOptional()
  @IsString({ message: 'La sinopsis debe ser texto' })
  synopsis?: string;

  @ApiProperty({
    description: 'URL del media',
    example: 'https://example.com/movies/inception',
    maxLength: 500,
  })
  @IsString({ message: 'La URL debe ser texto' })
  @IsUrl({}, { message: 'La URL debe tener un formato valido' })
  @MaxLength(500, { message: 'La URL no puede exceder 500 caracteres' })
  url: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen de portada',
    example: 'https://example.com/covers/inception.jpg',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'La URL de portada debe ser texto' })
  @MaxLength(500, { message: 'La URL de portada no puede exceder 500 caracteres' })
  coverImage?: string;

  @ApiProperty({
    description: 'Ano de lanzamiento',
    example: 2010,
    minimum: 1888,
    maximum: 2100,
  })
  @IsInt({ message: 'El ano de lanzamiento debe ser un numero entero' })
  @Min(1888, { message: 'El ano de lanzamiento debe ser mayor o igual a 1888' })
  @Max(2100, { message: 'El ano de lanzamiento debe ser menor o igual a 2100' })
  releaseYear: number;

  @ApiProperty({
    description: 'UUID del genero',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'genre_id debe ser un UUID valido' })
  genreId: string;

  @ApiProperty({
    description: 'UUID del director',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4', { message: 'director_id debe ser un UUID valido' })
  directorId: string;

  @ApiProperty({
    description: 'UUID de la productora',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID('4', { message: 'producer_id debe ser un UUID valido' })
  producerId: string;

  @ApiProperty({
    description: 'UUID del tipo',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID('4', { message: 'type_id debe ser un UUID valido' })
  typeId: string;
}
