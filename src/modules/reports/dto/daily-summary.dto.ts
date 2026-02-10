// src/modules/reports/dto/daily-summary.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

/**
 * DTO para consultar resumen diario por empleados
 *
 * @description
 * Parámetros para obtener el resumen de un día específico
 * con desglose por empleados.
 *
 * @example
 * ```typescript
 * // Query params
 * GET /reports/daily-summary?store_id=xxx&report_date=2026-01-19
 * ```
 */
export class QueryDailySummaryDto {
  @ApiProperty({
    description: 'UUID de la tienda',
    example: '39a85714-3b44-4794-9647-9408709df3aa',
  })
  @IsUUID('4', { message: 'store_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'store_id es requerido' })
  store_id: string;

  @ApiProperty({
    description: 'Fecha del reporte (formato YYYY-MM-DD)',
    example: '2026-01-19',
  })
  @IsDateString({}, { message: 'report_date debe ser una fecha válida en formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'report_date es requerido' })
  report_date: string;
}

/**
 * Resumen de métricas de un empleado individual
 */
export class EmployeeSummaryDto {
  @ApiProperty({
    description: 'ID del empleado en Simphony',
    example: 12345,
  })
  employee_id: number;

  @ApiProperty({
    description: 'Nombre completo del empleado',
    example: 'Juan Pérez',
  })
  employee_name: string;

  @ApiProperty({
    description: 'UUID del reporte',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  report_id: string;

  @ApiProperty({
    description: 'Total de ventas del empleado',
    example: 15234.5,
  })
  total_sales: number;

  @ApiProperty({
    description: 'Total de ingresos (ventas - descuentos)',
    example: 14500.0,
  })
  total_revenue: number;

  @ApiProperty({
    description: 'Cantidad de órdenes procesadas',
    example: 45,
  })
  orders_count: number;

  @ApiProperty({
    description: 'Cantidad total de productos vendidos',
    example: 150,
  })
  total_quantity: number;

  @ApiProperty({
    description: 'Ticket promedio del empleado',
    example: 322.22,
  })
  average_ticket: number;

  @ApiProperty({
    description: 'Total de descuentos aplicados',
    example: 734.5,
  })
  total_discounts: number;

  @ApiProperty({
    description: 'Porcentaje de las ventas totales del día',
    example: 25.5,
  })
  percentage_of_total: number;
}

/**
 * Respuesta del resumen diario con desglose por empleados
 *
 * @description
 * Estructura de respuesta que incluye:
 * - Totales consolidados del día
 * - Desglose por cada empleado
 * - Indicador de si existe reporte consolidado
 *
 * @example
 * ```json
 * {
 *   "store_id": "39a85714-...",
 *   "store_name": "Tienda Centro",
 *   "report_date": "2026-01-19",
 *   "total_employees": 3,
 *   "total_sales_all": 25734.50,
 *   "total_revenue_all": 24500.00,
 *   "total_orders_all": 82,
 *   "average_ticket_all": 313.84,
 *   "has_consolidated": false,
 *   "employees": [...]
 * }
 * ```
 */
export class DailySummaryResponseDto {
  @ApiProperty({
    description: 'UUID de la tienda',
    example: '39a85714-3b44-4794-9647-9408709df3aa',
  })
  store_id: string;

  @ApiPropertyOptional({
    description: 'Nombre de la tienda',
    example: 'Tienda Centro',
  })
  store_name?: string;

  @ApiPropertyOptional({
    description: 'Código de la tienda',
    example: 'TC001',
  })
  store_code?: string;

  @ApiProperty({
    description: 'Fecha del reporte',
    example: '2026-01-19',
  })
  report_date: string;

  @ApiProperty({
    description: 'Cantidad de empleados con reportes en este día',
    example: 3,
  })
  total_employees: number;

  @ApiProperty({
    description: 'Total de ventas sumando todos los empleados',
    example: 25734.5,
  })
  total_sales_all: number;

  @ApiProperty({
    description: 'Total de ingresos sumando todos los empleados',
    example: 24500.0,
  })
  total_revenue_all: number;

  @ApiProperty({
    description: 'Total de órdenes sumando todos los empleados',
    example: 82,
  })
  total_orders_all: number;

  @ApiProperty({
    description: 'Cantidad total de productos vendidos',
    example: 350,
  })
  total_quantity_all: number;

  @ApiProperty({
    description: 'Ticket promedio general del día',
    example: 313.84,
  })
  average_ticket_all: number;

  @ApiProperty({
    description: 'Total de descuentos del día',
    example: 1234.5,
  })
  total_discounts_all: number;

  @ApiProperty({
    description: 'Indica si existe un reporte consolidado (sin employee_id) para este día',
    example: false,
  })
  has_consolidated: boolean;

  @ApiPropertyOptional({
    description: 'UUID del reporte consolidado si existe',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  consolidated_report_id?: string;

  @ApiProperty({
    description: 'Lista de empleados con sus métricas individuales',
    type: [EmployeeSummaryDto],
    isArray: true,
  })
  employees: EmployeeSummaryDto[];

  @ApiProperty({
    description: 'Fecha y hora de generación del resumen',
    example: '2026-01-19T15:30:00.000Z',
  })
  generated_at: Date;
}
