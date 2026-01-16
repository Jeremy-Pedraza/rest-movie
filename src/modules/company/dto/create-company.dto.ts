// src/modules/company/dto/create-company.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsBoolean,
  IsOptional,
  Length,
  IsObject,
} from 'class-validator';

/**
 * DTO para crear una compañía
 *
 * @description
 * Valida todos los campos requeridos para crear una nueva compañía en el sistema.
 * Incluye información básica, contacto, ubicación y configuración.
 *
 * @example
 * ```typescript
 * const dto: CreateCompanyDto = {
 *   name: 'Restaurantes Valle S.A.',
 *   ruc: '1792345678001',
 *   email: 'contacto@valle.com',
 *   pais: 'Ecuador',
 *   ciudad: 'Quito',
 *   schema: 'restaurant_valle_schema',
 *   subdomain: 'valle',
 * };
 * ```
 */
export class CreateCompanyDto {
  @ApiProperty({
    description: 'Nombre de la empresa/razón social',
    example: 'Restaurantes Valle S.A.',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(3, 255, { message: 'El nombre debe tener entre 3 y 255 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Schema de PostgreSQL (multi-tenant)',
    example: 'restaurant_valle_schema',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El schema debe ser una cadena de texto' })
  @IsOptional()
  @Length(3, 100, { message: 'El schema debe tener entre 3 y 100 caracteres' })
  schema?: string;

  @ApiPropertyOptional({
    description: 'Dominio completo',
    example: 'valle.miapp.com',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'El dominio debe ser una cadena de texto' })
  @IsOptional()
  @Length(3, 255, { message: 'El dominio debe tener entre 3 y 255 caracteres' })
  domain?: string;

  @ApiPropertyOptional({
    description: 'Subdominio',
    example: 'valle',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: 'El subdominio debe ser una cadena de texto' })
  @IsOptional()
  @Length(2, 50, { message: 'El subdominio debe tener entre 2 y 50 caracteres' })
  subdomain?: string;

  @ApiProperty({
    description: 'Email corporativo',
    example: 'contacto@valle.com',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Teléfono corporativo',
    example: '+593987654321',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Dirección fiscal',
    example: 'Av. Amazonas N34-451 y Atahualpa',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  direccion?: string;

  @ApiProperty({
    description: 'País',
    example: 'Ecuador',
  })
  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El país es requerido' })
  pais: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Quito',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  ciudad: string;

  @ApiProperty({
    description: 'RUC/NIT',
    example: '1792345678001',
    minLength: 10,
    maxLength: 20,
  })
  @IsString({ message: 'El RUC debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El RUC es requerido' })
  @Length(10, 20, { message: 'El RUC debe tener entre 10 y 20 caracteres' })
  ruc: string;

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo',
    default: true,
  })
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Plan/Tier',
    example: 'premium',
  })
  @IsString({ message: 'El plan debe ser una cadena de texto' })
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional({
    description: 'Configuración adicional (JSON)',
    example: { features: ['reports', 'analytics'], max_users: 100 },
  })
  @IsObject({ message: 'Settings debe ser un objeto JSON' })
  @IsOptional()
  settings?: Record<string, any>;
}
