// src/modules/reports/dto/shortage-overage.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length, IsDateString } from 'class-validator';

/**
 * DTO para crear registro de faltante/sobrante de caja
 *
 * @description
 * Valida los campos para registrar varianzas en conteos de caja (shortage/overage).
 * Usado dentro de CreateReportDto para el array shortage_overage.
 *
 * @example
 * ```typescript
 * const dto: CreateShortageOverageDto = {
 *   receptacle_type: 'till',
 *   receptacle_name: 'Caja Restaurante 1',
 *   employee_id: 149453,
 *   employee_name: 'Juan Pérez',
 *   counted_at: '2026-01-19T23:38:38Z',
 *   expected_amount: 369669.0,
 *   counted_amount: 370000.0,
 *   variance_amount: 331.0,
 *   variance_type: 'overage',
 *   class_name: 'Efectivo',
 *   currency: '$ Pesos',
 * };
 * ```
 */
export class CreateShortageOverageDto {
  @ApiProperty({
    description: 'Tipo de receptáculo (till=caja, safe=caja fuerte, other=otro)',
    example: 'till',
    minLength: 1,
    maxLength: 50,
  })
  @IsString({ message: 'receptacle_type debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'receptacle_type es requerido' })
  @Length(1, 50, { message: 'receptacle_type debe tener entre 1 y 50 caracteres' })
  receptacle_type: string;

  @ApiProperty({
    description: 'Nombre del receptáculo',
    example: 'Caja Restaurante 1',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'receptacle_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'receptacle_name es requerido' })
  @Length(1, 100, { message: 'receptacle_name debe tener entre 1 y 100 caracteres' })
  receptacle_name: string;

  @ApiProperty({
    description: 'ID del empleado responsable del conteo',
    example: 149453,
  })
  @IsNumber({}, { message: 'employee_id debe ser un número entero' })
  @IsNotEmpty({ message: 'employee_id es requerido' })
  employee_id: number;

  @ApiProperty({
    description: 'Nombre del empleado responsable',
    example: 'Juan Pérez',
    minLength: 1,
    maxLength: 200,
  })
  @IsString({ message: 'employee_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'employee_name es requerido' })
  @Length(1, 200, { message: 'employee_name debe tener entre 1 y 200 caracteres' })
  employee_name: string;

  @ApiProperty({
    description: 'Fecha y hora del conteo (formato ISO 8601)',
    example: '2026-01-19T23:38:38Z',
  })
  @IsDateString({}, { message: 'counted_at debe ser una fecha válida en formato ISO 8601' })
  @IsNotEmpty({ message: 'counted_at es requerido' })
  counted_at: string;

  @ApiProperty({
    description: 'Monto esperado en caja',
    example: 369669.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'expected_amount debe ser un número con máximo 2 decimales' },
  )
  @IsNotEmpty({ message: 'expected_amount es requerido' })
  expected_amount: number;

  @ApiProperty({
    description: 'Monto contado en caja',
    example: 370000.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'counted_amount debe ser un número con máximo 2 decimales' },
  )
  @IsNotEmpty({ message: 'counted_amount es requerido' })
  counted_amount: number;

  @ApiProperty({
    description: 'Varianza (diferencia). Positivo=sobrante, Negativo=faltante',
    example: 331.0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'variance_amount debe ser un número con máximo 2 decimales' },
  )
  @IsNotEmpty({ message: 'variance_amount es requerido' })
  variance_amount: number;

  @ApiProperty({
    description: 'Tipo de varianza: shortage (faltante) u overage (sobrante)',
    example: 'overage',
    minLength: 1,
    maxLength: 20,
  })
  @IsString({ message: 'variance_type debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'variance_type es requerido' })
  @Length(1, 20, { message: 'variance_type debe tener entre 1 y 20 caracteres' })
  variance_type: string;

  @ApiPropertyOptional({
    description: 'Razón de la discrepancia',
    example: 'Error de cambio',
    maxLength: 500,
  })
  @IsString({ message: 'reason debe ser una cadena de texto' })
  @Length(0, 500, { message: 'reason debe tener máximo 500 caracteres' })
  @IsOptional()
  reason?: string;

  @ApiProperty({
    description: 'Clase de dinero (efectivo, monedas, etc.)',
    example: 'Efectivo',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'class_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'class_name es requerido' })
  @Length(1, 100, { message: 'class_name debe tener entre 1 y 100 caracteres' })
  class_name: string;

  @ApiProperty({
    description: 'Moneda',
    example: '$ Pesos',
    minLength: 1,
    maxLength: 50,
  })
  @IsString({ message: 'currency debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'currency es requerido' })
  @Length(1, 50, { message: 'currency debe tener entre 1 y 50 caracteres' })
  currency: string;
}

/**
 * DTO para respuesta de faltante/sobrante de caja
 */
export class ShortageOverageResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'Tipo de receptáculo' })
  receptacle_type: string;

  @ApiProperty({ description: 'Nombre del receptáculo' })
  receptacle_name: string;

  @ApiProperty({ description: 'ID del empleado' })
  employee_id: number;

  @ApiProperty({ description: 'Nombre del empleado' })
  employee_name: string;

  @ApiProperty({ description: 'Fecha y hora del conteo' })
  counted_at: Date;

  @ApiProperty({ description: 'Monto esperado' })
  expected_amount: number;

  @ApiProperty({ description: 'Monto contado' })
  counted_amount: number;

  @ApiProperty({ description: 'Varianza (diferencia)' })
  variance_amount: number;

  @ApiProperty({ description: 'Tipo de varianza' })
  variance_type: string;

  @ApiProperty({ description: 'Razón de la discrepancia' })
  reason?: string;

  @ApiProperty({ description: 'Clase de dinero' })
  class_name: string;

  @ApiProperty({ description: 'Moneda' })
  currency: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
