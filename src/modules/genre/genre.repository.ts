// src/modules/genre/genre.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { GenreEntity } from './entities/genre.entity';
import { QueryGenreDto } from './dto';

@Injectable()
export class GenreRepository {
  constructor(
    @InjectRepository(GenreEntity)
    private readonly repository: Repository<GenreEntity>,
  ) {}

  async create(data: Partial<GenreEntity>): Promise<GenreEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(
    query: QueryGenreDto,
  ): Promise<{ data: GenreEntity[]; total: number }> {
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
    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`genre.${sortBy}`, sortOrder);

    // Paginacion
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<GenreEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<GenreEntity>): Promise<GenreEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<GenreEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
