// src/modules/role/role.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SanitizerService, HandleErrorService } from '@shared/common';
import { DEFAULT_ROLES } from '@constants/roles.constant';
import { RoleRepository } from './role.repository';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { IRoleResponse } from './interfaces';
import { RoleEntity } from './entities/role.entity';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async create(dto: CreateRoleDto): Promise<IRoleResponse> {
    try {
      const sanitizedData = {
        name: this.sanitizer.sanitizeString(dto.name),
        description: dto.description ? this.sanitizer.sanitizeString(dto.description) : null,
        isActive: dto.isActive ?? true,
      };

      const role = await this.roleRepository.create(sanitizedData);
      return this.toResponse(role);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando rol');
    }
  }

  async findAll(): Promise<IRoleResponse[]> {
    try {
      const roles = await this.roleRepository.findAll();
      return roles.map((role) => this.toResponse(role));
    } catch (error) {
      throw this.handleError.handle(error, 'Error listando roles');
    }
  }

  async findById(id: string): Promise<IRoleResponse> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      this.handleError.notFound('Rol', id);
    }
    return this.toResponse(role);
  }

  async findByName(name: string): Promise<RoleEntity | null> {
    return this.roleRepository.findByName(name);
  }

  async findByIds(ids: string[]): Promise<RoleEntity[]> {
    return this.roleRepository.findByIds(ids);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<IRoleResponse> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Rol', id);
    }

    try {
      const sanitizedData: Partial<Record<string, unknown>> = {};

      if (dto.name !== undefined) {
        sanitizedData.name = this.sanitizer.sanitizeString(dto.name);
      }
      if (dto.description !== undefined) {
        sanitizedData.description = dto.description
          ? this.sanitizer.sanitizeString(dto.description)
          : null;
      }
      if (dto.isActive !== undefined) {
        sanitizedData.isActive = dto.isActive;
      }

      const updated = await this.roleRepository.update(id, sanitizedData);
      return this.toResponse(updated!);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando rol');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Rol', id);
    }

    try {
      await this.roleRepository.delete(id);
    } catch (error) {
      throw this.handleError.handle(error, 'Error eliminando rol');
    }
  }

  async seedRoles(): Promise<void> {
    for (const roleData of DEFAULT_ROLES) {
      const existing = await this.roleRepository.findByName(roleData.name);
      if (!existing) {
        await this.roleRepository.create({
          name: roleData.name,
          description: roleData.description,
          isActive: true,
        });
        this.logger.log(`Rol '${roleData.name}' creado`);
      }
    }
  }

  private toResponse(role: RoleEntity): IRoleResponse {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
