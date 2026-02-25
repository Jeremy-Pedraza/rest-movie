// src/modules/reports/dto/create-report.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
  IsInt,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportTypeEnum } from '../enums';
import { ReportMetadataDto } from './system-metrics.dto';
import { CreateSalesByOrderTypeDto } from './sales-by-order-type.dto';
import { CreatePaymentMethodDto } from './payment-method.dto';
import { CreateDynamicDiscountDto } from './dynamic-discount.dto';
import { CreateAdjustmentDto } from './adjustment.dto';
import { CreateEffectiveOrderDto } from './effective-order.dto';
import { CreateShortageOverageDto } from './shortage-overage.dto';
import { CreateCashSummaryDto } from './cash-summary.dto';
import { CreateEmployeeSalesDto } from './employee-sales.dto';
import { CreateCategorySalesDto } from './category-sales.dto';
import { CreateRevenueCenterSalesDto } from './revenue-center-sales.dto';
import { CreateServiceChargeDto } from './service-charge.dto';
import { CreateIncomeByClassDto } from './income-by-class.dto';
import { CreateIncomeByTenderTypeDto } from './income-by-tender-type.dto';

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
 *   storeId: 'uuid-store',
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
  @IsUUID('4', { message: 'storeId debe ser un UUID válido' })
  @IsNotEmpty({ message: 'storeId es requerido' })
  storeId: string;

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
  // EMPLEADO (OPCIONAL - para reportes individuales)
  // ============================================
  //
  // REGLAS DE NEGOCIO:
  // - Si employee_id es NULL/undefined → Reporte CONSOLIDADO (todos los empleados)
  // - Si employee_id tiene valor → Reporte INDIVIDUAL de ese empleado
  // - employee_name es REQUERIDO cuando employee_id está presente
  //
  // IDEMPOTENCIA:
  // La combinación (storeId + report_date + employee_id) debe ser única.
  // Esto permite múltiples reportes por día: uno por cada empleado.
  // ============================================

  @ApiPropertyOptional({
    description:
      'ID del empleado en Simphony. Si es NULL o no se envía, se considera un reporte consolidado (todos los empleados). ' +
      'Si tiene valor, es un reporte individual de ese empleado específico. ' +
      'IMPORTANTE: La combinación (storeId + report_date + employee_id) debe ser única.',
    example: 12345,
    nullable: true,
  })
  @IsInt({ message: 'employee_id debe ser un número entero' })
  @IsOptional()
  employee_id?: number;

  @ApiPropertyOptional({
    description:
      'Nombre completo del empleado. REQUERIDO cuando employee_id está presente. ' +
      'Se almacena para referencia histórica incluso si el empleado cambia de nombre en Simphony.',
    example: 'Juan Pérez',
    maxLength: 200,
  })
  @ValidateIf((o) => o.employee_id !== undefined && o.employee_id !== null)
  @IsNotEmpty({ message: 'employee_name es requerido cuando employee_id está presente' })
  @IsString({ message: 'employee_name debe ser una cadena de texto' })
  @MaxLength(200, { message: 'employee_name no puede exceder 200 caracteres' })
  @IsOptional()
  employee_name?: string;

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

  @ApiPropertyOptional({
    description: 'Total de cargos por servicio',
    example: 750.0,
    default: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_service_charge debe ser un número con máximo 2 decimales' },
  )
  @IsOptional()
  total_service_charge?: number;

  @ApiPropertyOptional({
    description: 'Total de pagos recibidos (= sum tenders)',
    example: 15000.0,
    default: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_payment debe ser un número con máximo 2 decimales' },
  )
  @IsOptional()
  total_payment?: number;

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
    description:
      'Información adicional del reporte (JSON). ' +
      'Puede incluir systemMetrics con información del agente (CPU, memoria, discos, bases de datos).',
    type: ReportMetadataDto,
    example: {
      source: 'agent',
      version: '2.1.0',
      operator: 'Juan Pérez',
      systemMetrics: {
        cpu: { usage: 45.5, cores: 4 },
        memory: { total: 8589934592, used: 4294967296, free: 4294967296 },
        disks: [{ name: 'C:', total: 500107862016, used: 250053931008, free: 250053931008 }],
        databases: [{ name: 'simphony_db', size: 1073741824, tables: 45, status: 'connected' }],
      },
    },
  })
  @ValidateNested()
  @Type(() => ReportMetadataDto)
  @IsOptional()
  metadata?: ReportMetadataDto;

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

  @ApiPropertyOptional({
    description: 'Faltantes y sobrantes de caja',
    type: [CreateShortageOverageDto],
    isArray: true,
  })
  @IsArray({ message: 'shortage_overage debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateShortageOverageDto)
  @IsOptional()
  shortage_overage?: CreateShortageOverageDto[];

  // ============================================
  // DATOS DE DETALLE v1.1.0 (OPCIONALES)
  // ============================================

  @ApiPropertyOptional({
    description: 'Resumen de efectivo por tender',
    type: [CreateCashSummaryDto],
    isArray: true,
  })
  @IsArray({ message: 'cash_summary debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateCashSummaryDto)
  @IsOptional()
  cash_summary?: CreateCashSummaryDto[];

  @ApiPropertyOptional({
    description: 'Ventas por empleado',
    type: [CreateEmployeeSalesDto],
    isArray: true,
  })
  @IsArray({ message: 'employee_sales debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeSalesDto)
  @IsOptional()
  employee_sales?: CreateEmployeeSalesDto[];

  @ApiPropertyOptional({
    description: 'Ventas por categoría',
    type: [CreateCategorySalesDto],
    isArray: true,
  })
  @IsArray({ message: 'category_sales debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateCategorySalesDto)
  @IsOptional()
  category_sales?: CreateCategorySalesDto[];

  @ApiPropertyOptional({
    description: 'Ventas por revenue center',
    type: [CreateRevenueCenterSalesDto],
    isArray: true,
  })
  @IsArray({ message: 'revenue_center_sales debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateRevenueCenterSalesDto)
  @IsOptional()
  revenue_center_sales?: CreateRevenueCenterSalesDto[];

  @ApiPropertyOptional({
    description: 'Cargos por servicio',
    type: [CreateServiceChargeDto],
    isArray: true,
  })
  @IsArray({ message: 'service_charges debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateServiceChargeDto)
  @IsOptional()
  service_charges?: CreateServiceChargeDto[];

  @ApiPropertyOptional({
    description: 'Ingresos por clase de pago',
    type: [CreateIncomeByClassDto],
    isArray: true,
  })
  @IsArray({ message: 'income_by_class debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateIncomeByClassDto)
  @IsOptional()
  income_by_class?: CreateIncomeByClassDto[];

  @ApiPropertyOptional({
    description: 'Ingresos por tipo de tender',
    type: [CreateIncomeByTenderTypeDto],
    isArray: true,
  })
  @IsArray({ message: 'income_by_tender_type debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateIncomeByTenderTypeDto)
  @IsOptional()
  income_by_tender_type?: CreateIncomeByTenderTypeDto[];
}
