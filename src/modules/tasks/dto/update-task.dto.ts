/**
 * @fileoverview DTO para actualizar una tarea programada
 * @module modules/tasks/dto
 */

import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

/**
 * DTO para actualizar una tarea programada
 * Todos los campos son opcionales excepto que se omite `name`
 * (el nombre no se puede cambiar después de crear)
 *
 * @example
 * {
 *   "cron": "0 5 * * *",
 *   "enabled": false,
 *   "description": "Nueva descripción"
 * }
 */
export class UpdateTaskDto extends PartialType(OmitType(CreateTaskDto, ['name'] as const)) {
  @ApiPropertyOptional({
    description: 'Razón del cambio (para auditoría)',
    example: 'Cambiando horario a las 5 AM por mantenimiento',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'La razón debe ser texto' })
  @MaxLength(255, { message: 'La razón debe tener máximo 255 caracteres' })
  reason?: string;
}
