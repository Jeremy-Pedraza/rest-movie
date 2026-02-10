// src/modules/reports/entities/effective-order.entity.ts

/**
 * @fileoverview Entidad EffectiveOrder - Órdenes efectivas
 * @module modules/reports
 *
 * ARQUITECTURA MULTI-TENANT:
 * Esta entidad es una ENTIDAD DE TENANT - sus datos se almacenan
 * en el schema específico de cada compañía.
 *
 * @version 3.0.0 - FASE 5: Soporte multi-tenant
 */

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
 * MULTI-TENANT:
 * - Esta entidad vive en el schema del tenant
 * - FK a report_headers del MISMO schema
 *
 * Relaciones:
 * - Pertenece a un ReportHeader (ManyToOne) - MISMO SCHEMA
 *
 * @example
 * ```typescript
 * const order = new EffectiveOrderEntity();
 * order.report_header_id = 'uuid-report';
 * order.order_number = 'ORD-12345';
 * order.order_type = 'dine_in';
 * order.total = 150.50;
 * order.items_count = 4;
 * order.order_datetime = new Date();
 * ```
 */
@Entity({ name: 'effective_orders' })
@Index(['report_header_id'])
@Index(['order_number'])
@Index(['order_type'])
@Index(['order_datetime'])
export class EffectiveOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID del reporte padre
   * FK a report_headers (mismo schema)
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
   * Fecha y hora de la orden
   */
  @Column({
    type: 'timestamptz',
    nullable: false,
    name: 'order_datetime',
  })
  order_datetime: Date;

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
   * Subtotal de la orden (antes de descuentos e impuestos)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'subtotal',
  })
  subtotal: number;

  /**
   * Descuentos aplicados a esta orden
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'discount',
  })
  discount: number;

  /**
   * Impuestos de la orden
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'tax',
  })
  tax: number;

  /**
   * Total de la orden (subtotal - discount + tax)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total',
  })
  total: number;

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
   * ID del cliente (opcional)
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'customer_id',
  })
  customer_id?: string;

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
