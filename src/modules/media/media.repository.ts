// src/modules/media/media.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { MediaEntity } from './entities/media.entity';
import { QueryMediaDto } from './dto';

@Injectable()
export class MediaRepository {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly repository: Repository<MediaEntity>,
  ) {}

  async create(data: Partial<MediaEntity>): Promise<MediaEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(
    query: QueryMediaDto,
  ): Promise<{ data: MediaEntity[]; total: number }> {
    const qb = this.createBaseQueryBuilder('media');

    // Cargar relaciones
    qb.leftJoinAndSelect('media.genre', 'genre')
      .leftJoinAndSelect('media.director', 'director')
      .leftJoinAndSelect('media.producer', 'producer')
      .leftJoinAndSelect('media.type', 'type');

    // Busqueda por titulo o serial
    if (query.search) {
      qb.andWhere(
        '(LOWER(media.title) LIKE LOWER(:search) OR LOWER(media.serial) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    // Filtros por FK
    if (query.genreId) {
      qb.andWhere('media.genre_id = :genreId', { genreId: query.genreId });
    }
    if (query.directorId) {
      qb.andWhere('media.director_id = :directorId', { directorId: query.directorId });
    }
    if (query.producerId) {
      qb.andWhere('media.producer_id = :producerId', { producerId: query.producerId });
    }
    if (query.typeId) {
      qb.andWhere('media.type_id = :typeId', { typeId: query.typeId });
    }
    if (query.releaseYear) {
      qb.andWhere('media.release_year = :releaseYear', { releaseYear: query.releaseYear });
    }

    // Ordenamiento
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`media.${sortBy}`, sortOrder);

    // Paginacion
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<MediaEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['genre', 'director', 'producer', 'type'],
    });
  }

  async update(id: string, data: Partial<MediaEntity>): Promise<MediaEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<MediaEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
