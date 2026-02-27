// src/modules/reports/dto/dynamic-discount.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Length } from 'class-validator';

/**
 * Tipos de descuento disponibles (REFERENCIA)
 *
 * @deprecated Este enum se mantiene solo como referencia de tipos comunes.
 * El API ahora acepta cualquier string para discount_type, permitiendo valores
 * originales de Simphony como "Happy Hour 2x1", "Descuento Empleado 20%", etc.
 *
 * Valores históricos en la BD pueden seguir usando estos valores normalizados.
 */
export enum DiscountTypeEnum {
  PROMOTIONAL = 'promotional',
  LOYALTY = 'loyalty',
  COUPON = 'coupon',
  SEASONAL = 'seasonal',
  EMPLOYEE = 'employee',
  OTHER = 'other',
}

/**
 * DTO para crear descuento dinámico
 *
 * @description
 * Valida los campos para registrar descuentos aplicados.
 * Usado dentro de CreateReportDto para el array dynamic_discounts.
 *
 * **CAMBIO IMPORTANTE (2025-01-27):**
 * El campo `discount_type` ahora acepta cualquier string (1-100 caracteres) en lugar
 * de estar limitado a un enum. Esto permite almacenar valores originales de Simphony
 * sin transformación (ej: "Happy Hour 2x1", "Descuento Empleado 20%", "Promo Navideña").
 *
 * @example
 * ```typescript
 * // Nuevos valores (desde 2025-01-27)
 * const dto1: CreateDynamicDiscountDto = {
 *   discount_type: 'Happy Hour 2x1',
 *   discount_name: 'Happy Hour 2x1',
 *   total_discount: 500.00,
 *   times_applied: 10,
 * };
 *
 * const dto2: CreateDynamicDiscountDto = {
 *   discount_type: 'Descuento Empleado 20%',
 *   discount_name: 'Descuento Personal',
 *   total_discount: 200.00,
 *   times_applied: 5,
 * };
 *
 * // Valores legacy (anteriores a 2025-01-27) siguen siendo válidos
 * const dto3: CreateDynamicDiscountDto = {
 *   discount_type: 'promotional',
 *   discount_name: 'Promo Genérica',
 *   total_discount: 300.00,
 *   times_applied: 8,
 * };
 * ```
 */
export class CreateDynamicDiscountDto {
  @ApiProperty({
    description:
      'Tipo de descuento (valor libre desde Simphony, ej: "Happy Hour 2x1", "Descuento Empleado 20%")',
    example: 'Happy Hour 2x1',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'El tipo de descuento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo de descuento es requerido' })
  @Length(1, 100, { message: 'El tipo de descuento debe tener entre 1 y 100 caracteres' })
  discount_type: string;

  @ApiProperty({
    description: 'Nombre del descuento',
    example: 'Happy Hour 2x1',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'El nombre del descuento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del descuento es requerido' })
  @Length(3, 100, {
    message: 'El nombre del descuento debe tener entre 3 y 100 caracteres',
  })
  discount_name: string;

  @ApiProperty({
    description: 'Monto total de descuento aplicado',
    example: 500.0,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_discount debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'total_discount debe ser mayor o igual a 0' })
  total_discount: number;

  @ApiProperty({
    description: 'Veces que se aplicó el descuento',
    example: 10,
    minimum: 0,
  })
  @IsNumber({}, { message: 'times_applied debe ser un número entero' })
  @Min(0, { message: 'times_applied debe ser mayor o igual a 0' })
  times_applied: number;

  @ApiPropertyOptional({
    description: 'Descuento promedio por aplicación (calculado automáticamente)',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'average_discount debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'average_discount debe ser mayor o igual a 0' })
  @IsOptional()
  average_discount?: number;
}

/**
 * DTO para respuesta de descuento dinámico
 *
 * @description
 * Representa la estructura de respuesta para descuentos dinámicos.
 * El campo `discount_type` ahora retorna el valor original almacenado en la BD.
 */
export class DynamicDiscountResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({
    description: 'Tipo de descuento (valor original de Simphony)',
    example: 'Happy Hour 2x1',
  })
  discount_type: string;

  @ApiProperty({ description: 'Nombre del descuento' })
  discount_name: string;

  @ApiProperty({ description: 'Monto total de descuento' })
  total_discount: number;

  @ApiProperty({ description: 'Veces que se aplicó' })
  times_applied: number;

  @ApiProperty({ description: 'Descuento promedio por aplicación' })
  average_discount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
