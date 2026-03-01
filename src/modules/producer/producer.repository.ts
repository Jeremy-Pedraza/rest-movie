// src/modules/producer/producer.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { ProducerEntity } from './entities/producer.entity';
import { QueryProducerDto } from './dto';

@Injectable()
export class ProducerRepository {
  constructor(
    @InjectRepository(ProducerEntity)
    private readonly repository: Repository<ProducerEntity>,
  ) {}

  async create(data: Partial<ProducerEntity>): Promise<ProducerEntity> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(
    query: QueryProducerDto,
  ): Promise<{ data: ProducerEntity[]; total: number }> {
    const qb = this.createBaseQueryBuilder('producer');

    if (query.search) {
      qb.andWhere('LOWER(producer.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('producer.is_active = :isActive', { isActive: query.isActive });
    }

    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`producer.${sortBy}`, sortOrder);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<ProducerEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<ProducerEntity>): Promise<ProducerEntity | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<ProducerEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
