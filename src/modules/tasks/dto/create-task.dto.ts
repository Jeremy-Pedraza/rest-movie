/**
 * @fileoverview DTO para crear/configurar una tarea programada
 * @module modules/tasks/dto
 *
 * ⚠️ NOTA: Este DTO es para configuración dinámica de tareas,
 * no para crear nuevos tipos de jobs (esos se definen en código).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  Min,
  Max,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO para crear o configurar una tarea programada
 *
 * @example
 * {
 *   "name": "custom-cleanup",
 *   "cron": "0 4 * * *",
 *   "enabled": true,
 *   "description": "Limpieza personalizada",
 *   "timeout": 300000,
 *   "config": { "retentionDays": 14 }
 * }
 */
export class CreateTaskDto {
  @ApiProperty({
    description: 'Nombre único de la tarea (solo letras, números y guiones)',
    example: 'custom-cleanup',
    minLength: 3,
    maxLength: 50,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener mínimo 3 caracteres' })
  @MaxLength(50, { message: 'El nombre debe tener máximo 50 caracteres' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El nombre solo puede contener letras minúsculas, números y guiones',
  })
  name: string;

  @ApiProperty({
    description: 'Expresión cron para programar la tarea',
    example: '0 4 * * *',
  })
  @IsString({ message: 'La expresión cron debe ser texto' })
  @IsNotEmpty({ message: 'La expresión cron es requerida' })
  @Matches(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
    {
      message: 'La expresión cron no es válida. Formato: minuto hora díaMes mes díaSemana',
    },
  )
  cron: string;

  @ApiPropertyOptional({
    description: 'Si la tarea está habilitada',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'enabled debe ser booleano' })
  enabled?: boolean = true;

  @ApiProperty({
    description: 'Descripción de la tarea',
    example: 'Limpieza personalizada de registros antiguos',
    maxLength: 255,
  })
  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MaxLength(255, { message: 'La descripción debe tener máximo 255 caracteres' })
  description: string;

  @ApiPropertyOptional({
    description: 'Timeout máximo en milisegundos (1 segundo - 30 minutos)',
    example: 300000,
    minimum: 1000,
    maximum: 1800000,
    default: 300000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El timeout debe ser un número' })
  @Min(1000, { message: 'El timeout mínimo es 1000ms (1 segundo)' })
  @Max(1800000, { message: 'El timeout máximo es 1800000ms (30 minutos)' })
  timeout?: number = 300000;

  @ApiPropertyOptional({
    description: 'Número máximo de reintentos (0-5)',
    example: 3,
    minimum: 0,
    maximum: 5,
    default: 3,
  })
  @IsOptional()
  @IsNumber({}, { message: 'maxRetries debe ser un número' })
  @Min(0, { message: 'maxRetries mínimo es 0' })
  @Max(5, { message: 'maxRetries máximo es 5' })
  maxRetries?: number = 3;

  @ApiPropertyOptional({
    description: 'Delay entre reintentos en milisegundos',
    example: 5000,
    minimum: 1000,
    maximum: 60000,
    default: 5000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'retryDelay debe ser un número' })
  @Min(1000, { message: 'retryDelay mínimo es 1000ms' })
  @Max(60000, { message: 'retryDelay máximo es 60000ms (1 minuto)' })
  retryDelay?: number = 5000;

  @ApiPropertyOptional({
    description: 'Configuración adicional específica del job',
    example: { retentionDays: 14, tables: ['users', 'orders'] },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject({ message: 'config debe ser un objeto' })
  config?: Record<string, unknown>;
}
