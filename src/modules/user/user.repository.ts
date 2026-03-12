// src/modules/user/user.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { IPaginatedResponse } from '@shared/common';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from '@modules/role/entities/role.entity';
import { QueryUserDto } from './dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.repository.create(data);
    const saved = await this.repository.save(user);
    return (await this.findById(saved.id)) as UserEntity;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.roles', 'role')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async findAll(query: QueryUserDto): Promise<IPaginatedResponse<UserEntity>> {
    const qb: SelectQueryBuilder<UserEntity> = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role');

    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    qb.orderBy(`user.${query.sortBy || 'createdAt'}`, query.sortOrder || 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async updateIsActive(id: string, isActive: boolean): Promise<UserEntity | null> {
    await this.repository.update(id, { isActive });
    return this.findById(id);
  }

  async attachRoles(userId: string, roles: RoleEntity[]): Promise<void> {
    const user = await this.repository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (user) {
      user.roles = roles;
      await this.repository.save(user);
    }
  }
}
