// src/shared/common/dto/query-params.dto.ts
import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from './pagination.dto';
import { toBoolean } from '@shared/utils';

/**
 * QueryParamsDto - DTO base para parámetros de consulta
 *
 * Extiende PaginationDto y añade campos comunes de búsqueda y filtrado.
 * Los módulos específicos deben extender esta clase.
 *
 * @example
 * ```typescript
 * export class QueryProductDto extends QueryParamsDto {
 *   @IsOptional()
 *   @IsUUID()
 *   categoryId?: string;
 * }
 * ```
 */
export class QueryParamsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Término de búsqueda (aplica a campos de texto)',
    example: 'john',
  })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser texto' })
  @Transform(({ value }): string | undefined => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return undefined;
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'isActive debe ser verdadero o falso' })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar registros creados desde esta fecha (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'createdFrom debe ser una fecha válida ISO 8601' })
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filtrar registros creados hasta esta fecha (ISO 8601)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'createdTo debe ser una fecha válida ISO 8601' })
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Incluir registros eliminados (soft deleted)',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'withDeleted debe ser verdadero o falso' })
  withDeleted?: boolean = false;
}

/**
 * IdParamDto - DTO para validar parámetros de ID en rutas
 *
 * @example
 * ```typescript
 * @Get(':id')
 * async findOne(@Param() params: IdParamDto) {
 *   return this.service.findById(params.id);
 * }
 * ```
 */
export class IdParamDto {
  @ApiPropertyOptional({
    description: 'ID del recurso (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  id: string;
}

/**
 * IdsBodyDto - DTO para operaciones en lote con múltiples IDs
 *
 * @example
 * ```typescript
 * @Post('bulk-delete')
 * async bulkDelete(@Body() body: IdsBodyDto) {
 *   return this.service.deleteMany(body.ids);
 * }
 * ```
 */
export class IdsBodyDto {
  @ApiPropertyOptional({
    description: 'Lista de IDs (UUIDs)',
    example: ['uuid1', 'uuid2', 'uuid3'],
    isArray: true,
  })
  @IsString({ each: true, message: 'Cada ID debe ser texto' })
  ids: string[];
}
