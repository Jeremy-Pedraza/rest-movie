// src/modules/reports/dto/service-charge.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Length } from 'class-validator';

export class CreateServiceChargeDto {
  @ApiProperty({ description: 'Nombre del service charge', example: 'Propina Sugerida 10%' })
  @IsString({ message: 'service_charge_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'service_charge_name es requerido' })
  @Length(1, 200, { message: 'service_charge_name debe tener entre 1 y 200 caracteres' })
  service_charge_name: string;

  @ApiProperty({ description: 'Cantidad', example: 45 })
  @IsInt({ message: 'quantity debe ser un número entero' })
  quantity: number;

  @ApiProperty({ description: 'Monto total', example: 2250.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_amount debe ser un número con máximo 2 decimales' },
  )
  total_amount: number;
}

export class ServiceChargeResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Nombre del service charge' })
  service_charge_name: string;

  @ApiProperty({ description: 'Cantidad' })
  quantity: number;

  @ApiProperty({ description: 'Monto total' })
  total_amount: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
