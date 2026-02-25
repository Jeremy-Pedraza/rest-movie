// src/modules/reports/entities/category-sales.entity.ts

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';
import { ReportHeaderEntity } from './report-header.entity';

@Entity({ name: 'report_category_sales' })
@Index(['report_header_id'])
@Index(['category_id'])
export class CategorySalesEntity extends BaseReadOnlyEntity {
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'report_header_id',
  })
  report_header_id: string;

  @Column({
    type: 'int',
    nullable: false,
    name: 'category_id',
  })
  category_id: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    name: 'category_name',
  })
  category_name: string;

  @Column({
    type: 'int',
    default: 0,
    name: 'items_sold',
  })
  items_sold: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'total_sales',
  })
  total_sales: number;

  // ============================================
  // RELACIONES
  // ============================================

  @ManyToOne(() => ReportHeaderEntity, (header) => header.category_sales, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'report_header_id' })
  report_header?: ReportHeaderEntity;

}
