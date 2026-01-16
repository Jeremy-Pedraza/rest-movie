// src/modules/reports/dto/sales-by-order-type.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

/**
 * Tipos de orden disponibles
 */
export enum OrderTypeEnum {
  DINE_IN = 'dine_in',
  TAKEOUT = 'takeout',
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

/**
 * DTO para crear ventas por tipo de orden
 *
 * @description
 * Valida los campos para registrar ventas desglosadas por tipo de orden.
 * Usado dentro de CreateReportDto para el array sales_by_order_type.
 *
 * @example
 * ```typescript
 * const dto: CreateSalesByOrderTypeDto = {
 *   order_type: 'dine_in',
 *   total_sales: 5000.50,
 *   orders_count: 25,
 *   quantity: 100,
 * };
 * ```
 */
export class CreateSalesByOrderTypeDto {
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
    description: 'Total de ventas para este tipo de orden',
    example: 5000.5,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_sales debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'total_sales debe ser mayor o igual a 0' })
  total_sales: number;

  @ApiProperty({
    description: 'Cantidad de órdenes de este tipo',
    example: 25,
    minimum: 0,
  })
  @IsNumber({}, { message: 'orders_count debe ser un número entero' })
  @Min(0, { message: 'orders_count debe ser mayor o igual a 0' })
  orders_count: number;

  @ApiPropertyOptional({
    description: 'Cantidad de productos vendidos en este tipo de orden',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsNumber({}, { message: 'quantity debe ser un número entero' })
  @Min(0, { message: 'quantity debe ser mayor o igual a 0' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Ticket promedio para este tipo de orden (calculado automáticamente)',
    example: 200.02,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'average_ticket debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'average_ticket debe ser mayor o igual a 0' })
  @IsOptional()
  average_ticket?: number;
}

/**
 * DTO para respuesta de ventas por tipo de orden
 *
 * @description
 * Representa la estructura de respuesta para ventas por tipo de orden.
 */
export class SalesByOrderTypeResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Tipo de orden', enum: OrderTypeEnum })
  order_type: OrderTypeEnum;

  @ApiProperty({ description: 'Total de ventas' })
  total_sales: number;

  @ApiProperty({ description: 'Cantidad de órdenes' })
  orders_count: number;

  @ApiProperty({ description: 'Cantidad de productos' })
  quantity: number;

  @ApiProperty({ description: 'Ticket promedio' })
  average_ticket: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
