// src/shared/common/entities/base.entity.ts
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

/**
 * BaseEntity - Entidad base abstracta
 *
 * Todas las entidades del sistema DEBEN heredar de esta clase.
 * Proporciona campos comunes: id (UUID), timestamps y soft delete.
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
export abstract class BaseEntity {
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
