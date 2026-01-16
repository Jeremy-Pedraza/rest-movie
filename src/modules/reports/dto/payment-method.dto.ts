// src/modules/reports/dto/payment-method.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

/**
 * Métodos de pago disponibles
 */
export enum PaymentMethodTypeEnum {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  DIGITAL_WALLET = 'digital_wallet',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other',
}

/**
 * DTO para crear método de pago
 *
 * @description
 * Valida los campos para registrar el desglose de ventas por método de pago.
 * Usado dentro de CreateReportDto para el array payment_methods.
 *
 * @example
 * ```typescript
 * const dto: CreatePaymentMethodDto = {
 *   payment_method: 'cash',
 *   total_amount: 3000.00,
 *   transactions_count: 15,
 * };
 * ```
 */
export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Método de pago',
    enum: PaymentMethodTypeEnum,
    example: PaymentMethodTypeEnum.CASH,
  })
  @IsEnum(PaymentMethodTypeEnum, {
    message:
      'El método de pago debe ser: cash, credit_card, debit_card, digital_wallet, bank_transfer u other',
  })
  @IsNotEmpty({ message: 'El método de pago es requerido' })
  payment_method: PaymentMethodTypeEnum;

  @ApiProperty({
    description: 'Monto total recaudado con este método',
    example: 3000.0,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_amount debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'total_amount debe ser mayor o igual a 0' })
  total_amount: number;

  @ApiProperty({
    description: 'Cantidad de transacciones con este método',
    example: 15,
    minimum: 0,
  })
  @IsNumber({}, { message: 'transactions_count debe ser un número entero' })
  @Min(0, { message: 'transactions_count debe ser mayor o igual a 0' })
  transactions_count: number;

  @ApiPropertyOptional({
    description: 'Monto promedio por transacción (calculado automáticamente)',
    example: 200.0,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'average_amount debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'average_amount debe ser mayor o igual a 0' })
  @IsOptional()
  average_amount?: number;
}

/**
 * DTO para respuesta de método de pago
 *
 * @description
 * Representa la estructura de respuesta para métodos de pago.
 */
export class PaymentMethodResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Método de pago', enum: PaymentMethodTypeEnum })
  payment_method: PaymentMethodTypeEnum;

  @ApiProperty({ description: 'Monto total recaudado' })
  total_amount: number;

  @ApiProperty({ description: 'Cantidad de transacciones' })
  transactions_count: number;

  @ApiProperty({ description: 'Monto promedio por transacción' })
  average_amount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
