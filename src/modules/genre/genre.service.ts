// src/modules/genre/genre.service.ts

import { Injectable } from '@nestjs/common';

import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { PaginationMetaDto } from '@shared/common/dto/pagination.dto';
import { GenreRepository } from './genre.repository';
import { CreateGenreDto, UpdateGenreDto, QueryGenreDto } from './dto';
import { IGenreResponse } from './interfaces';

@Injectable()
export class GenreService {
  constructor(
    private readonly genreRepository: GenreRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async create(dto: CreateGenreDto): Promise<IGenreResponse> {
    try {
      const sanitizedData = {
        name: this.sanitizer.sanitizeString(dto.name),
        description: dto.description ? this.sanitizer.sanitizeString(dto.description) : null,
        isActive: dto.isActive ?? true,
      };

      const genre = await this.genreRepository.create(sanitizedData);
      return this.toResponse(genre);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando genero');
    }
  }

  async findAll(query: QueryGenreDto): Promise<IPaginatedResponse<IGenreResponse>> {
    try {
      const { data, total } = await this.genreRepository.findAll(query);
      const meta = new PaginationMetaDto(query.page ?? 1, query.limit ?? 10, total);

      return {
        data: data.map((genre) => this.toResponse(genre)),
        meta,
      };
    } catch (error) {
      throw this.handleError.handle(error, 'Error listando generos');
    }
  }

  async findById(id: string): Promise<IGenreResponse> {
    const genre = await this.genreRepository.findById(id);
    if (!genre) {
      this.handleError.notFound('Genero', id);
    }
    return this.toResponse(genre);
  }

  async update(id: string, dto: UpdateGenreDto): Promise<IGenreResponse> {
    const existing = await this.genreRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Genero', id);
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

      const updated = await this.genreRepository.update(id, sanitizedData);
      return this.toResponse(updated!);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando genero');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.genreRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Genero', id);
    }

    try {
      await this.genreRepository.delete(id);
    } catch (error) {
      throw this.handleError.handle(error, 'Error eliminando genero');
    }
  }

  private toResponse(genre: import('./entities/genre.entity').GenreEntity): IGenreResponse {
    return {
      id: genre.id,
      name: genre.name,
      description: genre.description,
      isActive: genre.isActive,
      createdAt: genre.createdAt,
      updatedAt: genre.updatedAt,
    };
  }
}
