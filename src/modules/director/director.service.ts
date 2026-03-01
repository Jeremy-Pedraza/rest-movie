// src/modules/director/director.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { PaginationMetaDto } from '@shared/common/dto/pagination.dto';
import { DirectorRepository } from './director.repository';
import { CreateDirectorDto, UpdateDirectorDto, QueryDirectorDto } from './dto';
import { IDirectorResponse } from './interfaces';

@Injectable()
export class DirectorService {
  private readonly logger = new Logger(DirectorService.name);

  constructor(
    private readonly directorRepository: DirectorRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async create(dto: CreateDirectorDto): Promise<IDirectorResponse> {
    try {
      const sanitizedData = {
        names: this.sanitizer.sanitizeString(dto.names),
        isActive: true,
      };

      const director = await this.directorRepository.create(sanitizedData);
      return this.toResponse(director);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando director');
    }
  }

  async findAll(query: QueryDirectorDto): Promise<IPaginatedResponse<IDirectorResponse>> {
    try {
      const { data, total } = await this.directorRepository.findAll(query);
      const meta = new PaginationMetaDto(query.page ?? 1, query.limit ?? 10, total);

      return {
        data: data.map((director) => this.toResponse(director)),
        meta,
      };
    } catch (error) {
      throw this.handleError.handle(error, 'Error listando directores');
    }
  }

  async findById(id: string): Promise<IDirectorResponse> {
    const director = await this.directorRepository.findById(id);
    if (!director) {
      this.handleError.notFound('Director', id);
    }
    return this.toResponse(director);
  }

  async update(id: string, dto: UpdateDirectorDto): Promise<IDirectorResponse> {
    const existing = await this.directorRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Director', id);
    }

    try {
      const sanitizedData: Partial<Record<string, unknown>> = {};

      if (dto.names !== undefined) {
        sanitizedData.names = this.sanitizer.sanitizeString(dto.names);
      }
      if (dto.isActive !== undefined) {
        sanitizedData.isActive = dto.isActive;
      }

      const updated = await this.directorRepository.update(id, sanitizedData);
      return this.toResponse(updated!);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando director');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.directorRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Director', id);
    }

    try {
      await this.directorRepository.delete(id);
    } catch (error) {
      throw this.handleError.handle(error, 'Error eliminando director');
    }
  }

  private toResponse(director: import('./entities/director.entity').DirectorEntity): IDirectorResponse {
    return {
      id: director.id,
      names: director.names,
      isActive: director.isActive,
      createdAt: director.createdAt,
      updatedAt: director.updatedAt,
    };
  }
}
