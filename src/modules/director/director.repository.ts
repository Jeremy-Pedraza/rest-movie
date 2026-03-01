// src/modules/director/director.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { QueryDirectorDto } from './dto';
import { DirectorEntity } from './entities/director.entity';

@Injectable()
export class DirectorRepository {
  constructor(
    @InjectRepository(DirectorEntity)
    private readonly repository: Repository<DirectorEntity>,
  ) {}

  async create(data: Partial<DirectorEntity>): Promise<DirectorEntity> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .into(DirectorEntity)
      .values(data)
      .returning('id')
      .execute();

    const id = result.identifiers[0]?.id as string | undefined;
    if (!id) {
      throw new Error('No se pudo obtener el ID del director insertado');
    }

    return (await this.findById(id)) as DirectorEntity;
  }

  async findAll(query: QueryDirectorDto): Promise<{ data: DirectorEntity[]; total: number }> {
    const qb = this.createBaseQueryBuilder('director');

    if (query.search) {
      qb.andWhere('LOWER(director.names) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('director.is_active = :isActive', { isActive: query.isActive });
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`director.${sortBy}`, sortOrder);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<DirectorEntity | null> {
    return this.repository
      .createQueryBuilder('director')
      .where('director.id = :id', { id })
      .getOne();
  }

  async update(id: string, data: Partial<DirectorEntity>): Promise<DirectorEntity | null> {
    await this.repository
      .createQueryBuilder()
      .update(DirectorEntity)
      .set(data)
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(DirectorEntity)
      .where('id = :id', { id })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  private createBaseQueryBuilder(alias: string): SelectQueryBuilder<DirectorEntity> {
    return this.repository.createQueryBuilder(alias);
  }
}
