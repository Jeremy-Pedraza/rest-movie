// src/modules/type/type.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { PaginationMetaDto } from '@shared/common/dto/pagination.dto';
import { TypeRepository } from './type.repository';
import { CreateTypeDto, UpdateTypeDto, QueryTypeDto } from './dto';
import { ITypeResponse } from './interfaces';

@Injectable()
export class TypeService {
  private readonly logger = new Logger(TypeService.name);

  constructor(
    private readonly typeRepository: TypeRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async create(dto: CreateTypeDto): Promise<ITypeResponse> {
    try {
      const sanitizedData = {
        name: this.sanitizer.sanitizeString(dto.name),
        description: dto.description ? this.sanitizer.sanitizeString(dto.description) : null,
      };

      const type = await this.typeRepository.create(sanitizedData);
      return this.toResponse(type);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando tipo');
    }
  }

  async findAll(query: QueryTypeDto): Promise<IPaginatedResponse<ITypeResponse>> {
    try {
      const { data, total } = await this.typeRepository.findAll(query);
      const meta = new PaginationMetaDto(query.page ?? 1, query.limit ?? 10, total);

      return {
        data: data.map((type) => this.toResponse(type)),
        meta,
      };
    } catch (error) {
      throw this.handleError.handle(error, 'Error listando tipos');
    }
  }

  async findById(id: string): Promise<ITypeResponse> {
    const type = await this.typeRepository.findById(id);
    if (!type) {
      this.handleError.notFound('Tipo', id);
    }
    return this.toResponse(type);
  }

  async update(id: string, dto: UpdateTypeDto): Promise<ITypeResponse> {
    const existing = await this.typeRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Tipo', id);
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

      const updated = await this.typeRepository.update(id, sanitizedData);
      return this.toResponse(updated!);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando tipo');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.typeRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Tipo', id);
    }

    try {
      await this.typeRepository.delete(id);
    } catch (error) {
      throw this.handleError.handle(error, 'Error eliminando tipo');
    }
  }

  private toResponse(type: import('./entities/type.entity').TypeEntity): ITypeResponse {
    return {
      id: type.id,
      name: type.name,
      description: type.description,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    };
  }
}
