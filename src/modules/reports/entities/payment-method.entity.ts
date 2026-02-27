// src/modules/reports/entities/payment-method.entity.ts

/**
 * @fileoverview Entidad PaymentMethod - Métodos de pago
 * @module modules/reports
 *
 * ARQUITECTURA MULTI-TENANT:
 * Esta entidad es una ENTIDAD DE TENANT - sus datos se almacenan
 * en el schema específico de cada compañía.
 *
 * @version 3.0.0 - FASE 5: Soporte multi-tenant
 */

import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

/**
 * PaymentMethodEntity - Métodos de pago
 *
 * @description
 * Representa el desglose de ventas por método de pago (efectivo, tarjeta, etc.).
 * Cada registro corresponde a un método de pago específico dentro de un reporte.
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
 * const payment = new PaymentMethodEntity();
 * payment.report_header_id = 'uuid-report';
 * payment.payment_method = 'cash';
 * payment.total_amount = 3000.00;
 * payment.transactions_count = 15;
 * ```
 */
@Entity({ name: 'payment_methods' })
@Index(['report_header_id'])
@Index(['payment_method'])
export class PaymentMethodEntity extends BaseReadOnlyEntity {
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
   * Método de pago
   * - cash: Efectivo
   * - credit_card: Tarjeta de crédito
   * - debit_card: Tarjeta de débito
   * - digital_wallet: Billetera digital (PayPal, etc.)
   * - bank_transfer: Transferencia bancaria
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'payment_method',
  })
  payment_method: string;

  /**
   * Monto total recaudado con este método
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
   * Cantidad de transacciones con este método
   */
  @Column({
    type: 'int',
    default: 0,
    name: 'transactions_count',
  })
  transactions_count: number;

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
  @ManyToOne(() => ReportHeaderEntity, (header) => header.payment_methods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;
}
