// src/modules/director/dto/update-director.dto.ts

import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDirectorDto } from './create-director.dto';

export class UpdateDirectorDto extends PartialType(CreateDirectorDto) {
  @ApiPropertyOptional({
    description: 'Estado activo del director',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  isActive?: boolean;
}
