// src/modules/reports/entities/payment-method.entity.ts

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
 * PaymentMethodEntity - Métodos de pago
 *
 * @description
 * Representa el desglose de ventas por método de pago (efectivo, tarjeta, etc.).
 * Cada registro corresponde a un método de pago específico dentro de un reporte.
 *
 * Relaciones:
 * - Pertenece a un ReportHeader (ManyToOne)
 *
 * @example
 * ```typescript
 * const payment = new PaymentMethodEntity();
 * payment.report_header_id = 'uuid-report';
 * payment.payment_method = 'cash';
 * payment.total_amount = 3000.00;
 * payment.transactions_count = 15;
 * await paymentRepo.save(payment);
 * ```
 */
@Entity({ name: 'payment_methods', schema: 'public' })
@Index(['report_header_id'])
@Index(['payment_method'])
export class PaymentMethodEntity {
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
   * Monto promedio por transacción
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
  @ManyToOne(() => ReportHeaderEntity, (header) => header.payment_methods, {
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
