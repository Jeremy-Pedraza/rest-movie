// src/modules/reports/dto/dynamic-discount.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Length, IsEnum } from 'class-validator';

/**
 * Tipos de descuento disponibles
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
 * @example
 * ```typescript
 * const dto: CreateDynamicDiscountDto = {
 *   discount_type: 'promotional',
 *   discount_name: 'Happy Hour 2x1',
 *   total_discount: 500.00,
 *   times_applied: 10,
 * };
 * ```
 */
export class CreateDynamicDiscountDto {
  @ApiProperty({
    description: 'Tipo de descuento',
    enum: DiscountTypeEnum,
    example: DiscountTypeEnum.PROMOTIONAL,
  })
  @IsEnum(DiscountTypeEnum, {
    message:
      'El tipo de descuento debe ser: promotional, loyalty, coupon, seasonal, employee u other',
  })
  @IsNotEmpty({ message: 'El tipo de descuento es requerido' })
  discount_type: DiscountTypeEnum;

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
 */
export class DynamicDiscountResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Tipo de descuento', enum: DiscountTypeEnum })
  discount_type: DiscountTypeEnum;

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
