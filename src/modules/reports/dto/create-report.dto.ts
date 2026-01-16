// src/modules/reports/dto/create-report.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportTypeEnum } from '../enums';
import { CreateSalesByOrderTypeDto } from './sales-by-order-type.dto';
import { CreatePaymentMethodDto } from './payment-method.dto';
import { CreateDynamicDiscountDto } from './dynamic-discount.dto';
import { CreateAdjustmentDto } from './adjustment.dto';
import { CreateEffectiveOrderDto } from './effective-order.dto';

/**
 * Estados de reporte disponibles
 */
export enum ReportStatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * DTO para crear un reporte
 *
 * @description
 * Valida todos los campos necesarios para crear un nuevo reporte.
 * Incluye arrays opcionales para datos de detalle (ventas por tipo, métodos de pago, etc.)
 *
 * Los campos de totales (total_sales, total_revenue, etc.) son opcionales
 * y pueden ser calculados automáticamente a partir de los datos de detalle.
 *
 * @example
 * ```typescript
 * const dto: CreateReportDto = {
 *   store_id: 'uuid-store',
 *   report_date: '2025-01-16',
 *   report_type: ReportTypeEnum.DAILY,
 *   total_sales: 15000.50,
 *   total_revenue: 14500.00,
 *   total_quantity: 250,
 *   orders_count: 45,
 *   sales_by_order_type: [
 *     { order_type: 'dine_in', total_sales: 8000, orders_count: 25, quantity: 150 },
 *     { order_type: 'delivery', total_sales: 7000.50, orders_count: 20, quantity: 100 },
 *   ],
 * };
 * ```
 */
export class CreateReportDto {
  // ============================================
  // IDENTIFICACIÓN
  // ============================================

  @ApiProperty({
    description: 'ID de la tienda que genera el reporte',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'store_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'store_id es requerido' })
  store_id: string;

  @ApiProperty({
    description: 'Fecha del reporte (formato YYYY-MM-DD)',
    example: '2025-01-16',
  })
  @IsDateString({}, { message: 'report_date debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'La fecha del reporte es requerida' })
  report_date: string;

  @ApiPropertyOptional({
    description: 'Tipo de reporte',
    enum: ReportTypeEnum,
    default: ReportTypeEnum.DAILY,
    example: ReportTypeEnum.DAILY,
  })
  @IsEnum(ReportTypeEnum, {
    message: 'El tipo de reporte debe ser: daily, weekly o monthly',
  })
  @IsOptional()
  report_type?: ReportTypeEnum;

  // ============================================
  // MÉTRICAS PRINCIPALES
  // ============================================

  @ApiPropertyOptional({
    description: 'Total de ventas en el período (sin descuentos)',
    example: 15000.5,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_sales debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'total_sales debe ser mayor o igual a 0' })
  @IsOptional()
  total_sales?: number;

  @ApiPropertyOptional({
    description: 'Total de ingresos (ventas - descuentos)',
    example: 14500.0,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_revenue debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'total_revenue debe ser mayor o igual a 0' })
  @IsOptional()
  total_revenue?: number;

  @ApiPropertyOptional({
    description: 'Cantidad total de productos vendidos',
    example: 250,
    minimum: 0,
  })
  @IsNumber({}, { message: 'total_quantity debe ser un número entero' })
  @Min(0, { message: 'total_quantity debe ser mayor o igual a 0' })
  @IsOptional()
  total_quantity?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de órdenes procesadas',
    example: 45,
    minimum: 0,
  })
  @IsNumber({}, { message: 'orders_count debe ser un número entero' })
  @Min(0, { message: 'orders_count debe ser mayor o igual a 0' })
  @IsOptional()
  orders_count?: number;

  @ApiPropertyOptional({
    description: 'Ticket promedio (calculado: revenue / orders_count)',
    example: 322.22,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'average_ticket debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'average_ticket debe ser mayor o igual a 0' })
  @IsOptional()
  average_ticket?: number;

  // ============================================
  // DESCUENTOS Y AJUSTES (TOTALES)
  // ============================================

  @ApiPropertyOptional({
    description: 'Total de descuentos aplicados',
    example: 500.5,
    minimum: 0,
    default: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_discounts debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'total_discounts debe ser mayor o igual a 0' })
  @IsOptional()
  total_discounts?: number;

  @ApiPropertyOptional({
    description: 'Total de ajustes (devoluciones, cancelaciones)',
    example: 150.0,
    default: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_adjustments debe ser un número con máximo 2 decimales' },
  )
  @IsOptional()
  total_adjustments?: number;

  // ============================================
  // METADATA Y ESTADO
  // ============================================

  @ApiPropertyOptional({
    description: 'Estado del reporte',
    enum: ReportStatusEnum,
    default: ReportStatusEnum.PUBLISHED,
    example: ReportStatusEnum.PUBLISHED,
  })
  @IsEnum(ReportStatusEnum, {
    message: 'El estado debe ser: draft, published o archived',
  })
  @IsOptional()
  status?: ReportStatusEnum;

  @ApiPropertyOptional({
    description: 'Información adicional del reporte (JSON)',
    example: { source: 'POS', version: '1.0', operator: 'Juan Pérez' },
  })
  @IsObject({ message: 'metadata debe ser un objeto JSON' })
  @IsOptional()
  metadata?: Record<string, any>;

  // ============================================
  // DATOS DE DETALLE (OPCIONALES)
  // ============================================

  @ApiPropertyOptional({
    description: 'Ventas por tipo de orden',
    type: [CreateSalesByOrderTypeDto],
    isArray: true,
  })
  @IsArray({ message: 'sales_by_order_type debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateSalesByOrderTypeDto)
  @IsOptional()
  sales_by_order_type?: CreateSalesByOrderTypeDto[];

  @ApiPropertyOptional({
    description: 'Métodos de pago utilizados',
    type: [CreatePaymentMethodDto],
    isArray: true,
  })
  @IsArray({ message: 'payment_methods debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentMethodDto)
  @IsOptional()
  payment_methods?: CreatePaymentMethodDto[];

  @ApiPropertyOptional({
    description: 'Descuentos dinámicos aplicados',
    type: [CreateDynamicDiscountDto],
    isArray: true,
  })
  @IsArray({ message: 'dynamic_discounts debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateDynamicDiscountDto)
  @IsOptional()
  dynamic_discounts?: CreateDynamicDiscountDto[];

  @ApiPropertyOptional({
    description: 'Ajustes y devoluciones',
    type: [CreateAdjustmentDto],
    isArray: true,
  })
  @IsArray({ message: 'adjustments debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateAdjustmentDto)
  @IsOptional()
  adjustments?: CreateAdjustmentDto[];

  @ApiPropertyOptional({
    description: 'Órdenes efectivas (detalle de cada orden)',
    type: [CreateEffectiveOrderDto],
    isArray: true,
  })
  @IsArray({ message: 'effective_orders debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateEffectiveOrderDto)
  @IsOptional()
  effective_orders?: CreateEffectiveOrderDto[];
}
