// src/modules/genre/entities/genre.entity.ts

import { Entity, Column, Index } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';

@Entity({ name: 'genres', schema: 'public' })
export class GenreEntity extends BaseTimestampEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;
}
