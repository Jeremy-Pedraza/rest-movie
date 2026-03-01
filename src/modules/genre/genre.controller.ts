// src/modules/genre/genre.controller.ts

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
import { GenreService } from './genre.service';
import { CreateGenreDto, UpdateGenreDto, QueryGenreDto } from './dto';
import { IGenreResponse } from './interfaces';

@ApiTags('Genres')
@ApiBearerAuth()
@Roles(ROLES.ADMINISTRADOR)
@Controller('genres')
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo genero' })
  @ApiResponse({ status: 201, description: 'Genero creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  @ApiResponse({ status: 409, description: 'El genero ya existe' })
  async create(@Body() dto: CreateGenreDto): Promise<IApiResponse<IGenreResponse>> {
    const data = await this.genreService.create(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.CREATED,
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar generos con paginacion y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de generos' })
  async findAll(
    @Query() query: QueryGenreDto,
  ): Promise<IApiResponse<IPaginatedResponse<IGenreResponse>>> {
    const data = await this.genreService.findAll(query);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un genero por ID' })
  @ApiParam({ name: 'id', description: 'UUID del genero' })
  @ApiResponse({ status: 200, description: 'Genero encontrado' })
  @ApiResponse({ status: 404, description: 'Genero no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<IGenreResponse>> {
    const data = await this.genreService.findById(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un genero' })
  @ApiParam({ name: 'id', description: 'UUID del genero' })
  @ApiResponse({ status: 200, description: 'Genero actualizado' })
  @ApiResponse({ status: 404, description: 'Genero no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGenreDto,
  ): Promise<IApiResponse<IGenreResponse>> {
    const data = await this.genreService.update(id, dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.UPDATED,
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un genero' })
  @ApiParam({ name: 'id', description: 'UUID del genero' })
  @ApiResponse({ status: 200, description: 'Genero eliminado' })
  @ApiResponse({ status: 404, description: 'Genero no encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<void>> {
    await this.genreService.delete(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.DELETED,
    };
  }
}
