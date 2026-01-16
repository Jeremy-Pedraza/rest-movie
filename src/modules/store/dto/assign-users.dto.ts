// src/modules/store/dto/assign-users.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

/**
 * DTO para asignar usuarios a una tienda
 *
 * @description
 * Permite asignar múltiples usuarios (rol USER) a una tienda.
 * Los usuarios asignados solo pueden ver reportes de sus tiendas asignadas.
 *
 * @example
 * ```typescript
 * const dto: AssignUsersToStoreDto = {
 *   user_ids: [
 *     '123e4567-e89b-12d3-a456-426614174001',
 *     '123e4567-e89b-12d3-a456-426614174002',
 *   ],
 * };
 * ```
 */
export class AssignUsersToStoreDto {
  @ApiProperty({
    description: 'IDs de usuarios a asignar (solo rol USER)',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
  })
  @IsArray({ message: 'user_ids debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un usuario' })
  @IsUUID('4', { each: true, message: 'Cada ID debe ser un UUID válido' })
  user_ids: string[];
}

/**
 * DTO para remover usuarios de una tienda
 *
 * @description
 * Permite remover la asignación de múltiples usuarios de una tienda.
 *
 * @example
 * ```typescript
 * const dto: RemoveUsersFromStoreDto = {
 *   user_ids: ['123e4567-e89b-12d3-a456-426614174001'],
 * };
 * ```
 */
export class RemoveUsersFromStoreDto {
  @ApiProperty({
    description: 'IDs de usuarios a remover de la tienda',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray({ message: 'user_ids debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un usuario' })
  @IsUUID('4', { each: true, message: 'Cada ID debe ser un UUID válido' })
  user_ids: string[];
}
