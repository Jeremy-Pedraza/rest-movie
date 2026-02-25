// src/shared/common/entities/base-timestamp.entity.ts
import { UpdateDateColumn } from 'typeorm';
import { BaseReadOnlyEntity } from './base-readonly.entity';

/**
 * BaseTimestampEntity - Entidad base con timestamps de creación y actualización
 *
 * Proporciona campos comunes: id (UUID), createdAt y updatedAt.
 * Usar para: catálogos, configuraciones, entidades sin soft delete.
 *
 * Jerarquía:
 * - BaseReadOnlyEntity (id + createdAt)
 *   └─ BaseTimestampEntity (+ updatedAt)  ← esta clase
 *      └─ BaseEntity (+ deletedAt + isDeleted)
 *
 * @example
 * ```typescript
 * @Entity('geo_countries')
 * export class GeoCountryEntity extends BaseTimestampEntity {
 *   @Column({ type: 'varchar', length: 100 })
 *   name: string;
 * }
 * ```
 */
export abstract class BaseTimestampEntity extends BaseReadOnlyEntity {
  /**
   * Fecha de última actualización
   * Se actualiza automáticamente en cada UPDATE
   */
  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    comment: 'Fecha de última actualización',
  })
  updatedAt: Date;
}
