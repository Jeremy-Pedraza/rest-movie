// src/modules/store/entities/store.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import type { CompanyEntity } from '@modules/company/entities';
import type { UserEntity } from '@modules/user/entities';

/**
 * StoreEntity - Tienda/Sucursal del sistema
 *
 * @description
 * Representa una tienda o sucursal que pertenece a una compañía.
 * Las tiendas generan reportes de ventas y pueden tener usuarios asignados (rol USER).
 *
 * Relaciones:
 * - Pertenece a una Company (ManyToOne)
 * - Puede tener múltiples Users asignados (ManyToMany)
 * - Genera múltiples Reports (OneToMany)
 *
 * @example
 * ```typescript
 * const store = new StoreEntity();
 * store.company_id = 'uuid-company';
 * store.nombre = 'Sucursal Centro';
 * store.codigo = 'TDA-001';
 * store.direccion = 'Av. Principal 123';
 * store.ciudad = 'Quito';
 * await storeRepo.save(store);
 * ```
 */
@Entity({ name: 'stores', schema: 'public' })
@Index(['company_id'])
@Index(['codigo'], { unique: true })
@Index(['company_id', 'codigo'], { unique: true })
@Index(['activo'])
@Index(['ciudad'])
export class StoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID de la compañía a la que pertenece
   */
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'company_id',
  })
  company_id: string;

  /**
   * Nombre de la tienda
   *
   * @example 'Sucursal Centro', 'Mall del Sol'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'nombre',
  })
  nombre: string;

  /**
   * Código único de la tienda
   * Usado para identificación y reportes
   *
   * @example 'TDA-001', 'SUC-CENTRO'
   */
  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: false,
    name: 'codigo',
    comment: 'Código único de tienda',
  })
  codigo: string;

  /**
   * Email de contacto de la tienda
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'email',
  })
  email?: string;

  /**
   * Teléfono de contacto
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'telefono',
  })
  telefono?: string;

  /**
   * Dirección física de la tienda
   */
  @Column({
    type: 'text',
    nullable: false,
    name: 'direccion',
  })
  direccion: string;

  /**
   * Ciudad donde se ubica
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'ciudad',
  })
  ciudad: string;

  /**
   * Zona o sector de la ciudad
   *
   * @example 'Norte', 'Centro', 'Sur'
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'zona',
  })
  zona?: string;

  /**
   * Latitud GPS de la ubicación
   * Precision: 10 dígitos totales, 8 decimales
   *
   * @example -0.18070055
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    name: 'latitud',
  })
  latitud?: number;

  /**
   * Longitud GPS de la ubicación
   * Precision: 11 dígitos totales, 8 decimales
   *
   * @example -78.46783882
   */
  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    name: 'longitud',
  })
  longitud?: number;

  /**
   * Estado activo/inactivo
   * Tiendas inactivas no generan reportes
   */
  @Column({
    type: 'boolean',
    default: true,
    name: 'activo',
  })
  activo: boolean;

  /**
   * Metadata adicional en formato JSON
   *
   * Puede contener:
   * - Horarios de atención
   * - Capacidad
   * - Configuración específica
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'metadata',
  })
  metadata?: Record<string, any>;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Compañía a la que pertenece la tienda
   * Relación inversa: CompanyEntity.stores
   */
  @ManyToOne('CompanyEntity', 'stores', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;

  /**
   * Reportes generados por esta tienda
   * Relación inversa: ReportHeaderEntity.store
   *
   * Los reportes se generan diariamente por tienda
   */
  @OneToMany('ReportHeaderEntity', 'store')
  reports?: any[]; // Type-only import para evitar circular

  /**
   * Usuarios asignados a esta tienda (solo rol USER)
   * Relación ManyToMany con tabla intermedia user_stores
   *
   * Los usuarios asignados solo pueden ver reportes de sus tiendas.
   * MANAGER y superiores tienen acceso a todas las tiendas de su compañía.
   */
  @ManyToMany('UserEntity', 'assigned_stores')
  @JoinTable({
    name: 'user_stores',
    joinColumn: { name: 'store_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assigned_users?: UserEntity[];

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
  updated_at?: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
    name: 'deleted_at',
  })
  deleted_at?: Date;
}
