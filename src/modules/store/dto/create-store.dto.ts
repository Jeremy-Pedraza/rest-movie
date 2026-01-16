// src/modules/store/dto/create-store.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsOptional,
  Length,
  IsObject,
} from 'class-validator';

/**
 * DTO para crear una tienda/sucursal
 *
 * @description
 * Valida todos los campos requeridos para crear una nueva tienda.
 * Cada tienda pertenece a una compañía y puede tener usuarios asignados.
 *
 * @example
 * ```typescript
 * const dto: CreateStoreDto = {
 *   company_id: 'uuid-company',
 *   nombre: 'Sucursal Centro',
 *   codigo: 'TDA-001',
 *   direccion: 'Av. Principal 123',
 *   ciudad: 'Quito',
 * };
 * ```
 */
export class CreateStoreDto {
  @ApiProperty({
    description: 'ID de la compañía a la que pertenece la tienda',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'company_id es requerido' })
  company_id: string;

  @ApiProperty({
    description: 'Nombre de la tienda',
    example: 'Sucursal Centro',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(3, 100, { message: 'El nombre debe tener entre 3 y 100 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Código único de la tienda',
    example: 'TDA-001',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(3, 20, { message: 'El código debe tener entre 3 y 20 caracteres' })
  codigo: string;

  @ApiPropertyOptional({
    description: 'Email de la tienda',
    example: 'centro@valle.com',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+593987654321',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  telefono?: string;

  @ApiProperty({
    description: 'Dirección física de la tienda',
    example: 'Av. Principal 123',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  direccion: string;

  @ApiProperty({
    description: 'Ciudad donde se ubica la tienda',
    example: 'Quito',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  ciudad: string;

  @ApiPropertyOptional({
    description: 'Zona o sector de la ciudad',
    example: 'Norte',
  })
  @IsString({ message: 'La zona debe ser una cadena de texto' })
  @IsOptional()
  zona?: string;

  @ApiPropertyOptional({
    description: 'Latitud GPS de la ubicación',
    example: -0.1807,
  })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({
    description: 'Longitud GPS de la ubicación',
    example: -78.4678,
  })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsOptional()
  longitud?: number;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo de la tienda',
    default: true,
  })
  @IsBoolean({ message: 'activo debe ser un valor booleano' })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Metadata adicional en formato JSON',
    example: { horario: '09:00-18:00', capacidad: 50 },
  })
  @IsObject({ message: 'metadata debe ser un objeto JSON' })
  @IsOptional()
  metadata?: Record<string, any>;
}
