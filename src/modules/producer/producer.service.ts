// src/modules/producer/producer.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { PaginationMetaDto } from '@shared/common/dto/pagination.dto';
import { ProducerRepository } from './producer.repository';
import { CreateProducerDto, UpdateProducerDto, QueryProducerDto } from './dto';
import { IProducerResponse } from './interfaces';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(
    private readonly producerRepository: ProducerRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  async create(dto: CreateProducerDto): Promise<IProducerResponse> {
    try {
      const sanitizedData = {
        name: this.sanitizer.sanitizeString(dto.name),
        slogan: dto.slogan ? this.sanitizer.sanitizeString(dto.slogan) : null,
        description: dto.description ? this.sanitizer.sanitizeString(dto.description) : null,
        isActive: true,
      };

      const producer = await this.producerRepository.create(sanitizedData);
      return this.toResponse(producer);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando productora');
    }
  }

  async findAll(query: QueryProducerDto): Promise<IPaginatedResponse<IProducerResponse>> {
    try {
      const { data, total } = await this.producerRepository.findAll(query);
      const meta = new PaginationMetaDto(query.page ?? 1, query.limit ?? 10, total);

      return {
        data: data.map((producer) => this.toResponse(producer)),
        meta,
      };
    } catch (error) {
      throw this.handleError.handle(error, 'Error listando productoras');
    }
  }

  async findById(id: string): Promise<IProducerResponse> {
    const producer = await this.producerRepository.findById(id);
    if (!producer) {
      this.handleError.notFound('Productora', id);
    }
    return this.toResponse(producer);
  }

  async update(id: string, dto: UpdateProducerDto): Promise<IProducerResponse> {
    const existing = await this.producerRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Productora', id);
    }

    try {
      const sanitizedData: Partial<Record<string, unknown>> = {};

      if (dto.name !== undefined) {
        sanitizedData.name = this.sanitizer.sanitizeString(dto.name);
      }
      if (dto.slogan !== undefined) {
        sanitizedData.slogan = dto.slogan ? this.sanitizer.sanitizeString(dto.slogan) : null;
      }
      if (dto.description !== undefined) {
        sanitizedData.description = dto.description
          ? this.sanitizer.sanitizeString(dto.description)
          : null;
      }
      if (dto.isActive !== undefined) {
        sanitizedData.isActive = dto.isActive;
      }

      const updated = await this.producerRepository.update(id, sanitizedData);
      return this.toResponse(updated!);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando productora');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.producerRepository.findById(id);
    if (!existing) {
      this.handleError.notFound('Productora', id);
    }

    try {
      await this.producerRepository.delete(id);
    } catch (error) {
      throw this.handleError.handle(error, 'Error eliminando productora');
    }
  }

  private toResponse(producer: import('./entities/producer.entity').ProducerEntity): IProducerResponse {
    return {
      id: producer.id,
      name: producer.name,
      slogan: producer.slogan,
      description: producer.description,
      isActive: producer.isActive,
      createdAt: producer.createdAt,
      updatedAt: producer.updatedAt,
    };
  }
}
