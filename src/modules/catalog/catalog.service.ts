// src/modules/catalog/catalog.service.ts

import { Injectable } from '@nestjs/common';

import { HandleErrorService, IPaginatedResponse } from '@shared/common';
import { PaginationMetaDto } from '@shared/common/dto/pagination.dto';
import { MediaEntity } from '@modules/media/entities/media.entity';
import { QueryCatalogDto } from './dto';
import {
  ICatalogItemResponse,
  ICatalogDetailResponse,
  ICatalogFeaturedResponse,
  ICatalogFilterResponse,
} from './interfaces';
import { CatalogRepository } from './catalog.repository';

@Injectable()
export class CatalogService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly handleError: HandleErrorService,
  ) {}

  async findAll(query: QueryCatalogDto): Promise<IPaginatedResponse<ICatalogItemResponse>> {
    try {
      const { data, total } = await this.catalogRepository.findAll(query);
      const meta = new PaginationMetaDto(query.page ?? 1, query.limit ?? 20, total);

      return {
        data: data.map((media) => this.toListResponse(media)),
        meta,
      };
    } catch (error) {
      throw this.handleError.handle(error, 'Error retrieving catalog');
    }
  }

  async findFeatured(): Promise<ICatalogFeaturedResponse[]> {
    try {
      const data = await this.catalogRepository.findFeatured(10);
      return data.map((media) => this.toFeaturedResponse(media));
    } catch (error) {
      throw this.handleError.handle(error, 'Error retrieving featured media');
    }
  }

  async findById(id: string, isAuthenticated: boolean): Promise<ICatalogDetailResponse> {
    const media = await this.catalogRepository.findById(id);
    if (!media) {
      this.handleError.notFound('Media', id);
    }
    return this.toDetailResponse(media, isAuthenticated);
  }

  async findActiveGenres(): Promise<ICatalogFilterResponse[]> {
    try {
      const genres = await this.catalogRepository.findActiveGenres();
      return genres.map((g) => ({ id: g.id, name: g.name }));
    } catch (error) {
      throw this.handleError.handle(error, 'Error retrieving genres');
    }
  }

  async findAllTypes(): Promise<ICatalogFilterResponse[]> {
    try {
      const types = await this.catalogRepository.findAllTypes();
      return types.map((t) => ({ id: t.id, name: t.name }));
    } catch (error) {
      throw this.handleError.handle(error, 'Error retrieving types');
    }
  }

  private toListResponse(media: MediaEntity): ICatalogItemResponse {
    return {
      id: media.id,
      serial: media.serial,
      title: media.title,
      synopsis: media.synopsis,
      coverImage: media.coverImage,
      releaseYear: media.releaseYear,
      genre: { id: media.genre.id, name: media.genre.name },
      director: { id: media.director.id, names: media.director.names },
      producer: { id: media.producer.id, name: media.producer.name },
      type: { id: media.type.id, name: media.type.name },
    };
  }

  private toDetailResponse(media: MediaEntity, _includeUrl: boolean): ICatalogDetailResponse {
    const response: ICatalogDetailResponse = this.toListResponse(media);
    response.url = media.url;
    return response;
  }

  private toFeaturedResponse(media: MediaEntity): ICatalogFeaturedResponse {
    return {
      id: media.id,
      title: media.title,
      synopsis: media.synopsis,
      coverImage: media.coverImage,
      releaseYear: media.releaseYear,
      genre: { id: media.genre.id, name: media.genre.name },
      type: { id: media.type.id, name: media.type.name },
    };
  }
}
