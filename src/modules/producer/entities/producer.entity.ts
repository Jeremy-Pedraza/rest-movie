// src/modules/producer/entities/producer.entity.ts

import { Entity, Column, Index } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';

@Entity({ name: 'producers', schema: 'public' })
export class ProducerEntity extends BaseTimestampEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slogan: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;
}
