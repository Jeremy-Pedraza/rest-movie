// src/modules/director/entities/director.entity.ts

import { Entity, Column, Index } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';

@Entity({ name: 'directors', schema: 'public' })
export class DirectorEntity extends BaseTimestampEntity {
  @Column({ type: 'varchar', length: 150 })
  @Index()
  names: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;
}
