// src/modules/reports/entities/effective-order.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReportHeaderEntity } from './report-header.entity';

/**
 * EffectiveOrderEntity - Órdenes efectivas
 *
 * @description
 * Representa el desglose de órdenes procesadas durante el período.
 * Cada registro corresponde a una orden específica con su detalle.
 *
 * Relaciones:
 * - Pertenece a un ReportHeader (ManyToOne)
 *
 * @example
 * ```typescript
 * const order = new EffectiveOrderEntity();
 * order.report_header_id = 'uuid-report';
 * order.order_number = 'ORD-12345';
 * order.order_type = 'dine_in';
 * order.total_amount = 150.50;
 * order.items_count = 4;
 * order.order_datetime = new Date();
 * await orderRepo.save(order);
 * ```
 */
@Entity({ name: 'effective_orders', schema: 'public' })
@Index(['report_header_id'])
@Index(['order_number'])
@Index(['order_type'])
@Index(['order_datetime'])
export class EffectiveOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID del reporte padre
   */
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'report_header_id',
  })
  report_header_id: string;

  /**
   * Número de orden
   * @example 'ORD-12345', 'TKT-001'
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'order_number',
  })
  order_number: string;

  /**
   * Tipo de orden
   * - dine_in: Comer en el lugar
   * - takeout: Para llevar
   * - delivery: Entrega a domicilio
   * - pickup: Recoger en tienda
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'order_type',
  })
  order_type: string;

  /**
   * Monto total de la orden (después de descuentos)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_amount',
  })
  total_amount: number;

  /**
   * Monto de ventas brutas (antes de descuentos)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'gross_amount',
  })
  gross_amount: number;

  /**
   * Descuentos aplicados a esta orden
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'discounts',
  })
  discounts: number;

  /**
   * Cantidad de items en la orden
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'items_count',
  })
  items_count: number;

  /**
   * Método de pago usado
   * @example 'cash', 'credit_card'
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'payment_method',
  })
  payment_method?: string;

  /**
   * Fecha y hora de la orden
   */
  @Column({
    type: 'timestamptz',
    nullable: false,
    name: 'order_datetime',
  })
  order_datetime: Date;

  /**
   * Estado de la orden
   * - completed: Completada
   * - cancelled: Cancelada
   * - refunded: Devuelta
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'completed',
    name: 'status',
  })
  status: string;

  /**
   * Información adicional de la orden (JSON)
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
   * Reporte padre al que pertenece este registro
   */
  @ManyToOne(() => ReportHeaderEntity, (header) => header.effective_orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;

  // ============================================
  // TIMESTAMPS
  // ============================================

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  created_at: Date;
}
