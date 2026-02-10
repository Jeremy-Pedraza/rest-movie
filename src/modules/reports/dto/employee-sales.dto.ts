// src/modules/reports/dto/employee-sales.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Length } from 'class-validator';

export class CreateEmployeeSalesDto {
  @ApiProperty({ description: 'ID del empleado en Simphony', example: 12345 })
  @IsInt({ message: 'employee_id debe ser un número entero' })
  employee_id: number;

  @ApiProperty({ description: 'Nombre del empleado', example: 'Juan Pérez' })
  @IsString({ message: 'employee_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'employee_name es requerido' })
  @Length(1, 200, { message: 'employee_name debe tener entre 1 y 200 caracteres' })
  employee_name: string;

  @ApiProperty({ description: 'Cantidad de checks', example: 25 })
  @IsInt({ message: 'total_checks debe ser un número entero' })
  total_checks: number;

  @ApiProperty({ description: 'Ventas brutas', example: 8500.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'gross_sales debe ser un número con máximo 2 decimales' },
  )
  gross_sales: number;

  @ApiProperty({ description: 'Total impuestos', example: 1360.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_tax debe ser un número con máximo 2 decimales' },
  )
  total_tax: number;

  @ApiProperty({ description: 'Ventas netas', example: 7140.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'net_sales debe ser un número con máximo 2 decimales' },
  )
  net_sales: number;

  @ApiProperty({ description: 'Ticket promedio', example: 340.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'average_ticket debe ser un número con máximo 2 decimales' },
  )
  average_ticket: number;
}

export class EmployeeSalesResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'ID del empleado' })
  employee_id: number;

  @ApiProperty({ description: 'Nombre del empleado' })
  employee_name: string;

  @ApiProperty({ description: 'Cantidad de checks' })
  total_checks: number;

  @ApiProperty({ description: 'Ventas brutas' })
  gross_sales: number;

  @ApiProperty({ description: 'Total impuestos' })
  total_tax: number;

  @ApiProperty({ description: 'Ventas netas' })
  net_sales: number;

  @ApiProperty({ description: 'Ticket promedio' })
  average_ticket: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
