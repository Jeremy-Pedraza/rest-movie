// src/modules/company/company.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from './entities';
import { QueryCompanyDto } from './dto';

/**
 * CompanyRepository
 *
 * @description
 * Maneja todas las operaciones de base de datos para CompanyEntity.
 * Utiliza createQueryBuilder para prevenir SQL injection.
 *
 * Métodos disponibles:
 * - CRUD básico (create, findAll, findById, update, softDelete, restore)
 * - Búsquedas específicas (findByRuc, findByEmail, findBySchema)
 * - Verificaciones (existsByRuc, existsByEmail)
 * - Filtros (findActive, findByCountry)
 * - Estadísticas (getStats)
 */
@Injectable()
export class CompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repo: Repository<CompanyEntity>,
  ) {}

  /**
   * Crear compañía
   *
   * @param data - Datos parciales de la compañía
   * @returns CompanyEntity creada
   */
  async create(data: Partial<CompanyEntity>): Promise<CompanyEntity> {
    const company = this.repo.create(data);
    return await this.repo.save(company);
  }

  /**
   * Buscar todas con filtros y paginación
   *
   * @param query - Filtros y opciones de paginación
   * @returns Tupla [compañías, total]
   */
  async findAll(query: QueryCompanyDto): Promise<[CompanyEntity[], number]> {
    const qb = this.repo.createQueryBuilder('company');

    // Filtros
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

    if (query.is_active !== undefined) {
      qb.andWhere('company.is_active = :is_active', { is_active: query.is_active });
    }

    if (query.plan) {
      qb.andWhere('company.plan = :plan', { plan: query.plan });
    }

    // Soft delete
    qb.andWhere('company.deleted_at IS NULL');

    // Ordenamiento
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    qb.orderBy(`company.${sortBy}`, sortOrder);

    // Paginación
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
    return await this.repo
      .createQueryBuilder('company')
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
    return await this.repo
      .createQueryBuilder('company')
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
    return await this.repo
      .createQueryBuilder('company')
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
    return await this.repo
      .createQueryBuilder('company')
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
    return await this.repo
      .createQueryBuilder('company')
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
    const qb = this.repo
      .createQueryBuilder('company')
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
    const qb = this.repo
      .createQueryBuilder('company')
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
    await this.repo.update(id, data);
    return await this.findById(id);
  }

  /**
   * Soft delete
   *
   * @param id - UUID de la compañía
   * @returns true si se eliminó, false si no
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Restaurar compañía eliminada
   *
   * @param id - UUID de la compañía
   * @returns true si se restauró, false si no
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.repo.restore(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Obtener solo compañías activas
   *
   * @returns Array de CompanyEntity activas
   */
  async findActive(): Promise<CompanyEntity[]> {
    return await this.repo
      .createQueryBuilder('company')
      .where('company.is_active = :active', { active: true })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener compañías por país
   *
   * @param pais - Nombre del país
   * @returns Array de CompanyEntity del país especificado
   */
  async findByCountry(pais: string): Promise<CompanyEntity[]> {
    return await this.repo
      .createQueryBuilder('company')
      .where('company.pais = :pais', { pais })
      .andWhere('company.deleted_at IS NULL')
      .orderBy('company.name', 'ASC')
      .getMany();
  }

  /**
   * Obtener estadísticas globales de compañías
   *
   * @returns Objeto con estadísticas
   */
  async getStats(): Promise<any> {
    const totalCompanies = await this.repo
      .createQueryBuilder('company')
      .where('company.deleted_at IS NULL')
      .getCount();

    const activeCompanies = await this.repo
      .createQueryBuilder('company')
      .where('company.is_active = :active', { active: true })
      .andWhere('company.deleted_at IS NULL')
      .getCount();

    const companiesByCountry = await this.repo
      .createQueryBuilder('company')
      .select('company.pais', 'pais')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .groupBy('company.pais')
      .orderBy('count', 'DESC')
      .getRawMany();

    const companiesByPlan = await this.repo
      .createQueryBuilder('company')
      .select('company.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .where('company.deleted_at IS NULL')
      .andWhere('company.plan IS NOT NULL')
      .groupBy('company.plan')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total_companies: totalCompanies,
      active_companies: activeCompanies,
      inactive_companies: totalCompanies - activeCompanies,
      companies_by_country: companiesByCountry,
      companies_by_plan: companiesByPlan,
    };
  }
}
