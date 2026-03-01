// src/modules/producer/dto/update-producer.dto.ts

import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProducerDto } from './create-producer.dto';

export class UpdateProducerDto extends PartialType(CreateProducerDto) {
  @ApiPropertyOptional({
    description: 'Estado activo de la productora',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active debe ser un valor booleano' })
  isActive?: boolean;
}
