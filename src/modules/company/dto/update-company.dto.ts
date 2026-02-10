// src/modules/company/dto/update-company.dto.ts

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

/**
 * DTO para actualizar una compañía
 *
 * @description
 * Hereda de CreateCompanyDto pero hace todos los campos opcionales.
 * El campo 'schema' está omitido porque no debería cambiar después de la creación.
 *
 * @example
 * ```typescript
 * const dto: UpdateCompanyDto = {
 *   name: 'Restaurantes Valle S.A. (Actualizado)',
 *   telefono: '+593987654322',
 * };
 * ```
 */
export class UpdateCompanyDto extends PartialType(
  OmitType(CreateCompanyDto, ['schema'] as const),
) {}
