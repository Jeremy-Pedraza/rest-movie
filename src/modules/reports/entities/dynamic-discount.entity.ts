// src/modules/reports/entities/dynamic-discount.entity.ts

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
 * DynamicDiscountEntity - Descuentos dinámicos
 *
 * @description
 * Representa el desglose de descuentos aplicados durante el período.
 * Cada registro corresponde a un tipo de descuento específico.
 *
 * Relaciones:
 * - Pertenece a un ReportHeader (ManyToOne)
 *
 * @example
 * ```typescript
 * const discount = new DynamicDiscountEntity();
 * discount.report_header_id = 'uuid-report';
 * discount.discount_type = 'promotional';
 * discount.discount_name = 'Happy Hour 2x1';
 * discount.total_discount = 500.00;
 * discount.times_applied = 10;
 * await discountRepo.save(discount);
 * ```
 */
@Entity({ name: 'dynamic_discounts', schema: 'public' })
@Index(['report_header_id'])
@Index(['discount_type'])
export class DynamicDiscountEntity {
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
   * Tipo de descuento
   * - promotional: Descuento promocional
   * - loyalty: Descuento por lealtad
   * - coupon: Cupón de descuento
   * - seasonal: Descuento estacional
   * - employee: Descuento de empleado
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'discount_type',
  })
  discount_type: string;

  /**
   * Nombre del descuento
   * @example 'Happy Hour 2x1', 'Descuento Black Friday'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'discount_name',
  })
  discount_name: string;

  /**
   * Monto total de descuento aplicado
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_discount',
  })
  total_discount: number;

  /**
   * Veces que se aplicó el descuento
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'times_applied',
  })
  times_applied: number;

  /**
   * Descuento promedio por aplicación
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'average_discount',
  })
  average_discount: number;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Reporte padre al que pertenece este registro
   */
  @ManyToOne(() => ReportHeaderEntity, (header) => header.dynamic_discounts, {
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
