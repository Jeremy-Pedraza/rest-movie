// src/modules/reports/dto/payment-method.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min, IsString, Length } from 'class-validator';

/**
 * Métodos de pago disponibles (REFERENCIA)
 * 
 * @deprecated Este enum se mantiene solo como referencia de tipos comunes.
 * El API ahora acepta cualquier string para payment_method, permitiendo valores
 * originales de Simphony como "Visa Crédito", "Mastercard Débito", "Nequi", etc.
 * 
 * Valores históricos en la BD pueden seguir usando estos valores normalizados.
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
 * **CAMBIO IMPORTANTE (2025-01-27):**
 * El campo `payment_method` ahora acepta cualquier string (1-100 caracteres) en lugar
 * de estar limitado a un enum. Esto permite almacenar valores originales de Simphony
 * sin transformación (ej: "Visa Crédito", "Mastercard Débito", "Nequi", "Efectivo").
 *
 * @example
 * ```typescript
 * // Nuevos valores (desde 2025-01-27)
 * const dto1: CreatePaymentMethodDto = {
 *   payment_method: 'Visa Crédito',
 *   total_amount: 3000.00,
 *   transactions_count: 15,
 * };
 * 
 * const dto2: CreatePaymentMethodDto = {
 *   payment_method: 'Nequi',
 *   total_amount: 1500.50,
 *   transactions_count: 25,
 * };
 * 
 * // Valores legacy (anteriores a 2025-01-27) siguen siendo válidos
 * const dto3: CreatePaymentMethodDto = {
 *   payment_method: 'cash',
 *   total_amount: 2000.00,
 *   transactions_count: 10,
 * };
 * ```
 */
export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Método de pago (valor libre desde Simphony, ej: "Visa Crédito", "Nequi", "Efectivo")',
    example: 'Visa Crédito',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'El método de pago debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El método de pago es requerido' })
  @Length(1, 100, { message: 'El método de pago debe tener entre 1 y 100 caracteres' })
  payment_method: string;

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
 * El campo `payment_method` ahora retorna el valor original almacenado en la BD.
 */
export class PaymentMethodResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ 
    description: 'Método de pago (valor original de Simphony)',
    example: 'Visa Crédito'
  })
  payment_method: string;

  @ApiProperty({ description: 'Monto total recaudado' })
  total_amount: number;

  @ApiProperty({ description: 'Cantidad de transacciones' })
  transactions_count: number;

  @ApiProperty({ description: 'Monto promedio por transacción' })
  average_amount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
