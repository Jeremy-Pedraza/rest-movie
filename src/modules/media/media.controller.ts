// src/modules/media/media.controller.ts

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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { IApiResponse, IPaginatedResponse } from '@shared/common';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { ROLES } from '@constants/roles.constant';
import { Roles } from '@decorators/roles.decorator';
import { MediaService } from './media.service';
import { CreateMediaDto, UpdateMediaDto, QueryMediaDto } from './dto';
import { IMediaResponse } from './interfaces';

@ApiTags('Media')
@ApiBearerAuth()
@Roles(ROLES.ADMINISTRADOR)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo media (pelicula/serie)' })
  @ApiResponse({ status: 201, description: 'Media creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos invalidos o FK no existe' })
  @ApiResponse({ status: 409, description: 'Serial o URL duplicado' })
  async create(@Body() dto: CreateMediaDto): Promise<IApiResponse<IMediaResponse>> {
    const data = await this.mediaService.create(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar media con paginacion, filtros y relaciones' })
  @ApiResponse({ status: 200, description: 'Lista de media' })
  async findAll(
    @Query() query: QueryMediaDto,
  ): Promise<IApiResponse<IPaginatedResponse<IMediaResponse>>> {
    const data = await this.mediaService.findAll(query);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un media por ID (con relaciones)' })
  @ApiParam({ name: 'id', description: 'UUID del media' })
  @ApiResponse({ status: 200, description: 'Media encontrado' })
  @ApiResponse({ status: 404, description: 'Media no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IMediaResponse>> {
    const data = await this.mediaService.findById(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un media' })
  @ApiParam({ name: 'id', description: 'UUID del media' })
  @ApiResponse({ status: 200, description: 'Media actualizado' })
  @ApiResponse({ status: 404, description: 'Media no encontrado' })
  @ApiResponse({ status: 400, description: 'FK no existe o no activa' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<IApiResponse<IMediaResponse>> {
    const data = await this.mediaService.update(id, dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.UPDATED,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un media' })
  @ApiParam({ name: 'id', description: 'UUID del media' })
  @ApiResponse({ status: 200, description: 'Media eliminado' })
  @ApiResponse({ status: 404, description: 'Media no encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<void>> {
    await this.mediaService.delete(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.DELETED,
    };
  }
}
