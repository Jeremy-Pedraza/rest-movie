// src/modules/geography/geography.controller.ts

/**
 * @fileoverview Controlador para el módulo Geography
 * @module modules/geography
 *
 * Endpoints públicos (solo lectura) para consultar el catálogo geográfico.
 * No requieren autenticación.
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GeographyService } from './geography.service';
import {
  QueryCountriesDto,
  QueryDepartmentsDto,
  QueryCitiesDto,
  SearchGeographyDto,
  CountryResponseDto,
  DepartmentResponseDto,
  CityResponseDto,
  CountriesListResponseDto,
  DepartmentsListResponseDto,
  CitiesListResponseDto,
  GeographySearchResponseDto,
} from './dto';

@ApiTags('Geography')
@Controller('geography')
export class GeographyController {
  constructor(private readonly service: GeographyService) {}

  // ============================================
  // PAÍSES
  // ============================================

  @Get('countries')
  @ApiOperation({
    summary: 'Listar países',
    description:
      'Obtiene todos los países del catálogo. ' +
      'Por defecto solo retorna países activos. ' +
      'Soporta búsqueda por nombre.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de países',
    type: CountriesListResponseDto,
  })
  async findAllCountries(@Query() dto: QueryCountriesDto): Promise<CountriesListResponseDto> {
    return this.service.findAllCountries(dto);
  }

  @Get('countries/:code')
  @ApiOperation({
    summary: 'Obtener país por código ISO',
    description: 'Obtiene un país por su código ISO 3166-1 alpha-2 (2 letras).',
  })
  @ApiParam({
    name: 'code',
    description: 'Código ISO del país (2 letras)',
    example: 'DO',
  })
  @ApiResponse({
    status: 200,
    description: 'País encontrado',
    type: CountryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'País no encontrado',
  })
  async findCountryByCode(@Param('code') code: string): Promise<CountryResponseDto> {
    return this.service.findCountryByCode(code);
  }

  @Get('countries/:code/departments')
  @ApiOperation({
    summary: 'Obtener departamentos de un país',
    description:
      'Obtiene todos los departamentos/estados/provincias de un país. ' +
      'Los resultados se ordenan con la capital primero.',
  })
  @ApiParam({
    name: 'code',
    description: 'Código ISO del país (2 letras)',
    example: 'DO',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos',
    type: DepartmentsListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'País no encontrado',
  })
  async findDepartmentsByCountryCode(
    @Param('code') code: string,
  ): Promise<DepartmentsListResponseDto> {
    return this.service.findDepartmentsByCountryCode(code);
  }

  // ============================================
  // DEPARTAMENTOS
  // ============================================

  @Get('departments')
  @ApiOperation({
    summary: 'Listar departamentos',
    description:
      'Obtiene departamentos/estados/provincias con filtros opcionales. ' +
      'Puede filtrar por país (country_code o country_id).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos',
    type: DepartmentsListResponseDto,
  })
  async findAllDepartments(@Query() dto: QueryDepartmentsDto): Promise<DepartmentsListResponseDto> {
    return this.service.findAllDepartments(dto);
  }

  @Get('departments/:id')
  @ApiOperation({
    summary: 'Obtener departamento por ID',
    description: 'Obtiene un departamento/estado/provincia por su UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del departamento',
  })
  @ApiResponse({
    status: 200,
    description: 'Departamento encontrado',
    type: DepartmentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Departamento no encontrado',
  })
  async findDepartmentById(@Param('id') id: string): Promise<DepartmentResponseDto> {
    return this.service.findDepartmentById(id);
  }

  @Get('departments/:id/cities')
  @ApiOperation({
    summary: 'Obtener ciudades de un departamento',
    description:
      'Obtiene todas las ciudades de un departamento. ' +
      'Los resultados se ordenan con la capital primero, luego por población.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del departamento',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciudades',
    type: CitiesListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Departamento no encontrado',
  })
  async findCitiesByDepartmentId(@Param('id') id: string): Promise<CitiesListResponseDto> {
    return this.service.findCitiesByDepartmentId(id);
  }

  // ============================================
  // CIUDADES
  // ============================================

  @Get('cities')
  @ApiOperation({
    summary: 'Listar ciudades',
    description:
      'Obtiene ciudades con filtros opcionales. ' +
      'Puede filtrar por departamento, país, o solo capitales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de ciudades',
    type: CitiesListResponseDto,
  })
  async findAllCities(@Query() dto: QueryCitiesDto): Promise<CitiesListResponseDto> {
    return this.service.findAllCities(dto);
  }

  @Get('cities/:id')
  @ApiOperation({
    summary: 'Obtener ciudad por ID',
    description: 'Obtiene una ciudad por su UUID, incluyendo información del departamento y país.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la ciudad',
  })
  @ApiResponse({
    status: 200,
    description: 'Ciudad encontrada',
    type: CityResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Ciudad no encontrada',
  })
  async findCityById(@Param('id') id: string): Promise<CityResponseDto> {
    return this.service.findCityById(id);
  }

  // ============================================
  // BÚSQUEDA GLOBAL (AUTOCOMPLETE)
  // ============================================

  @Get('search')
  @ApiOperation({
    summary: 'Buscar ubicaciones (autocomplete)',
    description:
      'Búsqueda global de ubicaciones por nombre. ' +
      'Busca en países, departamentos y ciudades. ' +
      'Ideal para campos de autocompletado. ' +
      'Requiere mínimo 2 caracteres.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda',
    type: GeographySearchResponseDto,
  })
  async search(@Query() dto: SearchGeographyDto): Promise<GeographySearchResponseDto> {
    return this.service.search(dto);
  }
}
