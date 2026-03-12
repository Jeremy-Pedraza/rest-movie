// src/modules/catalog/catalog.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { QUERY_SORT_CONFIGS } from '@constants';
import { resolveOrderBy } from '@shared/utils';
import { MediaEntity } from '@modules/media/entities/media.entity';
import { GenreEntity } from '@modules/genre/entities/genre.entity';
import { TypeEntity } from '@modules/type/entities/type.entity';
import { QueryCatalogDto } from './dto';

@Injectable()
export class CatalogRepository {
  constructor(
    @InjectRepository(MediaEntity)
    private readonly mediaRepository: Repository<MediaEntity>,
    @InjectRepository(GenreEntity)
    private readonly genreRepository: Repository<GenreEntity>,
    @InjectRepository(TypeEntity)
    private readonly typeRepository: Repository<TypeEntity>,
  ) {}

  async findAll(query: QueryCatalogDto): Promise<{ data: MediaEntity[]; total: number }> {
    const qb = this.createMediaQueryBuilder('media');

    qb.leftJoinAndSelect('media.genre', 'genre')
      .leftJoinAndSelect('media.director', 'director')
      .leftJoinAndSelect('media.producer', 'producer')
      .leftJoinAndSelect('media.type', 'type');

    if (query.search) {
      qb.andWhere(
        '(LOWER(media.title) LIKE LOWER(:search) OR LOWER(media.serial) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    if (query.genreId) {
      qb.andWhere('media.genre_id = :genreId', { genreId: query.genreId });
    }
    if (query.typeId) {
      qb.andWhere('media.type_id = :typeId', { typeId: query.typeId });
    }
    if (query.directorId) {
      qb.andWhere('media.director_id = :directorId', { directorId: query.directorId });
    }
    if (query.producerId) {
      qb.andWhere('media.producer_id = :producerId', { producerId: query.producerId });
    }
    if (query.releaseYear) {
      qb.andWhere('media.release_year = :releaseYear', { releaseYear: query.releaseYear });
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, QUERY_SORT_CONFIGS.catalog);
    qb.orderBy(orderBy.column, orderBy.direction);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findFeatured(limit: number = 10): Promise<MediaEntity[]> {
    return this.createMediaQueryBuilder('media')
      .leftJoinAndSelect('media.genre', 'genre')
      .leftJoinAndSelect('media.type', 'type')
      .orderBy('media.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async findById(id: string): Promise<MediaEntity | null> {
    return this.createMediaQueryBuilder('media')
      .leftJoinAndSelect('media.genre', 'genre')
      .leftJoinAndSelect('media.director', 'director')
      .leftJoinAndSelect('media.producer', 'producer')
      .leftJoinAndSelect('media.type', 'type')
      .where('media.id = :id', { id })
      .getOne();
  }

  async findActiveGenres(): Promise<GenreEntity[]> {
    return this.genreRepository
      .createQueryBuilder('genre')
      .select(['genre.id', 'genre.name'])
      .where('genre.is_active = :isActive', { isActive: true })
      .orderBy('genre.name', 'ASC')
      .getMany();
  }

  async findAllTypes(): Promise<TypeEntity[]> {
    return this.typeRepository
      .createQueryBuilder('type')
      .select(['type.id', 'type.name'])
      .orderBy('type.name', 'ASC')
      .getMany();
  }

  private createMediaQueryBuilder(alias: string): SelectQueryBuilder<MediaEntity> {
    return this.mediaRepository.createQueryBuilder(alias);
  }
}
