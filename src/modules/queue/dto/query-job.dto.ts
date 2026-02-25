import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@shared/common';

/**
 * @enum JobStatus
 * @description Estados posibles de un job en Bull
 */
export enum JobStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  ACTIVE = 'active',
  WAITING = 'waiting',
  PAUSED = 'paused',
}

/**
 * @class QueryJobDto
 * @description DTO para filtrar jobs en las colas
 */
export class QueryJobDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Estado del job',
    enum: JobStatus,
    example: JobStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(JobStatus, { message: 'Estado de job inválido' })
  status?: JobStatus;

  @ApiPropertyOptional({
    description: 'Nombre del job',
    example: 'send-email',
  })
  @IsOptional()
  @IsString({ message: 'El nombre del job debe ser un string' })
  jobName?: string;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number = 10;
}
