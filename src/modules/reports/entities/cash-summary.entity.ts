// src/modules/reports/entities/cash-summary.entity.ts

import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

@Entity({ name: 'report_cash_summary' })
@Index(['report_header_id'])
export class CashSummaryEntity extends BaseReadOnlyEntity {
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
    name: 'tender_name',
  })
  tender_name: string;

  @Column({
    type: 'int',
    default: 0,
    name: 'quantity',
  })
  quantity: number;

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

  @ManyToOne(() => ReportHeaderEntity, (header) => header.cash_summary, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;
}
