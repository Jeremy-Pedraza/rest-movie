// src/shared/common/dto/pagination.dto.ts
import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Enumeración para el orden de clasificación
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * PaginationDto - DTO base para paginación
 *
 * TODOS los query DTOs deben extender esta clase.
 *
 * @example
 * ```typescript
 * export class QueryUserDto extends PaginationDto {
 *   @IsOptional()
 *   @IsString()
 *   search?: string;
 * }
 * ```
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Número de página (1-indexed)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de items por página',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1' })
  @Max(100, { message: 'El límite debe ser menor o igual a 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'El campo de ordenamiento debe ser texto' })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: SortOrder,
    default: SortOrder.DESC,
    example: 'DESC',
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'El orden debe ser ASC o DESC' })
  sortOrder?: SortOrder = SortOrder.DESC;

  /**
   * Calcula el offset para la query SQL
   */
  get offset(): number {
    const currentPage = this.page ?? 1;
    const currentLimit = this.limit ?? 10;
    return (currentPage - 1) * currentLimit;
  }
}

/**
 * PaginatedResponseDto - DTO para respuestas paginadas en Swagger
 *
 * Usado con @ApiExtraModels para documentación de Swagger.
 */
export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({
    description: 'Lista de items',
    isArray: true,
  })
  data: T[];

  @ApiPropertyOptional({
    description: 'Metadatos de paginación',
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
      hasNextPage: true,
      hasPrevPage: false,
    },
  })
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * PaginationMetaDto - DTO para los metadatos de paginación
 */
export class PaginationMetaDto {
  @ApiPropertyOptional({ description: 'Página actual', example: 1 })
  page: number;

  @ApiPropertyOptional({ description: 'Items por página', example: 10 })
  limit: number;

  @ApiPropertyOptional({ description: 'Total de items', example: 100 })
  total: number;

  @ApiPropertyOptional({ description: 'Total de páginas', example: 10 })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Hay página siguiente', example: true })
  hasNextPage: boolean;

  @ApiPropertyOptional({ description: 'Hay página anterior', example: false })
  hasPrevPage: boolean;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPrevPage = page > 1;
  }
}
