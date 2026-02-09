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
  IsIn,
  IsInt,
  Min,
  Max,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Tipos de ubicación válidos para tiendas
 */
export const VALID_LOCATION_TYPES = [
  'mall',
  'street',
  'airport',
  'highway',
  'food_court',
  'gas_station',
  'university',
  'hospital',
  'office_building',
  'standalone',
] as const;

/**
 * Formatos de tienda válidos
 */
export const VALID_STORE_FORMATS = [
  'express',
  'regular',
  'flagship',
  'cantina',
  'drive_thru_only',
  'delivery_hub',
  'kiosk',
  'ghost_kitchen',
] as const;

/**
 * Tiers de ventas válidos
 */
export const VALID_SALES_TIERS = ['A', 'B', 'C', 'D', 'E'] as const;

/**
 * DTO para horario de un día
 */
export class DayScheduleDto {
  @ApiProperty({ description: 'Hora de apertura', example: '08:00' })
  @IsString()
  @IsNotEmpty()
  open: string;

  @ApiProperty({ description: 'Hora de cierre', example: '22:00' })
  @IsString()
  @IsNotEmpty()
  close: string;
}

/**
 * DTO para horarios de operación
 */
export class OperatingHoursDto {
  @ApiPropertyOptional({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  @IsOptional()
  monday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  @IsOptional()
  tuesday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  @IsOptional()
  wednesday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  @IsOptional()
  thursday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  @IsOptional()
  friday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  @IsOptional()
  saturday?: DayScheduleDto;

  @ApiPropertyOptional({ type: DayScheduleDto })
  @ValidateNested()
  @Type(() => DayScheduleDto)
  @IsOptional()
  sunday?: DayScheduleDto;
}

/**
 * DTO para crear una tienda/sucursal
 *
 * @description
 * Valida todos los campos requeridos para crear una nueva tienda.
 * Cada tienda pertenece a una compañía y puede tener usuarios asignados.
 *
 * @version 2.0.0 - Agregados campos de segmentación (FASE 2)
 *
 * @example
 * ```typescript
 * const dto: CreateStoreDto = {
 *   company_id: 'uuid-company',
 *   nombre: 'Taco Bell Agora Mall',
 *   codigo: 'TB-RD-001',
 *   direccion: 'Agora Mall, Local 201',
 *   ciudad: 'Santo Domingo',
 *   region: 'Metropolitana',
 *   location_type: 'mall',
 *   store_format: 'regular',
 *   sales_tier: 'A',
 *   has_drive_thru: false,
 *   has_delivery: true,
 * };
 * ```
 */
export class CreateStoreDto {
  // ============================================
  // CAMPOS REQUERIDOS
  // ============================================

  @ApiProperty({
    description: 'ID de la compañía a la que pertenece la tienda',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'company_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'company_id es requerido' })
  company_id: string;

  @ApiProperty({
    description: 'Nombre de la tienda',
    example: 'Taco Bell Agora Mall',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(3, 100, { message: 'El nombre debe tener entre 3 y 100 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Código único de la tienda',
    example: 'TB-RD-001',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(3, 20, { message: 'El código debe tener entre 3 y 20 caracteres' })
  codigo: string;

  @ApiProperty({
    description: 'Dirección física de la tienda',
    example: 'Agora Mall, Local 201, Av. Abraham Lincoln',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  direccion: string;

  @ApiProperty({
    description: 'Ciudad donde se ubica la tienda',
    example: 'Santo Domingo',
  })
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  ciudad: string;

  // ============================================
  // CONTACTO (OPCIONALES)
  // ============================================

  @ApiPropertyOptional({
    description: 'Email de la tienda',
    example: 'agora@tacobell.do',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+1-809-555-0101',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  telefono?: string;

  // ============================================
  // UBICACIÓN (OPCIONALES)
  // ============================================

  @ApiPropertyOptional({
    description: 'Zona o sector de la ciudad',
    example: 'Piantini',
  })
  @IsString({ message: 'La zona debe ser una cadena de texto' })
  @IsOptional()
  zona?: string;

  @ApiPropertyOptional({
    description: 'Latitud GPS de la ubicación',
    example: 18.4861111,
  })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({
    description: 'Longitud GPS de la ubicación',
    example: -69.9388889,
  })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @IsOptional()
  longitud?: number;

  // ============================================
  // CAMPOS DE SEGMENTACIÓN (FASE 2)
  // ============================================

  @ApiPropertyOptional({
    description: 'Región geográfica para agrupación de reportes',
    example: 'Metropolitana',
  })
  @IsString({ message: 'region debe ser una cadena de texto' })
  @IsOptional()
  @Length(2, 50, { message: 'region debe tener entre 2 y 50 caracteres' })
  region?: string;

  @ApiPropertyOptional({
    description: 'Tipo de ubicación de la tienda',
    example: 'mall',
    enum: VALID_LOCATION_TYPES,
  })
  @IsString({ message: 'location_type debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_LOCATION_TYPES, {
    message: `location_type debe ser uno de: ${VALID_LOCATION_TYPES.join(', ')}`,
  })
  location_type?: string;

  @ApiPropertyOptional({
    description: 'Formato de tienda (tamaño/concepto)',
    example: 'regular',
    enum: VALID_STORE_FORMATS,
  })
  @IsString({ message: 'store_format debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_STORE_FORMATS, {
    message: `store_format debe ser uno de: ${VALID_STORE_FORMATS.join(', ')}`,
  })
  store_format?: string;

  @ApiPropertyOptional({
    description: 'Capacidad de asientos (para dine-in)',
    example: 60,
    minimum: 0,
    maximum: 500,
  })
  @IsInt({ message: 'seating_capacity debe ser un número entero' })
  @IsOptional()
  @Min(0, { message: 'seating_capacity no puede ser negativo' })
  @Max(500, { message: 'seating_capacity no puede exceder 500' })
  seating_capacity?: number;

  @ApiPropertyOptional({
    description: 'Indica si tiene servicio drive-thru',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'has_drive_thru debe ser un valor booleano' })
  @IsOptional()
  has_drive_thru?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si tiene servicio de delivery propio',
    example: true,
    default: false,
  })
  @IsBoolean({ message: 'has_delivery debe ser un valor booleano' })
  @IsOptional()
  has_delivery?: boolean;

  @ApiPropertyOptional({
    description: 'Horarios de operación por día',
    example: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' },
    },
    type: OperatingHoursDto,
  })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operating_hours?: OperatingHoursDto;

  @ApiPropertyOptional({
    description: 'Fecha de apertura de la tienda (YYYY-MM-DD)',
    example: '2023-06-15',
  })
  @IsDateString({}, { message: 'opening_date debe ser una fecha válida (YYYY-MM-DD)' })
  @IsOptional()
  opening_date?: string;

  @ApiPropertyOptional({
    description: 'Nombre del gerente/responsable de la tienda',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'manager_name debe ser una cadena de texto' })
  @IsOptional()
  @Length(2, 100, { message: 'manager_name debe tener entre 2 y 100 caracteres' })
  manager_name?: string;

  @ApiPropertyOptional({
    description: 'Clasificación de ventas (A=top, B, C, D, E=bajo)',
    example: 'A',
    enum: VALID_SALES_TIERS,
  })
  @IsString({ message: 'sales_tier debe ser una cadena de texto' })
  @IsOptional()
  @IsIn(VALID_SALES_TIERS, {
    message: `sales_tier debe ser uno de: ${VALID_SALES_TIERS.join(', ')}`,
  })
  sales_tier?: string;

  @ApiPropertyOptional({
    description: 'Tags para filtrado flexible',
    example: ['nuevo', 'remodelado', 'wifi', '24h'],
    type: [String],
  })
  @IsArray({ message: 'tags debe ser un array' })
  @IsString({ each: true, message: 'Cada tag debe ser una cadena de texto' })
  @IsOptional()
  tags?: string[];

  // ============================================
  // REFERENCIA GEOGRÁFICA (CATÁLOGO)
  // ============================================

  @ApiPropertyOptional({
    description:
      'ID de la ciudad en el catálogo geográfico. ' +
      'Vincula la tienda al catálogo maestro para heredar timezone, moneda e impuestos del país.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'geo_city_id debe ser un UUID válido' })
  @IsOptional()
  geo_city_id?: string;

  // ============================================
  // ESTADO Y METADATA
  // ============================================

  @ApiPropertyOptional({
    description: 'Estado activo/inactivo de la tienda',
    default: true,
  })
  @IsBoolean({ message: 'activo debe ser un valor booleano' })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'Metadata adicional en formato JSON',
    example: { pos_type: 'micros', integration_id: 'TB-001' },
  })
  @IsObject({ message: 'metadata debe ser un objeto JSON' })
  @IsOptional()
  metadata?: Record<string, any>;
}
