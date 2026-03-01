// src/modules/director/director.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { DirectorEntity } from './entities/director.entity';
import { QueryDirectorDto } from './dto';

@Injectable()
export class DirectorRepository {
  constructor(
    @InjectRepository(DirectorEntity)
    private readonly repository: Repository<DirectorEntity>,
  ) {}

  async create(data: Partial<DirectorEntity>): Promise<DirectorEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(
    query: QueryDirectorDto,
  ): Promise<{ data: DirectorEntity[]; total: number }> {
    const qb = this.createBaseQueryBuilder('director');

    if (query.search) {
      qb.andWhere('LOWER(director.names) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('director.is_active = :isActive', { isActive: query.isActive });
    }

    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`director.${sortBy}`, sortOrder);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<DirectorEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<DirectorEntity>): Promise<DirectorEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<DirectorEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
