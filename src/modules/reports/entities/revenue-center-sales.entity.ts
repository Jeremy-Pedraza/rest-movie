// src/modules/reports/entities/revenue-center-sales.entity.ts

import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

@Entity({ name: 'report_revenue_center_sales' })
@Index(['report_header_id'])
@Index(['revenue_center_id'])
export class RevenueCenterSalesEntity extends BaseReadOnlyEntity {
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'report_header_id',
  })
  report_header_id: string;

  @Column({
    type: 'int',
    nullable: false,
    name: 'revenue_center_id',
  })
  revenue_center_id: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    name: 'revenue_center_name',
  })
  revenue_center_name: string;

  @Column({
    type: 'int',
    default: 0,
    name: 'total_checks',
  })
  total_checks: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_sales',
  })
  total_sales: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'average_ticket',
  })
  average_ticket: number;

  // ============================================
  // RELACIONES
  // ============================================

  @ManyToOne(() => ReportHeaderEntity, (header) => header.revenue_center_sales, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;
}
