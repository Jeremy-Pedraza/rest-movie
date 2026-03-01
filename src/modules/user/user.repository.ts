// src/modules/user/user.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from './entities/user.entity';
import { RoleEntity } from '@modules/role/entities/role.entity';

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
