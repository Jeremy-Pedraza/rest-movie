// src/modules/reports/entities/dynamic-discount.entity.ts

/**
 * @fileoverview Entidad DynamicDiscount - Descuentos dinámicos
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
 * DynamicDiscountEntity - Descuentos dinámicos
 *
 * @description
 * Representa el desglose de descuentos aplicados durante el período.
 * Cada registro corresponde a un tipo de descuento específico.
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
 * const discount = new DynamicDiscountEntity();
 * discount.report_header_id = 'uuid-report';
 * discount.discount_type = 'promotional';
 * discount.discount_name = 'Happy Hour 2x1';
 * discount.total_discount = 500.00;
 * discount.times_applied = 10;
 * ```
 */
@Entity({ name: 'dynamic_discounts' })
@Index(['report_header_id'])
@Index(['discount_type'])
export class DynamicDiscountEntity extends BaseReadOnlyEntity {
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
   * Tipo de descuento
   * - percentage: Porcentaje
   * - fixed: Monto fijo
   * - promotional: Descuento promocional
   * - loyalty: Descuento por lealtad
   * - coupon: Cupón de descuento
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'percentage',
    name: 'discount_type',
  })
  discount_type: string;

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

}
