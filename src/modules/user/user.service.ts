// src/modules/user/user.service.ts

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { HandleErrorService } from '@shared/common';
import { SanitizerService } from '@shared/common';
import { ROLES } from '@constants/roles.constant';
import { RoleService } from '@modules/role/role.service';
import { RoleEntity } from '@modules/role/entities/role.entity';
import { IPaginatedResponse } from '@shared/common';
import { UserRepository } from './user.repository';
import { CreateUserDto, QueryUserDto } from './dto';
import { IUserResponse } from './interfaces';
import { UserEntity } from './entities/user.entity';

interface CreateUserOptions {
  allowPrivilegedRoles?: boolean;
}

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleService: RoleService,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async create(dto: CreateUserDto, options: CreateUserOptions = {}): Promise<UserEntity> {
    try {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
      const hashedPassword = await bcrypt.hash(dto.password, rounds);

      let roles: RoleEntity[] = [];
      if (dto.roleIds && dto.roleIds.length > 0) {
        roles = await this.roleService.findByIds(dto.roleIds);
        if (roles.length !== dto.roleIds.length) {
          this.handleError.badRequest('Uno o más roles no existen');
        }

        const reservedRoles = roles.filter((role) => role.name !== String(ROLES.PUBLICO));
        if (!options.allowPrivilegedRoles && reservedRoles.length > 0) {
          this.handleError.forbidden('No esta permitido asignar roles privilegiados');
        }
      } else {
        const publicRole = await this.roleService.findByName(ROLES.PUBLICO);
        if (!publicRole) {
          this.handleError.internal('Rol publico no configurado');
        }
        roles = [publicRole];
      }

      const user = await this.userRepository.create({
        firstName: this.sanitizer.sanitizeString(dto.firstName),
        lastName: this.sanitizer.sanitizeString(dto.lastName),
        email: this.sanitizer.sanitizeEmail(dto.email),
        password: hashedPassword,
        isActive: dto.isActive ?? true,
        roles,
      });

      return user;
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando usuario');
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findById(id);
  }

  async findAll(query: QueryUserDto): Promise<IPaginatedResponse<IUserResponse>> {
    const result = await this.userRepository.findAll(query);
    return {
      data: result.data.map((u) => this.toResponse(u)),
      meta: result.meta,
    };
  }

  async approve(id: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);
      throw new Error(); // unreachable - satisfies TS
    }
    const updated = await this.userRepository.updateIsActive(id, true);
    return this.toResponse(updated!);
  }

  async deactivate(id: string): Promise<IUserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      this.handleError.notFound('Usuario', id);
      throw new Error(); // unreachable - satisfies TS
    }
    const updated = await this.userRepository.updateIsActive(id, false);
    return this.toResponse(updated!);
  }

  toResponse(user: UserEntity): IUserResponse {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
      roles: (user.roles || []).map((r) => ({ id: r.id, name: r.name })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
