// src/modules/reports/dto/adjustment.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Length, IsEnum } from 'class-validator';

/**
 * Tipos de ajuste disponibles
 */
export enum AdjustmentTypeEnum {
  REFUND = 'refund',
  CANCELLATION = 'cancellation',
  VOID = 'void',
  CORRECTION = 'correction',
  DISCOUNT_ADJUSTMENT = 'discount_adjustment',
  OTHER = 'other',
}

/**
 * DTO para crear ajuste
 *
 * @description
 * Valida los campos para registrar ajustes y devoluciones.
 * Usado dentro de CreateReportDto para el array adjustments.
 *
 * Nota: El monto puede ser negativo para representar devoluciones.
 *
 * @example
 * ```typescript
 * const dto: CreateAdjustmentDto = {
 *   adjustment_type: 'refund',
 *   total_amount: -150.00,
 *   count: 3,
 *   reason: 'Cliente insatisfecho',
 * };
 * ```
 */
export class CreateAdjustmentDto {
  @ApiProperty({
    description: 'Tipo de ajuste',
    enum: AdjustmentTypeEnum,
    example: AdjustmentTypeEnum.REFUND,
  })
  @IsEnum(AdjustmentTypeEnum, {
    message:
      'El tipo de ajuste debe ser: refund, cancellation, void, correction, discount_adjustment u other',
  })
  @IsNotEmpty({ message: 'El tipo de ajuste es requerido' })
  adjustment_type: AdjustmentTypeEnum;

  @ApiProperty({
    description: 'Monto total del ajuste (puede ser negativo para devoluciones)',
    example: -150.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_amount debe ser un número con máximo 2 decimales' },
  )
  total_amount: number;

  @ApiProperty({
    description: 'Cantidad de ajustes de este tipo',
    example: 3,
    minimum: 0,
  })
  @IsNumber({}, { message: 'count debe ser un número entero' })
  count: number;

  @ApiPropertyOptional({
    description: 'Razón del ajuste',
    example: 'Cliente insatisfecho',
    maxLength: 500,
  })
  @IsString({ message: 'La razón debe ser una cadena de texto' })
  @Length(0, 500, { message: 'La razón debe tener máximo 500 caracteres' })
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Monto promedio por ajuste (calculado automáticamente)',
    example: -50.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'average_amount debe ser un número con máximo 2 decimales' },
  )
  @IsOptional()
  average_amount?: number;
}

/**
 * DTO para respuesta de ajuste
 *
 * @description
 * Representa la estructura de respuesta para ajustes.
 */
export class AdjustmentResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Tipo de ajuste', enum: AdjustmentTypeEnum })
  adjustment_type: AdjustmentTypeEnum;

  @ApiProperty({ description: 'Razón del ajuste' })
  reason?: string;

  @ApiProperty({ description: 'Monto total del ajuste' })
  total_amount: number;

  @ApiProperty({ description: 'Cantidad de ajustes' })
  count: number;

  @ApiProperty({ description: 'Monto promedio por ajuste' })
  average_amount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
