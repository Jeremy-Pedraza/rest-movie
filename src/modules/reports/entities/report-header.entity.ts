// src/modules/reports/entities/report-header.entity.ts

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
 * Relaciones:
 * - Pertenece a una Store (ManyToOne)
 * - Tiene múltiples SalesByOrderType (OneToMany)
 * - Tiene múltiples PaymentMethods (OneToMany)
 * - Tiene múltiples DynamicDiscounts (OneToMany)
 * - Tiene múltiples Adjustments (OneToMany)
 * - Tiene múltiples EffectiveOrders (OneToMany)
 *
 * @example
 * ```typescript
 * const report = new ReportHeaderEntity();
 * report.store_id = 'uuid-store';
 * report.report_date = new Date('2025-01-16');
 * report.report_type = ReportTypeEnum.DAILY;
 * report.total_sales = 15000.50;
 * await reportRepo.save(report);
 * ```
 */
@Entity({ name: 'report_headers', schema: 'public' })
@Index(['store_id', 'report_date'], { unique: true })
@Index(['report_date'])
@Index(['report_type'])
@Index(['store_id', 'report_type'])
export class ReportHeaderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID de la tienda que generó el reporte
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
