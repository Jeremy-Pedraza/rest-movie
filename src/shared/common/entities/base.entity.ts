// src/shared/common/entities/base.entity.ts
import { DeleteDateColumn } from 'typeorm';
import { BaseTimestampEntity } from './base-timestamp.entity';

/**
 * BaseEntity - Entidad base abstracta con soporte completo de CRUD y soft delete
 *
 * Proporciona campos comunes: id (UUID), timestamps y soft delete.
 * Usar para: entidades principales que requieren soft delete (Company, Store, User).
 *
 * Jerarquía:
 * - BaseReadOnlyEntity (id + createdAt)
 *   └─ BaseTimestampEntity (+ updatedAt)
 *      └─ BaseEntity (+ deletedAt + isDeleted)  ← esta clase
 *
 * @example
 * ```typescript
 * @Entity('users')
 * export class User extends BaseEntity {
 *   @Column({ type: 'varchar', length: 100 })
 *   name: string;
 * }
 * ```
 */
export abstract class BaseEntity extends BaseTimestampEntity {
  /**
   * Fecha de eliminación (soft delete)
   * NULL = registro activo
   * DATE = registro eliminado (soft deleted)
   */
  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
    comment: 'Fecha de eliminación (soft delete)',
  })
  deletedAt: Date | null;

  /**
   * Verifica si el registro está eliminado (soft deleted)
   */
  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
