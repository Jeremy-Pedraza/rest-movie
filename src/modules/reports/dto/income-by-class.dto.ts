// src/modules/reports/dto/income-by-class.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Length } from 'class-validator';

export class CreateIncomeByClassDto {
  @ApiProperty({ description: 'Clase de pago', example: 'Cash' })
  @IsString({ message: 'class_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'class_name es requerido' })
  @Length(1, 100, { message: 'class_name debe tener entre 1 y 100 caracteres' })
  class_name: string;

  @ApiProperty({ description: 'Nombre de la moneda', example: 'US Dollar' })
  @IsString({ message: 'currency_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'currency_name es requerido' })
  @Length(1, 100, { message: 'currency_name debe tener entre 1 y 100 caracteres' })
  currency_name: string;

  @ApiProperty({ description: 'Símbolo de la moneda', example: '$' })
  @IsString({ message: 'currency_symbol debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'currency_symbol es requerido' })
  @Length(1, 10, { message: 'currency_symbol debe tener entre 1 y 10 caracteres' })
  currency_symbol: string;

  @ApiProperty({ description: 'Cantidad de transacciones', example: 30 })
  @IsInt({ message: 'transaction_count debe ser un número entero' })
  transaction_count: number;

  @ApiProperty({ description: 'Monto total', example: 15000.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_amount debe ser un número con máximo 2 decimales' },
  )
  total_amount: number;
}

export class IncomeByClassResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Clase de pago' })
  class_name: string;

  @ApiProperty({ description: 'Nombre de la moneda' })
  currency_name: string;

  @ApiProperty({ description: 'Símbolo de la moneda' })
  currency_symbol: string;

  @ApiProperty({ description: 'Cantidad de transacciones' })
  transaction_count: number;

  @ApiProperty({ description: 'Monto total' })
  total_amount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
