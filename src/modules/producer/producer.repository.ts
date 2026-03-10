// src/modules/producer/producer.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { QUERY_SORT_CONFIGS } from '@constants';
import { resolveOrderBy } from '@shared/utils';
import { ProducerEntity } from './entities/producer.entity';
import { QueryProducerDto } from './dto';

@Injectable()
export class ProducerRepository {
  constructor(
    @InjectRepository(ProducerEntity)
    private readonly repository: Repository<ProducerEntity>,
  ) {}

  async create(data: Partial<ProducerEntity>): Promise<ProducerEntity> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .into(ProducerEntity)
      .values(data)
      .returning('id')
      .execute();

    const id = result.identifiers[0]?.id as string | undefined;
    if (!id) {
      throw new Error('No se pudo obtener el ID de la productora insertada');
    }

    return (await this.findById(id)) as ProducerEntity;
  }

  async findAll(query: QueryProducerDto): Promise<{ data: ProducerEntity[]; total: number }> {
    const qb = this.createBaseQueryBuilder('producer');

    if (query.search) {
      qb.andWhere('LOWER(producer.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('producer.is_active = :isActive', { isActive: query.isActive });
    }

    const orderBy = resolveOrderBy(query.sortBy, query.sortOrder, QUERY_SORT_CONFIGS.producer);
    qb.orderBy(orderBy.column, orderBy.direction);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<ProducerEntity | null> {
    return this.repository
      .createQueryBuilder('producer')
      .where('producer.id = :id', { id })
      .getOne();
  }

  async update(id: string, data: Partial<ProducerEntity>): Promise<ProducerEntity | null> {
    await this.repository
      .createQueryBuilder()
      .update(ProducerEntity)
      .set(data)
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(ProducerEntity)
      .where('id = :id', { id })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<ProducerEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
