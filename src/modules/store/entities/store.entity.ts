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
 * Interfaz para horarios de operación
 */
export interface IOperatingHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

/**
 * StoreEntity - Tienda/Sucursal del sistema
 *
 * @description
 * Representa una tienda o sucursal que pertenece a una compañía.
 * Las tiendas generan reportes de ventas y pueden tener usuarios asignados (rol USER).
 *
 * @version 2.0.0 - Agregados campos de segmentación para reportes (FASE 2)
 *
 * Relaciones:
 * - Pertenece a una Company (ManyToOne)
 * - Puede tener múltiples Users asignados (ManyToMany)
 * - Genera múltiples Reports (OneToMany)
 *
 * Segmentación disponible:
 * - Por región geográfica
 * - Por tipo de ubicación (mall, street, airport, etc.)
 * - Por formato de tienda (express, regular, flagship, etc.)
 * - Por tier de ventas (A, B, C, D, E)
 * - Por características (drive_thru, delivery, etc.)
 *
 * @example
 * ```typescript
 * const store = new StoreEntity();
 * store.company_id = 'uuid-company';
 * store.nombre = 'Taco Bell Agora Mall';
 * store.codigo = 'TB-RD-001';
 * store.direccion = 'Agora Mall, Local 201';
 * store.ciudad = 'Santo Domingo';
 * store.region = 'Metropolitana';
 * store.location_type = 'mall';
 * store.store_format = 'regular';
 * store.sales_tier = 'A';
 * store.has_drive_thru = false;
 * store.has_delivery = true;
 * await storeRepo.save(store);
 * ```
 */
@Entity({ name: 'stores' })
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

  // ============================================
  // INFORMACIÓN BÁSICA
  // ============================================

  /**
   * Nombre de la tienda
   *
   * @example 'Taco Bell Agora Mall', 'Taco Bell Blue Mall'
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
   * @example 'TB-RD-001', 'TB-GT-015'
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

  // ============================================
  // UBICACIÓN
  // ============================================

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
   * @example 'Norte', 'Centro', 'Sur', 'Piantini', 'Zona Colonial'
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
   * @example 18.4861111
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
   * @example -69.9388889
   */
  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    name: 'longitud',
  })
  longitud?: number;

  // ============================================
  // CAMPOS DE SEGMENTACIÓN (FASE 2)
  // ============================================

  /**
   * Región geográfica para agrupación de reportes
   *
   * @example 'Metropolitana', 'Norte', 'Sur', 'Este', 'Cibao Central'
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'region',
  })
  @Index('idx_stores_region')
  region?: string;

  /**
   * Tipo de ubicación de la tienda
   *
   * @example 'mall', 'street', 'airport', 'highway', 'food_court', 'gas_station', 'university'
   */
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    name: 'location_type',
  })
  @Index('idx_stores_location_type')
  location_type?: string;

  /**
   * Formato de tienda (tamaño/concepto)
   *
   * @example 'express', 'regular', 'flagship', 'cantina', 'drive_thru_only', 'delivery_hub'
   */
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    name: 'store_format',
  })
  @Index('idx_stores_format')
  store_format?: string;

  /**
   * Capacidad de asientos (para dine-in)
   * null si es solo para llevar
   */
  @Column({
    type: 'int',
    nullable: true,
    name: 'seating_capacity',
  })
  seating_capacity?: number;

  /**
   * Indica si tiene servicio drive-thru
   */
  @Column({
    type: 'boolean',
    default: false,
    name: 'has_drive_thru',
  })
  has_drive_thru: boolean;

  /**
   * Indica si tiene servicio de delivery propio
   */
  @Column({
    type: 'boolean',
    default: false,
    name: 'has_delivery',
  })
  has_delivery: boolean;

  /**
   * Horarios de operación por día
   *
   * @example { monday: { open: '08:00', close: '22:00' }, ... }
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'operating_hours',
  })
  operating_hours?: IOperatingHours;

  /**
   * Fecha de apertura de la tienda
   * Útil para análisis de madurez y comparaciones
   */
  @Column({
    type: 'date',
    nullable: true,
    name: 'opening_date',
  })
  opening_date?: Date;

  /**
   * Nombre del gerente/responsable de la tienda
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'manager_name',
  })
  manager_name?: string;

  /**
   * Clasificación de ventas basada en histórico
   * A = Top performers (top 20%)
   * B = Above average (20-40%)
   * C = Average (40-60%)
   * D = Below average (60-80%)
   * E = Underperforming (bottom 20%)
   *
   * @example 'A', 'B', 'C', 'D', 'E'
   */
  @Column({
    type: 'varchar',
    length: 5,
    nullable: true,
    name: 'sales_tier',
  })
  @Index('idx_stores_sales_tier')
  sales_tier?: string;

  /**
   * Tags para filtrado flexible
   * Permite segmentación adicional sin agregar columnas
   *
   * @example ['24h', 'nuevo', 'remodelado', 'temporada_alta', 'wifi']
   */
  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'tags',
  })
  tags?: string[];

  // ============================================
  // ESTADO Y METADATA
  // ============================================

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
   * - Configuración de POS
   * - Integraciones
   * - Datos específicos del país
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
