// src/modules/reports/entities/employee-sales.entity.ts

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

@Entity({ name: 'report_employee_sales' })
@Index(['report_header_id'])
@Index(['employee_id'])
export class EmployeeSalesEntity extends BaseReadOnlyEntity {
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'report_header_id',
  })
  report_header_id: string;

  @Column({
    type: 'int',
    nullable: false,
    name: 'employee_id',
  })
  employee_id: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    name: 'employee_name',
  })
  employee_name: string;

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
    name: 'gross_sales',
  })
  gross_sales: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_tax',
  })
  total_tax: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'net_sales',
  })
  net_sales: number;

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

  @ManyToOne(() => ReportHeaderEntity, (header) => header.employee_sales, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;

}
