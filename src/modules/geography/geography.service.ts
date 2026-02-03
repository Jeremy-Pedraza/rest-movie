// src/modules/geography/geography.service.ts

/**
 * @fileoverview Servicio para el módulo Geography
 * @module modules/geography
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { GeographyRepository } from './geography.repository';
import {
  QueryCountriesDto,
  QueryDepartmentsDto,
  QueryCitiesDto,
  SearchGeographyDto,
  CountryResponseDto,
  DepartmentResponseDto,
  CityResponseDto,
  GeographySearchResultDto,
  CountriesListResponseDto,
  DepartmentsListResponseDto,
  CitiesListResponseDto,
  GeographySearchResponseDto,
} from './dto';
import { GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity } from './entities';

@Injectable()
export class GeographyService {
  constructor(private readonly repository: GeographyRepository) {}

  // ============================================
  // PAÍSES
  // ============================================

  /**
   * Listar todos los países
   */
  async findAllCountries(dto: QueryCountriesDto): Promise<CountriesListResponseDto> {
    const [countries, total] = await this.repository.findAllCountries(dto);
    return {
      data: countries.map((c) => this.mapCountryToDto(c)),
      total,
    };
  }

  /**
   * Obtener país por código ISO
   */
  async findCountryByCode(code: string): Promise<CountryResponseDto> {
    const country = await this.repository.findCountryByCode(code);
    if (!country) {
      throw new NotFoundException(`País con código '${code}' no encontrado`);
    }
    return this.mapCountryToDto(country);
  }

  /**
   * Obtener país por ID
   */
  async findCountryById(id: string): Promise<CountryResponseDto> {
    const country = await this.repository.findCountryById(id);
    if (!country) {
      throw new NotFoundException(`País con ID '${id}' no encontrado`);
    }
    return this.mapCountryToDto(country);
  }

  // ============================================
  // DEPARTAMENTOS
  // ============================================

  /**
   * Listar departamentos con filtros
   */
  async findAllDepartments(dto: QueryDepartmentsDto): Promise<DepartmentsListResponseDto> {
    const [departments, total] = await this.repository.findAllDepartments(dto);
    return {
      data: departments.map((d) => this.mapDepartmentToDto(d)),
      total,
    };
  }

  /**
   * Obtener departamentos de un país por código ISO
   */
  async findDepartmentsByCountryCode(countryCode: string): Promise<DepartmentsListResponseDto> {
    // Verificar que el país existe
    const country = await this.repository.findCountryByCode(countryCode);
    if (!country) {
      throw new NotFoundException(`País con código '${countryCode}' no encontrado`);
    }

    const departments = await this.repository.findDepartmentsByCountryCode(countryCode);
    return {
      data: departments.map((d) => this.mapDepartmentToDto(d)),
      total: departments.length,
    };
  }

  /**
   * Obtener departamento por ID
   */
  async findDepartmentById(id: string): Promise<DepartmentResponseDto> {
    const department = await this.repository.findDepartmentById(id);
    if (!department) {
      throw new NotFoundException(`Departamento con ID '${id}' no encontrado`);
    }
    return this.mapDepartmentToDto(department);
  }

  // ============================================
  // CIUDADES
  // ============================================

  /**
   * Listar ciudades con filtros
   */
  async findAllCities(dto: QueryCitiesDto): Promise<CitiesListResponseDto> {
    const [cities, total] = await this.repository.findAllCities(dto);
    return {
      data: cities.map((c) => this.mapCityToDto(c)),
      total,
    };
  }

  /**
   * Obtener ciudades de un departamento
   */
  async findCitiesByDepartmentId(departmentId: string): Promise<CitiesListResponseDto> {
    // Verificar que el departamento existe
    const department = await this.repository.findDepartmentById(departmentId);
    if (!department) {
      throw new NotFoundException(`Departamento con ID '${departmentId}' no encontrado`);
    }

    const cities = await this.repository.findCitiesByDepartmentId(departmentId);
    return {
      data: cities.map((c) => this.mapCityToDto(c)),
      total: cities.length,
    };
  }

  /**
   * Obtener ciudad por ID
   */
  async findCityById(id: string): Promise<CityResponseDto> {
    const city = await this.repository.findCityById(id);
    if (!city) {
      throw new NotFoundException(`Ciudad con ID '${id}' no encontrado`);
    }
    return this.mapCityToDto(city);
  }

  // ============================================
  // BÚSQUEDA GLOBAL
  // ============================================

  /**
   * Búsqueda global de ubicaciones (autocomplete)
   */
  async search(dto: SearchGeographyDto): Promise<GeographySearchResponseDto> {
    const results = await this.repository.searchLocations(dto);

    const data: GeographySearchResultDto[] = results.map((r) => {
      if (r.type === 'country') {
        const country = r.entity as GeoCountryEntity;
        return {
          id: country.id,
          type: 'country' as const,
          name: country.name,
          full_name: country.name,
          country_code: country.code,
          country_name: country.name,
        };
      } else if (r.type === 'department') {
        const dept = r.entity as GeoDepartmentEntity;
        return {
          id: dept.id,
          type: 'department' as const,
          name: dept.name,
          full_name: `${dept.name}, ${dept.country?.name || ''}`.trim(),
          country_code: dept.country?.code,
          country_name: dept.country?.name,
        };
      } else {
        const city = r.entity as GeoCityEntity;
        return {
          id: city.id,
          type: 'city' as const,
          name: city.name,
          full_name: `${city.name}, ${city.department?.name || ''}, ${city.department?.country?.name || ''}`.trim(),
          country_code: city.department?.country?.code,
          country_name: city.department?.country?.name,
          department_name: city.department?.name,
        };
      }
    });

    return {
      data,
      total: data.length,
      query: dto.q,
    };
  }

  // ============================================
  // MAPPERS
  // ============================================

  private mapCountryToDto(entity: GeoCountryEntity): CountryResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      code_alpha3: entity.code_alpha3,
      name: entity.name,
      name_en: entity.name_en,
      timezone: entity.timezone,
      currency_code: entity.currency_code,
      currency_symbol: entity.currency_symbol,
      phone_code: entity.phone_code,
      tax_name: entity.tax_name,
      tax_rate: entity.tax_rate ? Number(entity.tax_rate) : undefined,
      is_active: entity.is_active,
    };
  }

  private mapDepartmentToDto(entity: GeoDepartmentEntity): DepartmentResponseDto {
    return {
      id: entity.id,
      country_id: entity.country_id,
      code: entity.code,
      iso_code: entity.iso_code,
      name: entity.name,
      division_type: entity.division_type,
      is_capital: entity.is_capital,
      is_active: entity.is_active,
      country: entity.country ? this.mapCountryToDto(entity.country) : undefined,
    };
  }

  private mapCityToDto(entity: GeoCityEntity): CityResponseDto {
    return {
      id: entity.id,
      department_id: entity.department_id,
      name: entity.name,
      aliases: entity.aliases,
      is_capital: entity.is_capital,
      is_country_capital: entity.is_country_capital,
      population: entity.population,
      postal_code: entity.postal_code,
      is_active: entity.is_active,
      department: entity.department ? this.mapDepartmentToDto(entity.department) : undefined,
    };
  }
}
