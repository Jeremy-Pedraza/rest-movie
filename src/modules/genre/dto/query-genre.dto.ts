// src/modules/genre/dto/query-genre.dto.ts

import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { PaginationDto } from '@shared/common';
import { toBoolean } from '@shared/utils/helpers/transform.helper';

export class QueryGenreDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Buscar por nombre',
    example: 'accion',
  })
  @IsOptional()
  @IsString({ message: 'El campo de busqueda debe ser texto' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  isActive?: boolean;
}
