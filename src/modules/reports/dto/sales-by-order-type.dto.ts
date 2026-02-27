// src/modules/reports/dto/sales-by-order-type.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min, IsString, Length } from 'class-validator';

/**
 * Tipos de orden disponibles (REFERENCIA)
 *
 * @deprecated Este enum se mantiene solo como referencia de tipos comunes.
 * El API ahora acepta cualquier string para order_type, permitiendo valores
 * originales de Simphony como "Mesa VIP", "Domicilios Rappi", etc.
 *
 * Valores históricos en la BD pueden seguir usando estos valores normalizados.
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
 * **CAMBIO IMPORTANTE (2025-01-27):**
 * El campo `order_type` ahora acepta cualquier string (1-100 caracteres) en lugar
 * de estar limitado a un enum. Esto permite almacenar valores originales de Simphony
 * sin transformación (ej: "Mesa VIP", "Domicilios Rappi", "Para Llevar Express").
 *
 * @example
 * ```typescript
 * // Nuevos valores (desde 2025-01-27)
 * const dto1: CreateSalesByOrderTypeDto = {
 *   order_type: 'Mesa VIP',
 *   total_sales: 5000.50,
 *   orders_count: 25,
 *   quantity: 100,
 * };
 *
 * const dto2: CreateSalesByOrderTypeDto = {
 *   order_type: 'Domicilios Rappi',
 *   total_sales: 3000.00,
 *   orders_count: 40,
 *   quantity: 150,
 * };
 *
 * // Valores legacy (anteriores a 2025-01-27) siguen siendo válidos
 * const dto3: CreateSalesByOrderTypeDto = {
 *   order_type: 'dine_in',
 *   total_sales: 2000.00,
 *   orders_count: 15,
 *   quantity: 50,
 * };
 * ```
 */
export class CreateSalesByOrderTypeDto {
  @ApiProperty({
    description:
      'Tipo de orden (valor libre desde Simphony, ej: "Mesa VIP", "Domicilios", "Para Llevar")',
    example: 'Mesa VIP',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'El tipo de orden debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo de orden es requerido' })
  @Length(1, 100, { message: 'El tipo de orden debe tener entre 1 y 100 caracteres' })
  order_type: string;

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

  @ApiPropertyOptional({
    description: 'Porcentaje de ventas netas respecto al total del reporte',
    example: 45.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'net_percentage debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'net_percentage debe ser mayor o igual a 0' })
  @IsOptional()
  net_percentage?: number;

  @ApiPropertyOptional({
    description: 'Porcentaje de cantidad de órdenes respecto al total del reporte',
    example: 38.2,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'quantity_percentage debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'quantity_percentage debe ser mayor o igual a 0' })
  @IsOptional()
  quantity_percentage?: number;
}

/**
 * DTO para respuesta de ventas por tipo de orden
 *
 * @description
 * Representa la estructura de respuesta para ventas por tipo de orden.
 * El campo `order_type` ahora retorna el valor original almacenado en la BD.
 */
export class SalesByOrderTypeResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({
    description: 'Tipo de orden (valor original de Simphony)',
    example: 'Mesa VIP',
  })
  order_type: string;

  @ApiProperty({ description: 'Total de ventas' })
  total_sales: number;

  @ApiProperty({ description: 'Cantidad de órdenes' })
  orders_count: number;

  @ApiProperty({ description: 'Cantidad de productos' })
  quantity: number;

  @ApiProperty({ description: 'Ticket promedio' })
  average_ticket: number;

  @ApiProperty({ description: 'Porcentaje de ventas netas respecto al total' })
  net_percentage: number;

  @ApiProperty({ description: 'Porcentaje de cantidad de órdenes respecto al total' })
  quantity_percentage: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
