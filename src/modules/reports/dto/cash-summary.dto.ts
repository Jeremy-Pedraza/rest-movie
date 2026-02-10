// src/modules/reports/dto/cash-summary.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Length } from 'class-validator';

export class CreateCashSummaryDto {
  @ApiProperty({ description: 'Nombre del tender efectivo', example: 'Cash' })
  @IsString({ message: 'tender_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'tender_name es requerido' })
  @Length(1, 100, { message: 'tender_name debe tener entre 1 y 100 caracteres' })
  tender_name: string;

  @ApiProperty({ description: 'Cantidad de transacciones', example: 15 })
  @IsInt({ message: 'quantity debe ser un número entero' })
  quantity: number;

  @ApiProperty({ description: 'Monto total', example: 5000.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_amount debe ser un número con máximo 2 decimales' },
  )
  total_amount: number;
}

export class CashSummaryResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Nombre del tender' })
  tender_name: string;

  @ApiProperty({ description: 'Cantidad de transacciones' })
  quantity: number;

  @ApiProperty({ description: 'Monto total' })
  total_amount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
