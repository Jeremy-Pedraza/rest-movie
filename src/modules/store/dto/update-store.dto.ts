// src/modules/store/dto/update-store.dto.ts

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';

/**
 * DTO para actualizar una tienda
 *
 * @description
 * Hereda de CreateStoreDto pero hace todos los campos opcionales.
 * Los campos 'company_id' y 'codigo' están omitidos porque no deberían cambiar.
 *
 * @example
 * ```typescript
 * const dto: UpdateStoreDto = {
 *   nombre: 'Sucursal Centro Actualizado',
 *   telefono: '+593987654322',
 * };
 * ```
 */
export class UpdateStoreDto extends PartialType(
  OmitType(CreateStoreDto, ['company_id', 'codigo'] as const),
) {}
