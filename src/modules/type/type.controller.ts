// src/modules/type/type.controller.ts

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
import { TypeService } from './type.service';
import { CreateTypeDto, UpdateTypeDto, QueryTypeDto } from './dto';
import { ITypeResponse } from './interfaces';

@ApiTags('Types')
@Controller('types')
export class TypeController {
  constructor(private readonly typeService: TypeService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo tipo' })
  @ApiResponse({ status: 201, description: 'Tipo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
  @ApiResponse({ status: 409, description: 'El tipo ya existe' })
  async create(@Body() dto: CreateTypeDto): Promise<IApiResponse<ITypeResponse>> {
    const data = await this.typeService.create(dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.CREATED,
      data,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar tipos con paginacion y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de tipos' })
  async findAll(
    @Query() query: QueryTypeDto,
  ): Promise<IApiResponse<IPaginatedResponse<ITypeResponse>>> {
    const data = await this.typeService.findAll(query);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo por ID' })
  @ApiParam({ name: 'id', description: 'UUID del tipo' })
  @ApiResponse({ status: 200, description: 'Tipo encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo no encontrado' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<ITypeResponse>> {
    const data = await this.typeService.findById(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un tipo' })
  @ApiParam({ name: 'id', description: 'UUID del tipo' })
  @ApiResponse({ status: 200, description: 'Tipo actualizado' })
  @ApiResponse({ status: 404, description: 'Tipo no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTypeDto,
  ): Promise<IApiResponse<ITypeResponse>> {
    const data = await this.typeService.update(id, dto);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.UPDATED,
      data,
    };
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un tipo' })
  @ApiParam({ name: 'id', description: 'UUID del tipo' })
  @ApiResponse({ status: 200, description: 'Tipo eliminado' })
  @ApiResponse({ status: 404, description: 'Tipo no encontrado' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IApiResponse<void>> {
    await this.typeService.delete(id);
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.DELETED,
    };
  }
}
