// src/modules/director/director.controller.ts

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
import { DirectorService } from './director.service';
import { CreateDirectorDto, UpdateDirectorDto, QueryDirectorDto } from './dto';
import { IDirectorResponse } from './interfaces';

@ApiTags('Directors')
@Controller('directors')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo director' })
  @ApiResponse({ status: 201, description: 'Director creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  async create(@Body() dto: CreateDirectorDto): Promise<IApiResponse<IDirectorResponse>> {
    const data = await this.directorService.create(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.CREATED,
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar directores con paginacion y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de directores' })
  async findAll(
    @Query() query: QueryDirectorDto,
  ): Promise<IApiResponse<IPaginatedResponse<IDirectorResponse>>> {
    const data = await this.directorService.findAll(query);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un director por ID' })
  @ApiParam({ name: 'id', description: 'UUID del director' })
  @ApiResponse({ status: 200, description: 'Director encontrado' })
  @ApiResponse({ status: 404, description: 'Director no encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<IDirectorResponse>> {
    const data = await this.directorService.findById(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un director' })
  @ApiParam({ name: 'id', description: 'UUID del director' })
  @ApiResponse({ status: 200, description: 'Director actualizado' })
  @ApiResponse({ status: 404, description: 'Director no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDirectorDto,
  ): Promise<IApiResponse<IDirectorResponse>> {
    const data = await this.directorService.update(id, dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.UPDATED,
      data,
    };
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un director' })
  @ApiParam({ name: 'id', description: 'UUID del director' })
  @ApiResponse({ status: 200, description: 'Director eliminado' })
  @ApiResponse({ status: 404, description: 'Director no encontrado' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<void>> {
    await this.directorService.delete(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.DELETED,
    };
  }
}
