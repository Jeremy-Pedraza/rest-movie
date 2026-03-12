// src/modules/media/media.service.ts

import { Injectable } from '@nestjs/common';

import { DirectorRepository } from '@modules/director/director.repository';
import { GenreRepository } from '@modules/genre/genre.repository';
import { ProducerRepository } from '@modules/producer/producer.repository';
import { TypeRepository } from '@modules/type/type.repository';
import { HandleErrorService, IPaginatedResponse, SanitizerService } from '@shared/common';
import { PaginationMetaDto } from '@shared/common/dto/pagination.dto';
import { CreateMediaDto, QueryMediaDto, UpdateMediaDto } from './dto';
import { MediaEntity } from './entities/media.entity';
import { IMediaResponse } from './interfaces';
import { MediaRepository } from './media.repository';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly genreRepository: GenreRepository,
    private readonly directorRepository: DirectorRepository,
    private readonly producerRepository: ProducerRepository,
    private readonly typeRepository: TypeRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async create(dto: CreateMediaDto): Promise<IMediaResponse> {
    // Validar FKs
    await this.validateRelations(dto.genreId, dto.directorId, dto.producerId, dto.typeId);

    try {
      const sanitizedData = {
        serial: this.sanitizer.sanitizeString(dto.serial),
        title: this.sanitizer.sanitizeString(dto.title),
        synopsis: dto.synopsis ? this.sanitizer.sanitizeString(dto.synopsis) : null,
        url: dto.url.trim(),
        coverImage: dto.coverImage ? dto.coverImage.trim() : null,
        releaseYear: dto.releaseYear,
        genreId: dto.genreId,
        directorId: dto.directorId,
        producerId: dto.producerId,
        typeId: dto.typeId,
      };

      const media = await this.mediaRepository.create(sanitizedData);
      // Recargar con relaciones
      const full = await this.mediaRepository.findById(media.id);
      return this.toResponse(full!);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando media');
    }
  }

  async findAll(query: QueryMediaDto): Promise<IPaginatedResponse<IMediaResponse>> {
    try {
      const { data, total } = await this.mediaRepository.findAll(query);
      const meta = new PaginationMetaDto(query.page ?? 1, query.limit ?? 10, total);

      return {
        data: data.map((media) => this.toResponse(media)),
        meta,
      };
    } catch (error) {
      throw this.handleError.handle(error, 'Error listando media');
    }
  }

  async findById(id: string): Promise<IMediaResponse> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      this.handleError.notFound('Media', id);
    }
    return this.toResponse(media);
  }

  async update(id: string, dto: UpdateMediaDto): Promise<IMediaResponse> {
    const existing = await this.mediaRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Media', id);
    }

    // Validar FKs si se proporcionan
    await this.validateRelations(
      dto.genreId ?? existing.genreId,
      dto.directorId ?? existing.directorId,
      dto.producerId ?? existing.producerId,
      dto.typeId ?? existing.typeId,
    );

    try {
      const sanitizedData: Partial<Record<string, unknown>> = {};

      if (dto.serial !== undefined) {
        sanitizedData.serial = this.sanitizer.sanitizeString(dto.serial);
      }
      if (dto.title !== undefined) {
        sanitizedData.title = this.sanitizer.sanitizeString(dto.title);
      }
      if (dto.synopsis !== undefined) {
        sanitizedData.synopsis = dto.synopsis ? this.sanitizer.sanitizeString(dto.synopsis) : null;
      }
      if (dto.url !== undefined) {
        sanitizedData.url = dto.url.trim();
      }
      if (dto.coverImage !== undefined) {
        sanitizedData.coverImage = dto.coverImage ? dto.coverImage.trim() : null;
      }
      if (dto.releaseYear !== undefined) {
        sanitizedData.releaseYear = dto.releaseYear;
      }
      if (dto.genreId !== undefined) {
        sanitizedData.genreId = dto.genreId;
      }
      if (dto.directorId !== undefined) {
        sanitizedData.directorId = dto.directorId;
      }
      if (dto.producerId !== undefined) {
        sanitizedData.producerId = dto.producerId;
      }
      if (dto.typeId !== undefined) {
        sanitizedData.typeId = dto.typeId;
      }

      const updated = await this.mediaRepository.update(id, sanitizedData);
      return this.toResponse(updated!);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando media');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.mediaRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Media', id);
    }

    try {
      await this.mediaRepository.delete(id);
    } catch (error) {
      throw this.handleError.handle(error, 'Error eliminando media');
    }
  }

  /**
   * Valida que las relaciones FK existan y esten activas
   */
  private async validateRelations(
    genreId: string,
    directorId: string,
    producerId: string,
    typeId: string,
  ): Promise<void> {
    // Validar genero (debe existir y estar activo)
    const genre = await this.genreRepository.findById(genreId);
    if (!genre) {
      this.handleError.badRequest(`El genero con ID '${genreId}' no existe`);
    }
    if (!genre.isActive) {
      this.handleError.badRequest(`El genero '${genre.name}' no esta activo`);
    }

    // Validar director (debe existir y estar activo)
    const director = await this.directorRepository.findById(directorId);
    if (!director) {
      this.handleError.badRequest(`El director con ID '${directorId}' no existe`);
    }
    if (!director.isActive) {
      this.handleError.badRequest(`El director '${director.names}' no esta activo`);
    }

    // Validar productora (debe existir)
    const producer = await this.producerRepository.findById(producerId);
    if (!producer) {
      this.handleError.badRequest(`La productora con ID '${producerId}' no existe`);
    }

    // Validar tipo (debe existir)
    const type = await this.typeRepository.findById(typeId);
    if (!type) {
      this.handleError.badRequest(`El tipo con ID '${typeId}' no existe`);
    }
  }

  private toResponse(media: MediaEntity): IMediaResponse {
    return {
      id: media.id,
      serial: media.serial,
      title: media.title,
      synopsis: media.synopsis,
      url: media.url,
      coverImage: media.coverImage,
      releaseYear: media.releaseYear,
      genreId: media.genreId,
      directorId: media.directorId,
      producerId: media.producerId,
      typeId: media.typeId,
      genre: media.genre ? { id: media.genre.id, name: media.genre.name } : undefined,
      director: media.director ? { id: media.director.id, names: media.director.names } : undefined,
      producer: media.producer ? { id: media.producer.id, name: media.producer.name } : undefined,
      type: media.type ? { id: media.type.id, name: media.type.name } : undefined,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
