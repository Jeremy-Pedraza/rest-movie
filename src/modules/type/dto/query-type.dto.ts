// src/modules/type/dto/query-type.dto.ts

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from '@shared/common';

export class QueryTypeDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Buscar por nombre',
    example: 'pelicula',
  })
  @IsOptional()
  @IsString({ message: 'El campo de busqueda debe ser texto' })
  search?: string;
}
