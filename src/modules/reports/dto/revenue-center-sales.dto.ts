// src/modules/reports/dto/revenue-center-sales.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Length } from 'class-validator';

export class CreateRevenueCenterSalesDto {
  @ApiProperty({ description: 'ID del revenue center en Simphony', example: 1 })
  @IsInt({ message: 'revenue_center_id debe ser un número entero' })
  revenue_center_id: number;

  @ApiProperty({ description: 'Nombre del revenue center', example: 'Restaurante Principal' })
  @IsString({ message: 'revenue_center_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'revenue_center_name es requerido' })
  @Length(1, 200, { message: 'revenue_center_name debe tener entre 1 y 200 caracteres' })
  revenue_center_name: string;

  @ApiProperty({ description: 'Cantidad de checks', example: 80 })
  @IsInt({ message: 'total_checks debe ser un número entero' })
  total_checks: number;

  @ApiProperty({ description: 'Ventas totales', example: 25000.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_sales debe ser un número con máximo 2 decimales' },
  )
  total_sales: number;

  @ApiProperty({ description: 'Ticket promedio', example: 312.5 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'average_ticket debe ser un número con máximo 2 decimales' },
  )
  average_ticket: number;
}

export class RevenueCenterSalesResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'ID del revenue center' })
  revenue_center_id: number;

  @ApiProperty({ description: 'Nombre del revenue center' })
  revenue_center_name: string;

  @ApiProperty({ description: 'Cantidad de checks' })
  total_checks: number;

  @ApiProperty({ description: 'Ventas totales' })
  total_sales: number;

  @ApiProperty({ description: 'Ticket promedio' })
  average_ticket: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
