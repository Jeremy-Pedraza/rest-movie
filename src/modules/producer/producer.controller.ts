// src/modules/producer/producer.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

import { Public } from '@decorators/public.decorator';
import { IApiResponse, IPaginatedResponse } from '@shared/common';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { ProducerService } from './producer.service';
import { CreateProducerDto, UpdateProducerDto, QueryProducerDto } from './dto';
import { IProducerResponse } from './interfaces';

@ApiTags('Producers')
@Controller('producers')
export class ProducerController {
  constructor(private readonly producerService: ProducerService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva productora' })
  @ApiResponse({ status: 201, description: 'Productora creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  @ApiResponse({ status: 409, description: 'La productora ya existe' })
  async create(@Body() dto: CreateProducerDto): Promise<IApiResponse<IProducerResponse>> {
    const data = await this.producerService.create(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.CREATED,
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar productoras con paginacion y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de productoras' })
  async findAll(
    @Query() query: QueryProducerDto,
  ): Promise<IApiResponse<IPaginatedResponse<IProducerResponse>>> {
    const data = await this.producerService.findAll(query);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una productora por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la productora' })
  @ApiResponse({ status: 200, description: 'Productora encontrada' })
  @ApiResponse({ status: 404, description: 'Productora no encontrada' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<IProducerResponse>> {
    const data = await this.producerService.findById(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una productora' })
  @ApiParam({ name: 'id', description: 'UUID de la productora' })
  @ApiResponse({ status: 200, description: 'Productora actualizada' })
  @ApiResponse({ status: 404, description: 'Productora no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProducerDto,
  ): Promise<IApiResponse<IProducerResponse>> {
    const data = await this.producerService.update(id, dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.UPDATED,
      data,
    };
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una productora' })
  @ApiParam({ name: 'id', description: 'UUID de la productora' })
  @ApiResponse({ status: 200, description: 'Productora eliminada' })
  @ApiResponse({ status: 404, description: 'Productora no encontrada' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<void>> {
    await this.producerService.delete(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.DELETED,
    };
  }
}
