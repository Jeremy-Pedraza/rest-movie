// src/modules/reports/entities/report-header.entity.ts

/**
 * @fileoverview Entidad ReportHeader - Cabecera de reportes de ventas
 * @module modules/reports
 *
 * ARQUITECTURA MULTI-TENANT:
 * Esta entidad es una ENTIDAD DE TENANT - sus datos se almacenan
 * en el schema específico de cada compañía (ej: taco_bell_rd.report_headers)
 *
 * El schema se determina dinámicamente vía SchemaContext/BaseRepository.
 * NO debe especificarse schema en el decorador @Entity.
 *
 * @version 3.0.0 - FASE 5: Soporte multi-tenant
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import type { StoreEntity } from '@modules/store/entities';
import { ReportTypeEnum } from '../enums';

/**
 * ReportHeaderEntity - Cabecera principal del reporte
 *
 * @description
 * Representa el encabezado de un reporte de ventas.
 * Contiene información consolidada de ventas, ingresos y cantidades.
 *
 * MULTI-TENANT:
 * - Esta entidad vive en el schema del tenant (ej: taco_bell_rd)
 * - El ReportsRepository usa BaseRepository para queries con schema dinámico
 * - La relación con Store (public.stores) cruza schemas
 *
 * Relaciones:
 * - Pertenece a una Store (ManyToOne) - CROSS-SCHEMA a public.stores
 * - Tiene múltiples SalesByOrderType (OneToMany) - MISMO SCHEMA
 * - Tiene múltiples PaymentMethods (OneToMany) - MISMO SCHEMA
 * - Tiene múltiples DynamicDiscounts (OneToMany) - MISMO SCHEMA
 * - Tiene múltiples Adjustments (OneToMany) - MISMO SCHEMA
 * - Tiene múltiples EffectiveOrders (OneToMany) - MISMO SCHEMA
 *
 * @example
 * ```typescript
 * // En ReportsRepository (extiende BaseRepository)
 * // Las queries usan el schema del tenant automáticamente
 * const reports = await this.withSchema(async (manager) => {
 *   return manager.find(ReportHeaderEntity, {
 *     where: { store_id: storeId }
 *   });
 * });
 * ```
 */
@Entity({ name: 'report_headers' })
@Index(['store_id', 'report_date'], { unique: true })
@Index(['report_date'])
@Index(['report_type'])
@Index(['store_id', 'report_type'])
export class ReportHeaderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID de la tienda que generó el reporte
   * FK a public.stores (cross-schema)
   */
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'store_id',
  })
  store_id: string;

  /**
   * Fecha del reporte (formato: YYYY-MM-DD)
   * Representa el día de las ventas reportadas
   */
  @Column({
    type: 'date',
    nullable: false,
    name: 'report_date',
  })
  report_date: Date;

  /**
   * Tipo de reporte (daily, weekly, monthly)
   */
  @Column({
    type: 'enum',
    enum: ReportTypeEnum,
    default: ReportTypeEnum.DAILY,
    name: 'report_type',
  })
  report_type: ReportTypeEnum;

  // ============================================
  // MÉTRICAS PRINCIPALES
  // ============================================

  /**
   * Total de ventas en el período
   * Suma de todas las ventas (sin descuentos)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_sales',
  })
  total_sales: number;

  /**
   * Total de ingresos en el período
   * Ventas - Descuentos
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_revenue',
  })
  total_revenue: number;

  /**
   * Cantidad total de productos vendidos
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'total_quantity',
  })
  total_quantity: number;

  /**
   * Cantidad de órdenes procesadas
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'orders_count',
  })
  orders_count: number;

  /**
   * Ticket promedio (revenue / orders_count)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'average_ticket',
  })
  average_ticket: number;

  // ============================================
  // DESCUENTOS Y AJUSTES
  // ============================================

  /**
   * Total de descuentos aplicados
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_discounts',
  })
  total_discounts: number;

  /**
   * Total de ajustes (devoluciones, cancelaciones)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_adjustments',
  })
  total_adjustments: number;

  // ============================================
  // METADATA
  // ============================================

  /**
   * Información adicional en formato JSON
   * Puede contener métricas extras, configuración, etc.
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'metadata',
  })
  metadata?: Record<string, any>;

  /**
   * Estado del reporte
   * - draft: Borrador
   * - published: Publicado
   * - archived: Archivado
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'published',
    name: 'status',
  })
  status: string;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Tienda que generó el reporte
   * NOTA: Esta relación cruza schemas (tenant → public)
   */
  @ManyToOne('StoreEntity', 'reports', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store?: StoreEntity;

  /**
   * Ventas por tipo de orden (dine-in, takeout, delivery, etc.)
   */
  @OneToMany('SalesByOrderTypeEntity', 'report_header')
  sales_by_order_type?: any[];

  /**
   * Métodos de pago utilizados
   */
  @OneToMany('PaymentMethodEntity', 'report_header')
  payment_methods?: any[];

  /**
   * Descuentos dinámicos aplicados
   */
  @OneToMany('DynamicDiscountEntity', 'report_header')
  dynamic_discounts?: any[];

  /**
   * Ajustes y devoluciones
   */
  @OneToMany('AdjustmentEntity', 'report_header')
  adjustments?: any[];

  /**
   * Órdenes efectivas (detalle de órdenes)
   */
  @OneToMany('EffectiveOrderEntity', 'report_header')
  effective_orders?: any[];

  /**
   * Faltantes y sobrantes de caja
   */
  @OneToMany('ShortageOverageEntity', 'report_header')
  shortage_overage?: any[];

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
}
