// src/modules/reports/entities/income-by-class.entity.ts

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

@Entity({ name: 'report_income_by_class' })
@Index(['report_header_id'])
export class IncomeByClassEntity extends BaseReadOnlyEntity {
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'report_header_id',
  })
  report_header_id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'class_name',
  })
  class_name: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'currency_name',
  })
  currency_name: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    name: 'currency_symbol',
  })
  currency_symbol: string;

  @Column({
    type: 'int',
    default: 0,
    name: 'transaction_count',
  })
  transaction_count: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_amount',
  })
  total_amount: number;

  // ============================================
  // RELACIONES
  // ============================================

  @ManyToOne(() => ReportHeaderEntity, (header) => header.income_by_class, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;

}
