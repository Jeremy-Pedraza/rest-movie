// src/shared/database/entities/tenant-schema.entity.ts

/**
 * @fileoverview Entidad para control de schemas de tenant
 * @module shared/database
 *
 * Registra todos los schemas de tenant creados en el sistema
 * Permite tracking de estado, sincronización y auditoría
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Estados posibles de un schema de tenant
 */
export enum TenantSchemaStatus {
  /** Schema activo y operativo */
  ACTIVE = 'active',
  /** Schema creándose */
  CREATING = 'creating',
  /** Schema suspendido temporalmente */
  SUSPENDED = 'suspended',
  /** Schema en proceso de eliminación */
  DELETING = 'deleting',
  /** Error en la creación/sincronización */
  ERROR = 'error',
}

/**
 * TenantSchemaEntity - Registro de schemas de tenant
 *
 * Propósito:
 * - Tracking de schemas creados
 * - Estado de cada schema
 * - Auditoría de sincronización
 * - Referencia company_id ↔ schema_name
 *
 * @example
 * ```typescript
 * const schema = new TenantSchemaEntity();
 * schema.company_id = 'uuid-company';
 * schema.schema_name = 'taco_bell_rd';
 * schema.status = TenantSchemaStatus.ACTIVE;
 * schema.tables_count = 6;
 * await repo.save(schema);
 * ```
 */
@Entity({ name: 'tenant_schemas', schema: 'public' })
export class TenantSchemaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID de la compañía dueña del schema
   * Relación 1:1 con companies
   */
  @Column({
    type: 'uuid',
    nullable: false,
    unique: true,
    name: 'company_id',
  })
  @Index('idx_tenant_schemas_company')
  company_id: string;

  /**
   * Nombre del schema en PostgreSQL
   * Debe coincidir con companies.schema
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
    name: 'schema_name',
  })
  @Index('idx_tenant_schemas_name')
  schema_name: string;

  /**
   * Estado actual del schema
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: TenantSchemaStatus.ACTIVE,
    name: 'status',
  })
  @Index('idx_tenant_schemas_status')
  status: TenantSchemaStatus;

  /**
   * Cantidad de tablas en el schema
   */
  @Column({
    type: 'int',
    nullable: false,
    default: 0,
    name: 'tables_count',
  })
  tables_count: number;

  /**
   * Tamaño del schema en bytes (aproximado)
   */
  @Column({
    type: 'bigint',
    nullable: true,
    default: 0,
    name: 'size_bytes',
  })
  size_bytes: number;

  /**
   * Última sincronización con el template
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
    name: 'last_synced_at',
  })
  last_synced_at: Date | null;

  /**
   * Mensaje de error (si status = ERROR)
   */
  @Column({
    type: 'text',
    nullable: true,
    name: 'error_message',
  })
  error_message: string | null;

  /**
   * Metadata adicional
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'metadata',
  })
  metadata: Record<string, any> | null;

  // ============================================
  // TIMESTAMPS
  // ============================================

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    nullable: true,
    name: 'updated_at',
  })
  updated_at: Date | null;

  // ============================================
  // RELACIÓN (type-only para evitar circular)
  // ============================================

  /**
   * Compañía dueña del schema
   * Relación con CompanyEntity
   */
  @ManyToOne('CompanyEntity', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company?: any;
}
