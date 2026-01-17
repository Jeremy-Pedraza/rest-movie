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
 * @version 3.2.0 - Sesión 19: Fix TypeScript error en update()
 *
 * Métodos disponibles:
 * - CRUD básico (create, findAll, findById, update, softDelete, hardDelete, restore)
 * - Búsquedas específicas (findByRuc, findByEmail, findBySchema)
 * - Verificaciones (existsByRuc, existsByEmail, existsBySchema)
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
   */
  async create(data: Partial<CompanyEntity>): Promise<CompanyEntity> {
    const company = this.repository.create(data);
    return await this.repository.save(company);
  }

  /**
   * Buscar todas con filtros y paginación
   */
  async findAll(query: QueryCompanyDto): Promise<[CompanyEntity[], number]> {
    const qb = this.createStaticQueryBuilder('company');

    if (query.search) {
      qb.andWhere(
        '(company.name ILIKE :search OR company.email ILIKE :search OR company.ruc ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.pais) {
      qb.andWhere('company.pais = :pais', { pais: query.pais });
    }

    if (query.ciudad) {
      qb.andWhere('company.ciudad = :ciudad', { ciudad: query.ciudad });
    }

    if (query.departamento) {
      qb.andWhere('company.departamento = :departamento', { departamento: query.departamento });
    }

    if (query.country_code) {
      qb.andWhere('company.country_code = :country_code', { country_code: query.country_code });
    }

    if (query.currency_code) {
      qb.andWhere('company.currency_code = :currency_code', { currency_code: query.currency_code });
    }

    if (query.timezone) {
      qb.andWhere('company.timezone = :timezone', { timezone: query.timezone });
    }

    if (query.is_active !== undefined) {
      qb.andWhere('company.is_active = :is_active', { is_active: query.is_active });
    }

    if (query.plan) {
      qb.andWhere('company.plan = :plan', { plan: query.plan });
    }

    qb.andWhere('company.deleted_at IS NULL');

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
   */
  async findById(id: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.id = :id', { id })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por ID con tiendas
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
   */
  async findByRuc(ruc: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.ruc = :ruc', { ruc })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por email
   */
  async findByEmail(email: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.email = :email', { email })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por schema
   */
  async findBySchema(schema: string): Promise<CompanyEntity | null> {
    return await this.createStaticQueryBuilder('company')
      .where('company.schema = :schema', { schema })
      .andWhere('company.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Verificar si existe por RUC
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
   * Verificar si existe por schema
   */
  async existsBySchema(schema: string, excludeId?: string): Promise<boolean> {
    const qb = this.createStaticQueryBuilder('company')
      .where('company.schema = :schema', { schema })
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
   * @description
   * Excluye relaciones OneToMany antes de actualizar porque TypeORM
   * update() solo acepta columnas de la tabla, no relaciones.
   */
  async update(id: string, data: Partial<CompanyEntity>): Promise<CompanyEntity | null> {
    // Extraer solo las columnas (excluir relaciones users y stores)
    const dataAsRecord = data as Record<string, unknown>;
    const { users: _u, stores: _s, ...updateData } = dataAsRecord;

    if (Object.keys(updateData).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await this.repository.update(id, updateData as any);
    }

    return await this.findById(id);
  }

  /**
   * Soft delete
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Hard delete (eliminación permanente)
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Restaurar compañía eliminada
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.repository.restore(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Obtener solo compañías activas
   */
  async findActive(): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.is_active = :active', { active: true })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener compañías activas con schema de tenant
   */
  async findActiveWithTenantSchema(): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.is_active = :active', { active: true })
      .andWhere('company.schema IS NOT NULL')
      .andWhere('company.schema != :publicSchema', { publicSchema: 'public' })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener compañías por país (nombre completo)
   */
  async findByCountry(pais: string): Promise<CompanyEntity[]> {
    return await this.createStaticQueryBuilder('company')
      .where('company.pais = :pais', { pais })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener compañías por código de país ISO
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
   */
  async getStats(): Promise<ICompanyStatsResponse> {
    const totalCompanies = await this.createStaticQueryBuilder('company')
      .where('company.deleted_at IS NULL')
      .getCount();

    const activeCompanies = await this.createStaticQueryBuilder('company')
      .where('company.is_active = :active', { active: true })
      .andWhere('company.deleted_at IS NULL')
      .getCount();

    const totalStores = await this.createStaticQueryBuilder('company')
      .leftJoin('company.stores', 'stores')
      .select('COUNT(DISTINCT stores.id)', 'count')
      .where('company.deleted_at IS NULL')
      .getRawOne()
      .then((result) => parseInt(result?.count || '0', 10));

    const companiesByCountry = await this.createStaticQueryBuilder('company')
      .select('company.pais', 'pais')
      .addSelect('company.country_code', 'country_code')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .groupBy('company.pais')
      .addGroupBy('company.country_code')
      .orderBy('count', 'DESC')
      .getRawMany();

    const companiesByPlan = await this.createStaticQueryBuilder('company')
      .select('company.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .andWhere('company.plan IS NOT NULL')
      .groupBy('company.plan')
      .orderBy('count', 'DESC')
      .getRawMany();

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
