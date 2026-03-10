// src/modules/genre/genre.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { QUERY_SORT_CONFIGS } from '@constants';
import { resolveOrderBy } from '@shared/utils';
import { GenreEntity } from './entities/genre.entity';
import { QueryGenreDto } from './dto';

@Injectable()
export class GenreRepository {
  constructor(
    @InjectRepository(GenreEntity)
    private readonly repository: Repository<GenreEntity>,
  ) {}

  async create(data: Partial<GenreEntity>): Promise<GenreEntity> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .into(GenreEntity)
      .values(data)
      .returning('id')
      .execute();

    const id = result.identifiers[0]?.id as string | undefined;
    if (!id) {
      throw new Error('No se pudo obtener el ID del genero insertado');
    }

    return (await this.findById(id)) as GenreEntity;
  }

  async findAll(query: QueryGenreDto): Promise<{ data: GenreEntity[]; total: number }> {
    const qb = this.createBaseQueryBuilder('genre');

    // Filtro por busqueda
    if (query.search) {
      qb.andWhere('LOWER(genre.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    // Filtro por estado
    if (query.isActive !== undefined) {
      qb.andWhere('genre.is_active = :isActive', { isActive: query.isActive });
    }

    // Ordenamiento
    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, QUERY_SORT_CONFIGS.genre);
    qb.orderBy(orderBy.column, orderBy.direction);

    // Paginacion
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<GenreEntity | null> {
    return this.repository.createQueryBuilder('genre').where('genre.id = :id', { id }).getOne();
  }

  async update(id: string, data: Partial<GenreEntity>): Promise<GenreEntity | null> {
    await this.repository
      .createQueryBuilder()
      .update(GenreEntity)
      .set(data)
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(GenreEntity)
      .where('id = :id', { id })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<GenreEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
