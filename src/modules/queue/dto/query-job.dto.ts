import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
export class QueryJobDto {
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
    description: 'Página actual',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number;

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
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number;
}
