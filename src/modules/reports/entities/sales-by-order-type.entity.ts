// src/modules/reports/entities/sales-by-order-type.entity.ts

/**
 * @fileoverview Entidad SalesByOrderType - Ventas por tipo de orden
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
 * SalesByOrderTypeEntity - Ventas por tipo de orden
 *
 * @description
 * Representa el desglose de ventas por tipo de orden (dine-in, takeout, delivery).
 * Cada registro corresponde a un tipo de orden específico dentro de un reporte.
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
 * const sales = new SalesByOrderTypeEntity();
 * sales.report_header_id = 'uuid-report';
 * sales.order_type = 'dine_in';
 * sales.total_sales = 5000.50;
 * sales.orders_count = 25;
 * ```
 */
@Entity({ name: 'sales_by_order_type' })
@Index(['report_header_id'])
@Index(['order_type'])
export class SalesByOrderTypeEntity {
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
   * Total de ventas para este tipo de orden
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
   * Cantidad de órdenes de este tipo
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'orders_count',
  })
  orders_count: number;

  /**
   * Cantidad de productos vendidos en este tipo de orden
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'quantity',
  })
  quantity: number;

  /**
   * Ticket promedio para este tipo de orden
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'average_ticket',
  })
  average_ticket: number;

  /**
   * Porcentaje del total de ventas
   */
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'percentage',
  })
  percentage: number;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Reporte padre al que pertenece este registro
   */
  @ManyToOne(() => ReportHeaderEntity, (header) => header.sales_by_order_type, {
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
