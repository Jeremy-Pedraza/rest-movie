// src/shared/common/entities/base-readonly.entity.ts
import { PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

/**
 * BaseReadOnlyEntity - Entidad base para registros de solo lectura/append-only
 *
 * Proporciona campos comunes: id (UUID) y createdAt.
 * Usar para: logs, registros de auditoría, child entities de reportes.
 *
 * Jerarquía:
 * - BaseReadOnlyEntity (id + createdAt)
 *   └─ BaseTimestampEntity (+ updatedAt)
 *      └─ BaseEntity (+ deletedAt + isDeleted)
 *
 * @example
 * ```typescript
 * @Entity('logs')
 * export class LogEntity extends BaseReadOnlyEntity {
 *   @Column({ type: 'text' })
 *   message: string;
 * }
 * ```
 */
export abstract class BaseReadOnlyEntity {
  /**
   * Identificador único (UUID v4)
   * Generado automáticamente por PostgreSQL
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Fecha de creación del registro
   * Se establece automáticamente al insertar
   */
  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    comment: 'Fecha de creación del registro',
  })
  createdAt: Date;
}
