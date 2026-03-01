// src/modules/type/type.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { TypeEntity } from './entities/type.entity';
import { QueryTypeDto } from './dto';

@Injectable()
export class TypeRepository {
  constructor(
    @InjectRepository(TypeEntity)
    private readonly repository: Repository<TypeEntity>,
  ) {}

  async create(data: Partial<TypeEntity>): Promise<TypeEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(
    query: QueryTypeDto,
  ): Promise<{ data: TypeEntity[]; total: number }> {
    const qb = this.createBaseQueryBuilder('type');

    if (query.search) {
      qb.andWhere('LOWER(type.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`type.${sortBy}`, sortOrder);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<TypeEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<TypeEntity>): Promise<TypeEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<TypeEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
