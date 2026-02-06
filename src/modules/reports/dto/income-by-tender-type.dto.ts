// src/modules/reports/dto/income-by-tender-type.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Length } from 'class-validator';

export class CreateIncomeByTenderTypeDto {
  @ApiProperty({ description: 'Tipo agrupado (Efectivo/Tarjetas/Otros)', example: 'Efectivo' })
  @IsString({ message: 'tender_type debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'tender_type es requerido' })
  @Length(1, 100, { message: 'tender_type debe tener entre 1 y 100 caracteres' })
  tender_type: string;

  @ApiProperty({ description: 'Nombre del tender', example: 'Cash' })
  @IsString({ message: 'tender_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'tender_name es requerido' })
  @Length(1, 200, { message: 'tender_name debe tener entre 1 y 200 caracteres' })
  tender_name: string;

  @ApiProperty({ description: 'Cantidad de transacciones', example: 20 })
  @IsInt({ message: 'transaction_count debe ser un número entero' })
  transaction_count: number;

  @ApiProperty({ description: 'Monto total', example: 10000.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_amount debe ser un número con máximo 2 decimales' },
  )
  total_amount: number;
}

export class IncomeByTenderTypeResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Tipo agrupado' })
  tender_type: string;

  @ApiProperty({ description: 'Nombre del tender' })
  tender_name: string;

  @ApiProperty({ description: 'Cantidad de transacciones' })
  transaction_count: number;

  @ApiProperty({ description: 'Monto total' })
  total_amount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
