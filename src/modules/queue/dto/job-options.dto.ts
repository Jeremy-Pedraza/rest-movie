import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * @enum JobPriority
 * @description Niveles de prioridad para jobs en la cola
 */
export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  URGENT = 10,
}

/**
 * @enum BackoffType
 * @description Tipos de estrategia de backoff para reintentos
 */
export enum BackoffType {
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed',
}

/**
 * @class BackoffOptionsDto
 * @description DTO para configurar estrategia de backoff en reintentos
 */
export class BackoffOptionsDto {
  @ApiProperty({
    description: 'Tipo de backoff',
    enum: BackoffType,
    example: BackoffType.EXPONENTIAL,
  })
  @IsEnum(BackoffType)
  @IsNotEmpty({ message: 'El tipo de backoff es requerido' })
  type: BackoffType;

  @ApiProperty({
    description: 'Delay inicial en milisegundos',
    example: 1000,
    minimum: 100,
    maximum: 60000,
  })
  @IsInt({ message: 'El delay debe ser un número entero' })
  @Min(100, { message: 'El delay mínimo es 100ms' })
  @Max(60000, { message: 'El delay máximo es 60000ms (1 minuto)' })
  delay: number;
}

/**
 * @class JobOptionsDto
 * @description DTO para configurar opciones de un job en Bull
 * @example
 * {
 *   attempts: 3,
 *   priority: JobPriority.HIGH,
 *   delay: 5000,
 *   backoff: {
 *     type: BackoffType.EXPONENTIAL,
 *     delay: 1000
 *   },
 *   removeOnComplete: true,
 *   removeOnFail: false
 * }
 */
export class JobOptionsDto {
  @ApiPropertyOptional({
    description: 'Número de intentos antes de marcar como fallido',
    example: 3,
    default: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt({ message: 'Los intentos deben ser un número entero' })
  @Min(1, { message: 'Mínimo 1 intento' })
  @Max(10, { message: 'Máximo 10 intentos' })
  attempts?: number;

  @ApiPropertyOptional({
    description: 'Prioridad del job',
    enum: JobPriority,
    example: JobPriority.NORMAL,
    default: JobPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(JobPriority, { message: 'Prioridad inválida' })
  priority?: JobPriority;

  @ApiPropertyOptional({
    description: 'Delay antes de ejecutar el job (en milisegundos)',
    example: 0,
    default: 0,
    minimum: 0,
    maximum: 86400000,
  })
  @IsOptional()
  @IsInt({ message: 'El delay debe ser un número entero' })
  @Min(0, { message: 'El delay no puede ser negativo' })
  @Max(86400000, { message: 'El delay máximo es 86400000ms (24 horas)' })
  delay?: number;

  @ApiPropertyOptional({
    description: 'Configuración de backoff para reintentos',
    type: BackoffOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BackoffOptionsDto)
  backoff?: BackoffOptionsDto;

  @ApiPropertyOptional({
    description: 'Eliminar job al completarse',
    example: true,
    default: true,
  })
  @IsOptional()
  removeOnComplete?: boolean;

  @ApiPropertyOptional({
    description: 'Eliminar job al fallar',
    example: false,
    default: false,
  })
  @IsOptional()
  removeOnFail?: boolean;

  @ApiPropertyOptional({
    description: 'Timeout del job en milisegundos',
    example: 30000,
    minimum: 1000,
    maximum: 300000,
  })
  @IsOptional()
  @IsInt({ message: 'El timeout debe ser un número entero' })
  @Min(1000, { message: 'El timeout mínimo es 1000ms (1 segundo)' })
  @Max(300000, { message: 'El timeout máximo es 300000ms (5 minutos)' })
  timeout?: number;
}

/**
 * @class AddJobDto
 * @description DTO genérico para agregar un job a la cola
 */
export class AddJobDto<T = any> {
  @ApiProperty({
    description: 'Nombre del job',
    example: 'send-email',
  })
  @IsString({ message: 'El nombre del job debe ser un string' })
  @IsNotEmpty({ message: 'El nombre del job es requerido' })
  jobName: string;

  @ApiProperty({
    description: 'Datos del job',
    example: { email: 'user@example.com', subject: 'Welcome' },
  })
  @IsObject({ message: 'Los datos del job deben ser un objeto' })
  @IsNotEmpty({ message: 'Los datos del job son requeridos' })
  data: T;

  @ApiPropertyOptional({
    description: 'Opciones del job',
    type: JobOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => JobOptionsDto)
  options?: JobOptionsDto;
}

/**
 * @class CleanJobsDto
 * @description DTO para limpiar jobs de la cola
 */
export class CleanJobsDto {
  @ApiProperty({
    description: 'Tiempo de gracia en milisegundos',
    example: 5000,
    minimum: 0,
    maximum: 86400000,
  })
  @IsInt({ message: 'El grace period debe ser un número entero' })
  @Min(0, { message: 'El grace period no puede ser negativo' })
  @Max(86400000, { message: 'El grace period máximo es 86400000ms (24 horas)' })
  grace: number;

  @ApiPropertyOptional({
    description: 'Tipo de jobs a limpiar',
    enum: ['completed', 'failed', 'delayed', 'active', 'wait'],
    example: 'completed',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Límite de jobs a limpiar',
    example: 100,
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @IsInt({ message: 'El límite debe ser un número entero' })
  @IsPositive({ message: 'El límite debe ser positivo' })
  @Max(10000, { message: 'El límite máximo es 10000' })
  limit?: number;
}
