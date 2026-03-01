// src/modules/type/entities/type.entity.ts

import { Entity, Column, Index } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';

@Entity({ name: 'types', schema: 'public' })
export class TypeEntity extends BaseTimestampEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
