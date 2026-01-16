// src/modules/company/company.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from './entities';
import { QueryCompanyDto } from './dto';
import { ICompanyStatsResponse } from './interfaces';
import { BaseRepository, SchemaContext } from '@shared/database';

/**
 * CompanyRepository
 *
 * @description
 * Maneja todas las operaciones de base de datos para CompanyEntity.
 * Extiende BaseRepository para soporte multi-tenant (FASE 3).
 * Utiliza createStaticQueryBuilder para entidades en schema public.
 *
 * @version 3.0.0 - Extiende BaseRepository para multi-tenant (FASE 3)
 *
 * Métodos disponibles:
 * - CRUD básico (create, findAll, findById, update, softDelete, restore)
 * - Búsquedas específicas (findByRuc, findByEmail, findBySchema)
 * - Verificaciones (existsByRuc, existsByEmail)
 * - Filtros (findActive, findByCountry, findByCountryCode, findByCurrency)
 * - Estadísticas (getStats)
 */
@Injectable()
export class CompanyRepository extends BaseRepository<CompanyEntity> {
  constructor(
    @InjectRepository(CompanyEntity)
    repository: Repository<CompanyEntity>,
    schemaContext: SchemaContext,
  ) {
    super(repository, schemaContext);
  }

  /**
   * Crear compañía
   *
   * @param data - Datos parciales de la compañía
   * @returns CompanyEntity creada
   */
  async create(data: Partial<CompanyEntity>): Promise<CompanyEntity> {
    const company = this.repository.create(data);
    return await this.repository.save(company);
  }

  /**
   * Buscar todas con filtros y paginación
   *
   * @param query - Filtros y opciones de paginación
   * @returns Tupla [compañías, total]
   */
  async findAll(query: QueryCompanyDto): Promise<[CompanyEntity[], number]> {
    const qb = this.createStaticQueryBuilder('company');

    // ============================================
    // FILTROS DE BÚSQUEDA
    // ============================================

    if (query.search) {
      qb.andWhere(
        '(company.name ILIKE :search OR company.email ILIKE :search OR company.ruc ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // ============================================
    // FILTROS DE UBICACIÓN
    // ============================================

    if (query.pais) {
      qb.andWhere('company.pais = :pais', { pais: query.pais });
    }

    if (query.ciudad) {
      qb.andWhere('company.ciudad = :ciudad', { ciudad: query.ciudad });
    }

    if (query.departamento) {
      qb.andWhere('company.departamento = :departamento', { departamento: query.departamento });
    }

    // ============================================
    // FILTROS DE INTERNACIONALIZACIÓN (FASE 1)
    // ============================================

    if (query.country_code) {
      qb.andWhere('company.country_code = :country_code', { country_code: query.country_code });
    }

    if (query.currency_code) {
      qb.andWhere('company.currency_code = :currency_code', { currency_code: query.currency_code });
    }

    if (query.timezone) {
      qb.andWhere('company.timezone = :timezone', { timezone: query.timezone });
    }

    // ============================================
    // FILTROS DE CONFIGURACIÓN
    // ============================================

    if (query.is_active !== undefined) {
      qb.andWhere('company.is_active = :is_active', { is_active: query.is_active });
    }

    if (query.plan) {
      qb.andWhere('company.plan = :plan', { plan: query.plan });
    }

    // Soft delete
    qb.andWhere('company.deleted_at IS NULL');

    // ============================================
    // ORDENAMIENTO Y PAGINACIÓN
    // ============================================

    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    qb.orderBy(`company.${sortBy}`, sortOrder);

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    return await qb.getManyAndCount();
  }

  /**
   * Buscar por ID
   *
   * @param id - UUID de la compañía
   * @returns CompanyEntity o null
   */
  async findById(id: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.id = :id', { id })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por ID con tiendas
   *
   * @param id - UUID de la compañía
   * @returns CompanyEntity con tiendas cargadas o null
   */
  async findByIdWithStores(id: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .leftJoinAndSelect('company.stores', 'stores')
      .where('company.id = :id', { id })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por RUC
   *
   * @param ruc - RUC de la compañía
   * @returns CompanyEntity o null
   */
  async findByRuc(ruc: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.ruc = :ruc', { ruc })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por email
   *
   * @param email - Email de la compañía
   * @returns CompanyEntity o null
   */
  async findByEmail(email: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.email = :email', { email })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por schema
   *
   * @param schema - Schema de PostgreSQL
   * @returns CompanyEntity o null
   */
  async findBySchema(schema: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.schema = :schema', { schema })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Verificar si existe por RUC
   *
   * @param ruc - RUC a verificar
   * @param excludeId - ID a excluir de la búsqueda (para updates)
   * @returns true si existe, false si no
   */
  async existsByRuc(ruc: string, excludeId?: string): Promise<boolean> {
    const qb = this.createStaticQueryBuilder('company')
      .where('company.ruc = :ruc', { ruc })
      .andWhere('company.deleted_at IS NULL');

    if (excludeId) {
      qb.andWhere('company.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  /**
   * Verificar si existe por email
   *
   * @param email - Email a verificar
   * @param excludeId - ID a excluir de la búsqueda (para updates)
   * @returns true si existe, false si no
   */
  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const qb = this.createStaticQueryBuilder('company')
      .where('company.email = :email', { email })
      .andWhere('company.deleted_at IS NULL');

    if (excludeId) {
      qb.andWhere('company.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  /**
   * Actualizar compañía
   *
   * @param id - UUID de la compañía
   * @param data - Datos parciales a actualizar
   * @returns CompanyEntity actualizada o null
   */
  async update(id: string, data: Partial<CompanyEntity>): Promise<CompanyEntity | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Soft delete
   *
   * @param id - UUID de la compañía
   * @returns true si se eliminó, false si no
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Restaurar compañía eliminada
   *
   * @param id - UUID de la compañía
   * @returns true si se restauró, false si no
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.repository.restore(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Obtener solo compañías activas
   *
   * @returns Array de CompanyEntity activas
   */
  async findActive(): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.is_active = :active', { active: true })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener compañías por país (nombre completo)
   *
   * @param pais - Nombre del país
   * @returns Array de CompanyEntity del país especificado
   */
  async findByCountry(pais: string): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.pais = :pais', { pais })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  // ============================================
  // MÉTODOS DE INTERNACIONALIZACIÓN (FASE 1)
  // ============================================

  /**
   * Obtener compañías por código de país ISO
   *
   * @param countryCode - Código ISO 3166-1 alpha-2 (ej: 'DO', 'GT')
   * @returns Array de CompanyEntity del país
   */
  async findByCountryCode(countryCode: string): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.country_code = :countryCode', { countryCode })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener compañías por código de moneda
   *
   * @param currencyCode - Código ISO 4217 (ej: 'DOP', 'GTQ', 'USD')
   * @returns Array de CompanyEntity con esa moneda
   */
  async findByCurrency(currencyCode: string): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.currency_code = :currencyCode', { currencyCode })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener compañías por zona horaria
   *
   * @param timezone - Zona horaria IANA (ej: 'America/Santo_Domingo')
   * @returns Array de CompanyEntity con esa zona horaria
   */
  async findByTimezone(timezone: string): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.timezone = :timezone', { timezone })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener listado de países únicos con códigos
   *
   * @returns Array de { pais, country_code, count }
   */
  async getCountryCodes(): Promise<Array<{ pais: string; country_code: string; count: number }>> {
    return await this.createStaticQueryBuilder('company')
      .select('company.pais', 'pais')
      .addSelect('company.country_code', 'country_code')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .groupBy('company.pais')
      .addGroupBy('company.country_code')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  /**
   * Obtener listado de monedas únicas
   *
   * @returns Array de { currency_code, currency_symbol, count }
   */
  async getCurrencies(): Promise<
    Array<{ currency_code: string; currency_symbol: string; count: number }>
  > {
    return await this.createStaticQueryBuilder('company')
      .select('company.currency_code', 'currency_code')
      .addSelect('company.currency_symbol', 'currency_symbol')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .groupBy('company.currency_code')
      .addGroupBy('company.currency_symbol')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  /**
   * Obtener estadísticas globales de compañías
   *
   * @returns Objeto con estadísticas incluyendo internacionalización
   */
  async getStats(): Promise<ICompanyStatsResponse> {
    const totalCompanies = await this.createStaticQueryBuilder('company')
      .where('company.deleted_at IS NULL')
      .getCount();

    const activeCompanies = await this.createStaticQueryBuilder('company')
      .where('company.is_active = :active', { active: true })
      .andWhere('company.deleted_at IS NULL')
      .getCount();

    // Total de tiendas (si hay relación)
    const totalStores = await this.createStaticQueryBuilder('company')
      .leftJoin('company.stores', 'stores')
      .select('COUNT(DISTINCT stores.id)', 'count')
      .where('company.deleted_at IS NULL')
      .getRawOne()
      .then((result) => parseInt(result?.count || '0', 10));

    // Por país con código ISO
    const companiesByCountry = await this.createStaticQueryBuilder('company')
      .select('company.pais', 'pais')
      .addSelect('company.country_code', 'country_code')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .groupBy('company.pais')
      .addGroupBy('company.country_code')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Por plan
    const companiesByPlan = await this.createStaticQueryBuilder('company')
      .select('company.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .andWhere('company.plan IS NOT NULL')
      .groupBy('company.plan')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Por moneda (FASE 1)
    const companiesByCurrency = await this.createStaticQueryBuilder('company')
      .select('company.currency_code', 'currency_code')
      .addSelect('company.currency_symbol', 'currency_symbol')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .groupBy('company.currency_code')
      .addGroupBy('company.currency_symbol')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total_companies: totalCompanies,
      active_companies: activeCompanies,
      inactive_companies: totalCompanies - activeCompanies,
      total_stores: totalStores,
      companies_by_country: companiesByCountry.map((c) => ({
        pais: c.pais,
        country_code: c.country_code,
        count: parseInt(c.count, 10),
      })),
      companies_by_plan: companiesByPlan.map((p) => ({
        plan: p.plan || 'sin_plan',
        count: parseInt(p.count, 10),
      })),
      companies_by_currency: companiesByCurrency.map((c) => ({
        currency_code: c.currency_code,
        currency_symbol: c.currency_symbol,
        count: parseInt(c.count, 10),
      })),
    };
  }
}
