// src/modules/reports/entities/adjustment.entity.ts

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
 * AdjustmentEntity - Ajustes y devoluciones
 *
 * @description
 * Representa el desglose de ajustes realizados durante el período.
 * Incluye devoluciones, cancelaciones y otros ajustes.
 *
 * Relaciones:
 * - Pertenece a un ReportHeader (ManyToOne)
 *
 * @example
 * ```typescript
 * const adjustment = new AdjustmentEntity();
 * adjustment.report_header_id = 'uuid-report';
 * adjustment.adjustment_type = 'refund';
 * adjustment.reason = 'Cliente insatisfecho';
 * adjustment.total_amount = -150.00;
 * adjustment.count = 3;
 * await adjustmentRepo.save(adjustment);
 * ```
 */
@Entity({ name: 'adjustments', schema: 'public' })
@Index(['report_header_id'])
@Index(['adjustment_type'])
export class AdjustmentEntity {
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
   * Tipo de ajuste
   * - refund: Devolución
   * - cancellation: Cancelación
   * - void: Anulación
   * - correction: Corrección
   * - discount_adjustment: Ajuste de descuento
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'adjustment_type',
  })
  adjustment_type: string;

  /**
   * Razón del ajuste
   * @example 'Cliente insatisfecho', 'Error en orden'
   */
  @Column({
    type: 'text',
    nullable: true,
    name: 'reason',
  })
  reason?: string;

  /**
   * Monto total del ajuste (puede ser negativo)
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
   * Cantidad de ajustes de este tipo
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'count',
  })
  count: number;

  /**
   * Monto promedio por ajuste
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'average_amount',
  })
  average_amount: number;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Reporte padre al que pertenece este registro
   */
  @ManyToOne(() => ReportHeaderEntity, (header) => header.adjustments, {
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
