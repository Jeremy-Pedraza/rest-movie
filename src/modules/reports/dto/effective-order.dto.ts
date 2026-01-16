// src/modules/reports/dto/effective-order.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Length,
  IsEnum,
  IsObject,
  IsDateString,
} from 'class-validator';
import { OrderTypeEnum } from './sales-by-order-type.dto';
import { PaymentMethodTypeEnum } from './payment-method.dto';

/**
 * Estados de orden disponibles
 */
export enum OrderStatusEnum {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * DTO para crear orden efectiva
 *
 * @description
 * Valida los campos para registrar el detalle de una orden específica.
 * Usado dentro de CreateReportDto para el array effective_orders.
 *
 * @example
 * ```typescript
 * const dto: CreateEffectiveOrderDto = {
 *   order_number: 'ORD-12345',
 *   order_type: 'dine_in',
 *   total_amount: 150.50,
 *   gross_amount: 180.00,
 *   discounts: 29.50,
 *   items_count: 4,
 *   order_datetime: '2025-01-16T12:30:00Z',
 *   payment_method: 'cash',
 * };
 * ```
 */
export class CreateEffectiveOrderDto {
  @ApiProperty({
    description: 'Número de orden único',
    example: 'ORD-12345',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'El número de orden debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número de orden es requerido' })
  @Length(3, 50, {
    message: 'El número de orden debe tener entre 3 y 50 caracteres',
  })
  order_number: string;

  @ApiProperty({
    description: 'Tipo de orden',
    enum: OrderTypeEnum,
    example: OrderTypeEnum.DINE_IN,
  })
  @IsEnum(OrderTypeEnum, {
    message: 'El tipo de orden debe ser: dine_in, takeout, delivery o pickup',
  })
  @IsNotEmpty({ message: 'El tipo de orden es requerido' })
  order_type: OrderTypeEnum;

  @ApiProperty({
    description: 'Monto total de la orden (después de descuentos)',
    example: 150.5,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_amount debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'total_amount debe ser mayor o igual a 0' })
  total_amount: number;

  @ApiPropertyOptional({
    description: 'Monto de ventas brutas (antes de descuentos)',
    example: 180.0,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'gross_amount debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'gross_amount debe ser mayor o igual a 0' })
  @IsOptional()
  gross_amount?: number;

  @ApiPropertyOptional({
    description: 'Descuentos aplicados a esta orden',
    example: 29.5,
    minimum: 0,
    default: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'discounts debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'discounts debe ser mayor o igual a 0' })
  @IsOptional()
  discounts?: number;

  @ApiProperty({
    description: 'Cantidad de items en la orden',
    example: 4,
    minimum: 1,
  })
  @IsNumber({}, { message: 'items_count debe ser un número entero' })
  @Min(1, { message: 'items_count debe ser mayor o igual a 1' })
  items_count: number;

  @ApiProperty({
    description: 'Fecha y hora de la orden (ISO 8601)',
    example: '2025-01-16T12:30:00Z',
  })
  @IsDateString({}, { message: 'order_datetime debe ser una fecha válida en formato ISO 8601' })
  @IsNotEmpty({ message: 'La fecha de la orden es requerida' })
  order_datetime: string;

  @ApiPropertyOptional({
    description: 'Método de pago usado',
    enum: PaymentMethodTypeEnum,
    example: PaymentMethodTypeEnum.CASH,
  })
  @IsEnum(PaymentMethodTypeEnum, {
    message:
      'El método de pago debe ser: cash, credit_card, debit_card, digital_wallet, bank_transfer u other',
  })
  @IsOptional()
  payment_method?: PaymentMethodTypeEnum;

  @ApiPropertyOptional({
    description: 'Estado de la orden',
    enum: OrderStatusEnum,
    default: OrderStatusEnum.COMPLETED,
    example: OrderStatusEnum.COMPLETED,
  })
  @IsEnum(OrderStatusEnum, {
    message: 'El estado debe ser: completed, cancelled o refunded',
  })
  @IsOptional()
  status?: OrderStatusEnum;

  @ApiPropertyOptional({
    description: 'Información adicional de la orden (JSON)',
    example: { customer_name: 'Juan Pérez', table_number: 5 },
  })
  @IsObject({ message: 'metadata debe ser un objeto JSON' })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO para respuesta de orden efectiva
 *
 * @description
 * Representa la estructura de respuesta para órdenes efectivas.
 */
export class EffectiveOrderResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Número de orden' })
  order_number: string;

  @ApiProperty({ description: 'Tipo de orden', enum: OrderTypeEnum })
  order_type: OrderTypeEnum;

  @ApiProperty({ description: 'Monto total de la orden' })
  total_amount: number;

  @ApiProperty({ description: 'Monto bruto antes de descuentos' })
  gross_amount: number;

  @ApiProperty({ description: 'Descuentos aplicados' })
  discounts: number;

  @ApiProperty({ description: 'Cantidad de items' })
  items_count: number;

  @ApiProperty({ description: 'Método de pago', enum: PaymentMethodTypeEnum })
  payment_method?: PaymentMethodTypeEnum;

  @ApiProperty({ description: 'Fecha y hora de la orden' })
  order_datetime: Date;

  @ApiProperty({ description: 'Estado de la orden', enum: OrderStatusEnum })
  status: OrderStatusEnum;

  @ApiProperty({ description: 'Metadata adicional' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
