// src/modules/geography/geography.repository.ts

/**
 * @fileoverview Repositorio para el módulo Geography
 * @module modules/geography
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity } from './entities';
import {
  QueryCountriesDto,
  QueryDepartmentsDto,
  QueryCitiesDto,
  SearchGeographyDto,
} from './dto';

@Injectable()
export class GeographyRepository {
  private readonly countryRepo: Repository<GeoCountryEntity>;
  private readonly departmentRepo: Repository<GeoDepartmentEntity>;
  private readonly cityRepo: Repository<GeoCityEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.countryRepo = this.dataSource.getRepository(GeoCountryEntity);
    this.departmentRepo = this.dataSource.getRepository(GeoDepartmentEntity);
    this.cityRepo = this.dataSource.getRepository(GeoCityEntity);
  }

  // ============================================
  // PAÍSES
  // ============================================

  /**
   * Obtener todos los países
   */
  async findAllCountries(dto: QueryCountriesDto): Promise<[GeoCountryEntity[], number]> {
    const qb = this.countryRepo.createQueryBuilder('country');

    if (dto.is_active !== undefined) {
      qb.andWhere('country.is_active = :isActive', { isActive: dto.is_active });
    }

    if (dto.search) {
      const searchNormalized = this.normalizeString(dto.search);
      qb.andWhere(
        '(country.name_normalized ILIKE :search OR country.name ILIKE :searchRaw OR country.code ILIKE :searchRaw)',
        { search: `%${searchNormalized}%`, searchRaw: `%${dto.search}%` },
      );
    }

    qb.orderBy('country.display_order', 'ASC').addOrderBy('country.name', 'ASC');

    const [data, total] = await qb.getManyAndCount();
    return [data, total];
  }

  /**
   * Obtener país por código ISO
   */
  async findCountryByCode(code: string): Promise<GeoCountryEntity | null> {
    return this.countryRepo.findOne({
      where: { code: code.toUpperCase(), is_active: true },
    });
  }

  /**
   * Obtener país por ID
   */
  async findCountryById(id: string): Promise<GeoCountryEntity | null> {
    return this.countryRepo.findOne({
      where: { id, is_active: true },
    });
  }

  // ============================================
  // DEPARTAMENTOS
  // ============================================

  /**
   * Obtener departamentos con filtros
   */
  async findAllDepartments(dto: QueryDepartmentsDto): Promise<[GeoDepartmentEntity[], number]> {
    const qb = this.departmentRepo
      .createQueryBuilder('dept')
      .leftJoinAndSelect('dept.country', 'country');

    if (dto.country_id) {
      qb.andWhere('dept.country_id = :countryId', { countryId: dto.country_id });
    }

    if (dto.country_code) {
      qb.andWhere('country.code = :countryCode', { countryCode: dto.country_code.toUpperCase() });
    }

    if (dto.is_active !== undefined) {
      qb.andWhere('dept.is_active = :isActive', { isActive: dto.is_active });
    }

    if (dto.search) {
      const searchNormalized = this.normalizeString(dto.search);
      qb.andWhere('(dept.name_normalized ILIKE :search OR dept.name ILIKE :searchRaw)', {
        search: `%${searchNormalized}%`,
        searchRaw: `%${dto.search}%`,
      });
    }

    qb.orderBy('dept.is_capital', 'DESC')
      .addOrderBy('dept.display_order', 'ASC')
      .addOrderBy('dept.name', 'ASC');

    const [data, total] = await qb.getManyAndCount();
    return [data, total];
  }

  /**
   * Obtener departamento por ID
   */
  async findDepartmentById(id: string): Promise<GeoDepartmentEntity | null> {
    return this.departmentRepo.findOne({
      where: { id, is_active: true },
      relations: ['country'],
    });
  }

  /**
   * Obtener departamentos de un país por código ISO
   */
  async findDepartmentsByCountryCode(countryCode: string): Promise<GeoDepartmentEntity[]> {
    return this.departmentRepo
      .createQueryBuilder('dept')
      .innerJoin('dept.country', 'country')
      .where('country.code = :code', { code: countryCode.toUpperCase() })
      .andWhere('dept.is_active = true')
      .orderBy('dept.is_capital', 'DESC')
      .addOrderBy('dept.display_order', 'ASC')
      .addOrderBy('dept.name', 'ASC')
      .getMany();
  }

  // ============================================
  // CIUDADES
  // ============================================

  /**
   * Obtener ciudades con filtros
   */
  async findAllCities(dto: QueryCitiesDto): Promise<[GeoCityEntity[], number]> {
    const qb = this.cityRepo
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.department', 'dept')
      .leftJoinAndSelect('dept.country', 'country');

    if (dto.department_id) {
      qb.andWhere('city.department_id = :deptId', { deptId: dto.department_id });
    }

    if (dto.country_code) {
      qb.andWhere('country.code = :countryCode', { countryCode: dto.country_code.toUpperCase() });
    }

    if (dto.is_active !== undefined) {
      qb.andWhere('city.is_active = :isActive', { isActive: dto.is_active });
    }

    if (dto.is_capital !== undefined) {
      qb.andWhere('city.is_capital = :isCapital', { isCapital: dto.is_capital });
    }

    if (dto.search) {
      const searchNormalized = this.normalizeString(dto.search);
      qb.andWhere(
        '(city.name_normalized ILIKE :search OR city.name ILIKE :searchRaw OR :searchRaw = ANY(city.aliases))',
        { search: `%${searchNormalized}%`, searchRaw: `%${dto.search}%` },
      );
    }

    qb.orderBy('city.is_country_capital', 'DESC')
      .addOrderBy('city.is_capital', 'DESC')
      .addOrderBy('city.population', 'DESC')
      .addOrderBy('city.display_order', 'ASC')
      .addOrderBy('city.name', 'ASC');

    if (dto.limit) {
      qb.take(dto.limit);
    }

    const [data, total] = await qb.getManyAndCount();
    return [data, total];
  }

  /**
   * Obtener ciudad por ID
   */
  async findCityById(id: string): Promise<GeoCityEntity | null> {
    return this.cityRepo.findOne({
      where: { id, is_active: true },
      relations: ['department', 'department.country'],
    });
  }

  /**
   * Obtener ciudades de un departamento
   */
  async findCitiesByDepartmentId(departmentId: string): Promise<GeoCityEntity[]> {
    return this.cityRepo
      .createQueryBuilder('city')
      .where('city.department_id = :deptId', { deptId: departmentId })
      .andWhere('city.is_active = true')
      .orderBy('city.is_capital', 'DESC')
      .addOrderBy('city.population', 'DESC')
      .addOrderBy('city.name', 'ASC')
      .getMany();
  }

  // ============================================
  // BÚSQUEDA GLOBAL (AUTOCOMPLETE)
  // ============================================

  /**
   * Búsqueda global de ubicaciones
   * Busca en países, departamentos y ciudades
   */
  async searchLocations(
    dto: SearchGeographyDto,
  ): Promise<{ type: 'country' | 'department' | 'city'; entity: any }[]> {
    const results: { type: 'country' | 'department' | 'city'; entity: any }[] = [];
    const searchNormalized = this.normalizeString(dto.q);
    const limit = dto.limit || 20;

    // Buscar países
    const countries = await this.countryRepo
      .createQueryBuilder('country')
      .where('country.is_active = true')
      .andWhere(
        '(country.name_normalized ILIKE :search OR country.name ILIKE :searchRaw OR country.code ILIKE :searchRaw)',
        { search: `%${searchNormalized}%`, searchRaw: `%${dto.q}%` },
      )
      .orderBy('country.display_order', 'ASC')
      .take(5)
      .getMany();

    countries.forEach((c) => results.push({ type: 'country', entity: c }));

    // Buscar ciudades (prioridad sobre departamentos)
    const citiesQb = this.cityRepo
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.department', 'dept')
      .leftJoinAndSelect('dept.country', 'country')
      .where('city.is_active = true')
      .andWhere(
        '(city.name_normalized ILIKE :search OR city.name ILIKE :searchRaw OR :searchRaw = ANY(city.aliases))',
        { search: `%${searchNormalized}%`, searchRaw: `%${dto.q}%` },
      );

    if (dto.country_code) {
      citiesQb.andWhere('country.code = :code', { code: dto.country_code.toUpperCase() });
    }

    const cities = await citiesQb
      .orderBy('city.is_country_capital', 'DESC')
      .addOrderBy('city.population', 'DESC')
      .take(limit - results.length)
      .getMany();

    cities.forEach((c) => results.push({ type: 'city', entity: c }));

    return results.slice(0, limit);
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Normalizar string (sin tildes, lowercase)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Verificar si existe un país por código
   */
  async countryExists(code: string): Promise<boolean> {
    const count = await this.countryRepo.count({
      where: { code: code.toUpperCase() },
    });
    return count > 0;
  }

  /**
   * Obtener repositorios raw (para seeds)
   */
  getCountryRepository(): Repository<GeoCountryEntity> {
    return this.countryRepo;
  }

  getDepartmentRepository(): Repository<GeoDepartmentEntity> {
    return this.departmentRepo;
  }

  getCityRepository(): Repository<GeoCityEntity> {
    return this.cityRepo;
  }
}
