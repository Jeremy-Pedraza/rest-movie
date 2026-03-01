// src/modules/role/role.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RoleEntity } from './entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {}

  async create(data: Partial<RoleEntity>): Promise<RoleEntity> {
    const result = await this.repository
      .createQueryBuilder()
      .insert()
      .into(RoleEntity)
      .values(data)
      .returning('id')
      .execute();

    const id = result.identifiers[0]?.id as string | undefined;
    if (!id) return this.repository.create(data);

    return (await this.findById(id)) as RoleEntity;
  }

  async findAll(): Promise<RoleEntity[]> {
    return this.repository.createQueryBuilder('role').orderBy('role.name', 'ASC').getMany();
  }

  async findById(id: string): Promise<RoleEntity | null> {
    return this.repository.createQueryBuilder('role').where('role.id = :id', { id }).getOne();
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.repository
      .createQueryBuilder('role')
      .where('LOWER(role.name) = LOWER(:name)', { name })
      .getOne();
  }

  async findByIds(ids: string[]): Promise<RoleEntity[]> {
    return this.repository
      .createQueryBuilder('role')
      .where('role.id IN (:...ids)', { ids })
      .getMany();
  }

  async update(id: string, data: Partial<RoleEntity>): Promise<RoleEntity | null> {
    await this.repository
      .createQueryBuilder()
      .update(RoleEntity)
      .set(data)
      .where('id = :id', { id })
      .execute();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(RoleEntity)
      .where('id = :id', { id })
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
