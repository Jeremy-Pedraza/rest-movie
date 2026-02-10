// src/modules/reports/entities/shortage-overage.entity.ts

/**
 * @fileoverview Entidad ShortageOverage - Faltantes y sobrantes de caja
 * @module modules/reports
 *
 * ARQUITECTURA MULTI-TENANT:
 * Esta entidad es una ENTIDAD DE TENANT - sus datos se almacenan
 * en el schema específico de cada compañía.
 *
 * @version 1.0.0
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
 * ShortageOverageEntity - Faltantes y sobrantes de caja
 *
 * @description
 * Representa las varianzas detectadas en conteos de caja (Cash Management).
 * Cada registro corresponde a un conteo individual con su diferencia.
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
 * const variance = new ShortageOverageEntity();
 * variance.report_header_id = 'uuid-report';
 * variance.receptacle_type = 'till';
 * variance.receptacle_name = 'Caja Restaurante 1';
 * variance.employee_id = 149453;
 * variance.employee_name = 'Juan Pérez';
 * variance.expected_amount = 369669.0;
 * variance.counted_amount = 370000.0;
 * variance.variance_amount = 331.0;
 * variance.variance_type = 'overage';
 * ```
 */
@Entity({ name: 'shortage_overage' })
@Index(['report_header_id'])
@Index(['employee_id'])
@Index(['variance_type'])
@Index(['counted_at'])
export class ShortageOverageEntity {
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
   * Tipo de receptáculo
   * - till: Caja registradora (tipo 3)
   * - safe: Caja fuerte (tipo 6)
   * - other: Otros receptáculos
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'receptacle_type',
  })
  receptacle_type: string;

  /**
   * Nombre del receptáculo
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'receptacle_name',
  })
  receptacle_name: string;

  /**
   * ID del empleado responsable del conteo
   */
  @Column({
    type: 'int',
    nullable: false,
    name: 'employee_id',
  })
  employee_id: number;

  /**
   * Nombre del empleado responsable
   */
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    name: 'employee_name',
  })
  employee_name: string;

  /**
   * Fecha y hora del conteo
   */
  @Column({
    type: 'timestamptz',
    nullable: false,
    name: 'counted_at',
  })
  counted_at: Date;

  /**
   * Monto esperado en caja
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'expected_amount',
  })
  expected_amount: number;

  /**
   * Monto contado en caja
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'counted_amount',
  })
  counted_amount: number;

  /**
   * Varianza (diferencia)
   * Positivo = sobrante (overage)
   * Negativo = faltante (shortage)
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'variance_amount',
  })
  variance_amount: number;

  /**
   * Tipo de varianza
   * - shortage: Faltante
   * - overage: Sobrante
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    name: 'variance_type',
  })
  variance_type: string;

  /**
   * Razón de la discrepancia (opcional)
   */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'reason',
  })
  reason?: string;

  /**
   * Clase de dinero (efectivo, monedas, etc.)
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'class_name',
  })
  class_name: string;

  /**
   * Moneda
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'currency',
  })
  currency: string;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Reporte padre al que pertenece este registro
   */
  @ManyToOne(() => ReportHeaderEntity, (header) => header.shortage_overage, {
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
