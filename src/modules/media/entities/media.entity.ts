// src/modules/media/entities/media.entity.ts

import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';
import { GenreEntity } from '@modules/genre/entities/genre.entity';
import { DirectorEntity } from '@modules/director/entities/director.entity';
import { ProducerEntity } from '@modules/producer/entities/producer.entity';
import { TypeEntity } from '@modules/type/entities/type.entity';

@Entity({ name: 'media', schema: 'public' })
export class MediaEntity extends BaseTimestampEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  serial: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  synopsis: string | null;

  @Column({ type: 'varchar', length: 500, unique: true })
  url: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'cover_image' })
  coverImage: string | null;

  @Column({ type: 'int', name: 'release_year' })
  releaseYear: number;

  @Column({ type: 'uuid', name: 'genre_id' })
  genreId: string;

  @Column({ type: 'uuid', name: 'director_id' })
  directorId: string;

  @Column({ type: 'uuid', name: 'producer_id' })
  producerId: string;

  @Column({ type: 'uuid', name: 'type_id' })
  typeId: string;

  @ManyToOne(() => GenreEntity, { eager: false })
  @JoinColumn({ name: 'genre_id' })
  genre: GenreEntity;

  @ManyToOne(() => DirectorEntity, { eager: false })
  @JoinColumn({ name: 'director_id' })
  director: DirectorEntity;

  @ManyToOne(() => ProducerEntity, { eager: false })
  @JoinColumn({ name: 'producer_id' })
  producer: ProducerEntity;

  @ManyToOne(() => TypeEntity, { eager: false })
  @JoinColumn({ name: 'type_id' })
  type: TypeEntity;
}
