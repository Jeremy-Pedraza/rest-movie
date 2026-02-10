// src/modules/reports/dto/category-sales.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsInt, Length } from 'class-validator';

export class CreateCategorySalesDto {
  @ApiProperty({ description: 'ID de la categoría en Simphony', example: 101 })
  @IsInt({ message: 'category_id debe ser un número entero' })
  category_id: number;

  @ApiProperty({ description: 'Nombre de la categoría', example: 'Bebidas' })
  @IsString({ message: 'category_name debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'category_name es requerido' })
  @Length(1, 200, { message: 'category_name debe tener entre 1 y 200 caracteres' })
  category_name: string;

  @ApiProperty({ description: 'Items vendidos', example: 150 })
  @IsInt({ message: 'items_sold debe ser un número entero' })
  items_sold: number;

  @ApiProperty({ description: 'Ventas totales', example: 4500.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'total_sales debe ser un número con máximo 2 decimales' },
  )
  total_sales: number;
}

export class CategorySalesResponseDto {
  @ApiProperty({ description: 'ID único del registro' })
  id: string;

  @ApiProperty({ description: 'ID del reporte padre' })
  report_header_id: string;

  @ApiProperty({ description: 'ID de la categoría' })
  category_id: number;

  @ApiProperty({ description: 'Nombre de la categoría' })
  category_name: string;

  @ApiProperty({ description: 'Items vendidos' })
  items_sold: number;

  @ApiProperty({ description: 'Ventas totales' })
  total_sales: number;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: Date;
}
