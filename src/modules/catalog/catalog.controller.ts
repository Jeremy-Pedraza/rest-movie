// src/modules/catalog/catalog.controller.ts

import { Controller, Get, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { IApiResponse, IPaginatedResponse } from '@shared/common';
import { Public } from '@decorators/public.decorator';
import { CatalogService } from './catalog.service';
import { QueryCatalogDto } from './dto';
import {
  ICatalogItemResponse,
  ICatalogDetailResponse,
  ICatalogFeaturedResponse,
  ICatalogFilterResponse,
} from './interfaces';

@ApiTags('Catalog')
@Public()
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listado paginado del catalogo publico con filtros' })
  @ApiResponse({ status: 200, description: 'Catalog retrieved successfully' })
  async findAll(
    @Query() query: QueryCatalogDto,
  ): Promise<IApiResponse<IPaginatedResponse<ICatalogItemResponse>>> {
    const data = await this.catalogService.findAll(query);
    return {
      success: true,
      message: 'Catalog retrieved successfully',
      data,
    };
  }

  @Get('featured')
  @ApiOperation({ summary: 'Media destacada para hero/slider (10 mas recientes)' })
  @ApiResponse({ status: 200, description: 'Featured media retrieved successfully' })
  async findFeatured(): Promise<IApiResponse<ICatalogFeaturedResponse[]>> {
    const data = await this.catalogService.findFeatured();
    return {
      success: true,
      message: 'Featured media retrieved successfully',
      data,
    };
  }

  @Get('genres')
  @ApiOperation({ summary: 'Lista de generos activos para filtros' })
  @ApiResponse({ status: 200, description: 'Genres retrieved successfully' })
  async findGenres(): Promise<IApiResponse<ICatalogFilterResponse[]>> {
    const data = await this.catalogService.findActiveGenres();
    return {
      success: true,
      message: 'Genres retrieved successfully',
      data,
    };
  }

  @Get('types')
  @ApiOperation({ summary: 'Lista de tipos para filtros (Pelicula, Serie, etc.)' })
  @ApiResponse({ status: 200, description: 'Types retrieved successfully' })
  async findTypes(): Promise<IApiResponse<ICatalogFilterResponse[]>> {
    const data = await this.catalogService.findAllTypes();
    return {
      success: true,
      message: 'Types retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un media. Incluye url solo si el usuario esta autenticado' })
  @ApiParam({ name: 'id', description: 'UUID del media' })
  @ApiResponse({ status: 200, description: 'Media detail retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<IApiResponse<ICatalogDetailResponse>> {
    const isAuthenticated = this.isValidToken(req);
    const data = await this.catalogService.findById(id, isAuthenticated);
    return {
      success: true,
      message: 'Media detail retrieved successfully',
      data,
    };
  }

  private isValidToken(req: Request): boolean {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return false;
      }
      const token = authHeader.slice(7);
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}
