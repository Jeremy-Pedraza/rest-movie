// src/modules/reports/entities/adjustment.entity.ts

/**
 * @fileoverview Entidad Adjustment - Ajustes y devoluciones
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
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

/**
 * AdjustmentEntity - Ajustes y devoluciones
 *
 * @description
 * Representa el desglose de ajustes realizados durante el período.
 * Incluye devoluciones, cancelaciones y otros ajustes.
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
 * const adjustment = new AdjustmentEntity();
 * adjustment.report_header_id = 'uuid-report';
 * adjustment.adjustment_type = 'refund';
 * adjustment.reason = 'Cliente insatisfecho';
 * adjustment.total_amount = -150.00;
 * adjustment.items_count = 3;
 * ```
 */
@Entity({ name: 'adjustments' })
@Index(['report_header_id'])
@Index(['adjustment_type'])
export class AdjustmentEntity extends BaseReadOnlyEntity {
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
    type: 'varchar',
    length: 255,
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
   * Cantidad de items afectados
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'items_count',
  })
  items_count: number;

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

}
