// src/modules/reports/entities/service-charge.entity.ts

import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

@Entity({ name: 'report_service_charges' })
@Index(['report_header_id'])
export class ServiceChargeEntity extends BaseReadOnlyEntity {
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'report_header_id',
  })
  report_header_id: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    name: 'service_charge_name',
  })
  service_charge_name: string;

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

  @ManyToOne(() => ReportHeaderEntity, (header) => header.service_charges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;
}
