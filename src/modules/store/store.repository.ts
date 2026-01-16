// src/modules/store/store.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from './entities';
import { QueryStoreDto } from './dto';
import { IStoreStatsResponse } from './interfaces';
import { BaseRepository, SchemaContext } from '@shared/database';

/**
 * StoreRepository
 *
 * @description
 * Maneja todas las operaciones de base de datos para StoreEntity.
 * Extiende BaseRepository para soporte multi-tenant (FASE 3).
 * Utiliza createStaticQueryBuilder para entidades en schema public.
 *
 * @version 3.0.0 - Extiende BaseRepository para multi-tenant (FASE 3)
 *
 * Métodos disponibles:
 * - CRUD básico (create, findAll, findById, update, softDelete, restore)
 * - Búsquedas específicas (findByCodigo, findByCompany, findActiveByCompany)
 * - Búsquedas por segmentación (findByRegion, findByLocationType, findByFormat, findBySalesTier)
 * - Verificaciones (existsByCodigo)
 * - Gestión de usuarios (assignUsers, removeUsers)
 * - Estadísticas (getStats, getSegmentationStats)
 */
@Injectable()
export class StoreRepository extends BaseRepository<StoreEntity> {
  constructor(
    @InjectRepository(StoreEntity)
    repository: Repository<StoreEntity>,
    schemaContext: SchemaContext,
  ) {
    super(repository, schemaContext);
  }

  /**
   * Crear tienda
   *
   * @param data - Datos parciales de la tienda
   * @returns StoreEntity creada
   */
  async create(data: Partial<StoreEntity>): Promise<StoreEntity> {
    const store = this.repository.create(data);
    return await this.repository.save(store);
  }

  /**
   * Buscar todas con filtros y paginación
   *
   * @param query - Filtros y opciones de paginación
   * @returns Tupla [tiendas, total]
   */
  async findAll(query: QueryStoreDto): Promise<[StoreEntity[], number]> {
    const qb = this.createStaticQueryBuilder('store');
    qb.leftJoinAndSelect('store.company', 'company');

    // ============================================
    // FILTROS BÁSICOS
    // ============================================

    if (query.company_id) {
      qb.andWhere('store.company_id = :company_id', { company_id: query.company_id });
    }

    if (query.search) {
      qb.andWhere('(store.nombre ILIKE :search OR store.codigo ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.ciudad) {
      qb.andWhere('store.ciudad = :ciudad', { ciudad: query.ciudad });
    }

    if (query.zona) {
      qb.andWhere('store.zona = :zona', { zona: query.zona });
    }

    if (query.activo !== undefined) {
      qb.andWhere('store.activo = :activo', { activo: query.activo });
    }

    // ============================================
    // FILTROS DE SEGMENTACIÓN (FASE 2)
    // ============================================

    if (query.region) {
      qb.andWhere('store.region = :region', { region: query.region });
    }

    if (query.location_type) {
      qb.andWhere('store.location_type = :location_type', { location_type: query.location_type });
    }

    if (query.store_format) {
      qb.andWhere('store.store_format = :store_format', { store_format: query.store_format });
    }

    if (query.sales_tier) {
      qb.andWhere('store.sales_tier = :sales_tier', { sales_tier: query.sales_tier });
    }

    if (query.has_drive_thru !== undefined) {
      qb.andWhere('store.has_drive_thru = :has_drive_thru', {
        has_drive_thru: query.has_drive_thru,
      });
    }

    if (query.has_delivery !== undefined) {
      qb.andWhere('store.has_delivery = :has_delivery', { has_delivery: query.has_delivery });
    }

    // Filtro por tags (cualquiera que coincida)
    if (query.tags && query.tags.length > 0) {
      qb.andWhere('store.tags && :tags', { tags: query.tags });
    }

    // Soft delete
    qb.andWhere('store.deleted_at IS NULL');

    // ============================================
    // ORDENAMIENTO Y PAGINACIÓN
    // ============================================

    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    qb.orderBy(`store.${sortBy}`, sortOrder);

    const page = query.page || 1;
    const limit = query.limit || 10;
    qb.skip((page - 1) * limit).take(limit);

    return await qb.getManyAndCount();
  }

  /**
   * Buscar por ID
   *
   * @param id - UUID de la tienda
   * @returns StoreEntity o null
   */
  async findById(id: string): Promise<StoreEntity | null> {
    return await this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.id = :id', { id })
      .andWhere('store.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por ID con usuarios asignados
   *
   * @param id - UUID de la tienda
   * @returns StoreEntity con usuarios cargados o null
   */
  async findByIdWithUsers(id: string): Promise<StoreEntity | null> {
    return await this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .leftJoinAndSelect('store.assigned_users', 'users')
      .where('store.id = :id', { id })
      .andWhere('store.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar por código
   *
   * @param codigo - Código de la tienda
   * @returns StoreEntity o null
   */
  async findByCodigo(codigo: string): Promise<StoreEntity | null> {
    return await this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.codigo = :codigo', { codigo })
      .andWhere('store.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Buscar todas las tiendas de una compañía
   *
   * @param companyId - UUID de la compañía
   * @returns Array de StoreEntity
   */
  async findByCompany(companyId: string): Promise<StoreEntity[]> {
    return await this.createStaticQueryBuilder('store')
      .where('store.company_id = :companyId', { companyId })
      .andWhere('store.deleted_at IS NULL')
      .orderBy('store.nombre', 'ASC')
      .getMany();
  }

  /**
   * Buscar solo tiendas activas de una compañía
   *
   * @param companyId - UUID de la compañía
   * @returns Array de StoreEntity activas
   */
  async findActiveByCompany(companyId: string): Promise<StoreEntity[]> {
    return await this.createStaticQueryBuilder('store')
      .where('store.company_id = :companyId', { companyId })
      .andWhere('store.activo = :activo', { activo: true })
      .andWhere('store.deleted_at IS NULL')
      .orderBy('store.nombre', 'ASC')
      .getMany();
  }

  /**
   * Buscar tiendas por ciudad
   *
   * @param ciudad - Nombre de la ciudad
   * @returns Array de StoreEntity
   */
  async findByCity(ciudad: string): Promise<StoreEntity[]> {
    return await this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.ciudad = :ciudad', { ciudad })
      .andWhere('store.deleted_at IS NULL')
      .orderBy('store.nombre', 'ASC')
      .getMany();
  }

  // ============================================
  // MÉTODOS DE SEGMENTACIÓN (FASE 2)
  // ============================================

  /**
   * Buscar tiendas por región
   *
   * @param region - Nombre de la región
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de StoreEntity
   */
  async findByRegion(region: string, companyId?: string): Promise<StoreEntity[]> {
    const qb = this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.region = :region', { region })
      .andWhere('store.deleted_at IS NULL');

    if (companyId) {
      qb.andWhere('store.company_id = :companyId', { companyId });
    }

    return await qb.orderBy('store.nombre', 'ASC').getMany();
  }

  /**
   * Buscar tiendas por tipo de ubicación
   *
   * @param locationType - Tipo de ubicación (mall, street, airport, etc.)
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de StoreEntity
   */
  async findByLocationType(locationType: string, companyId?: string): Promise<StoreEntity[]> {
    const qb = this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.location_type = :locationType', { locationType })
      .andWhere('store.deleted_at IS NULL');

    if (companyId) {
      qb.andWhere('store.company_id = :companyId', { companyId });
    }

    return await qb.orderBy('store.nombre', 'ASC').getMany();
  }

  /**
   * Buscar tiendas por formato
   *
   * @param storeFormat - Formato de tienda (express, regular, flagship, etc.)
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de StoreEntity
   */
  async findByFormat(storeFormat: string, companyId?: string): Promise<StoreEntity[]> {
    const qb = this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.store_format = :storeFormat', { storeFormat })
      .andWhere('store.deleted_at IS NULL');

    if (companyId) {
      qb.andWhere('store.company_id = :companyId', { companyId });
    }

    return await qb.orderBy('store.nombre', 'ASC').getMany();
  }

  /**
   * Buscar tiendas por tier de ventas
   *
   * @param salesTier - Clasificación de ventas (A, B, C, D, E)
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de StoreEntity
   */
  async findBySalesTier(salesTier: string, companyId?: string): Promise<StoreEntity[]> {
    const qb = this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.sales_tier = :salesTier', { salesTier })
      .andWhere('store.deleted_at IS NULL');

    if (companyId) {
      qb.andWhere('store.company_id = :companyId', { companyId });
    }

    return await qb.orderBy('store.nombre', 'ASC').getMany();
  }

  /**
   * Buscar tiendas con drive-thru
   *
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de StoreEntity
   */
  async findWithDriveThru(companyId?: string): Promise<StoreEntity[]> {
    const qb = this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.has_drive_thru = :hasDriveThru', { hasDriveThru: true })
      .andWhere('store.deleted_at IS NULL');

    if (companyId) {
      qb.andWhere('store.company_id = :companyId', { companyId });
    }

    return await qb.orderBy('store.nombre', 'ASC').getMany();
  }

  /**
   * Buscar tiendas con delivery
   *
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de StoreEntity
   */
  async findWithDelivery(companyId?: string): Promise<StoreEntity[]> {
    const qb = this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.has_delivery = :hasDelivery', { hasDelivery: true })
      .andWhere('store.deleted_at IS NULL');

    if (companyId) {
      qb.andWhere('store.company_id = :companyId', { companyId });
    }

    return await qb.orderBy('store.nombre', 'ASC').getMany();
  }

  /**
   * Buscar tiendas por tags
   *
   * @param tags - Array de tags a buscar (cualquiera que coincida)
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de StoreEntity
   */
  async findByTags(tags: string[], companyId?: string): Promise<StoreEntity[]> {
    const qb = this.createStaticQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.tags && :tags', { tags })
      .andWhere('store.deleted_at IS NULL');

    if (companyId) {
      qb.andWhere('store.company_id = :companyId', { companyId });
    }

    return await qb.orderBy('store.nombre', 'ASC').getMany();
  }

  /**
   * Obtener regiones únicas de una compañía
   *
   * @param companyId - UUID de la compañía
   * @returns Array de { region, count }
   */
  async getRegions(companyId: string): Promise<Array<{ region: string; count: number }>> {
    return await this.createStaticQueryBuilder('store')
      .select('store.region', 'region')
      .addSelect('COUNT(*)', 'count')
      .where('store.company_id = :companyId', { companyId })
      .andWhere('store.region IS NOT NULL')
      .andWhere('store.deleted_at IS NULL')
      .groupBy('store.region')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  /**
   * Verificar si existe por código
   *
   * @param codigo - Código a verificar
   * @param excludeId - ID a excluir de la búsqueda (para updates)
   * @returns true si existe, false si no
   */
  async existsByCodigo(codigo: string, excludeId?: string): Promise<boolean> {
    const qb = this.createStaticQueryBuilder('store')
      .where('store.codigo = :codigo', { codigo })
      .andWhere('store.deleted_at IS NULL');

    if (excludeId) {
      qb.andWhere('store.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  /**
   * Actualizar tienda
   *
   * @param id - UUID de la tienda
   * @param data - Datos parciales a actualizar
   * @returns StoreEntity actualizada o null
   */
  async update(id: string, data: Partial<StoreEntity>): Promise<StoreEntity | null> {
    // Construir objeto solo con campos escalares (excluir relaciones)
    const updateData: Record<string, unknown> = {};
    const scalarFields = [
      'company_id',
      'nombre',
      'codigo',
      'direccion',
      'ciudad',
      'departamento',
      'zona',
      'telefono',
      'email',
      'latitud',
      'longitud',
      'activo',
      'metadata',
      // Campos de segmentación (FASE 2)
      'region',
      'location_type',
      'store_format',
      'seating_capacity',
      'has_drive_thru',
      'has_delivery',
      'operating_hours',
      'opening_date',
      'manager_name',
      'sales_tier',
      'tags',
    ];

    for (const field of scalarFields) {
      if (field in data) {
        updateData[field] = data[field as keyof StoreEntity];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(id, updateData);
    }

    return await this.findById(id);
  }

  /**
   * Soft delete
   *
   * @param id - UUID de la tienda
   * @returns true si se eliminó, false si no
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Restaurar tienda eliminada
   *
   * @param id - UUID de la tienda
   * @returns true si se restauró, false si no
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.repository.restore(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Asignar usuarios a tienda
   *
   * @param storeId - UUID de la tienda
   * @param userIds - Array de UUIDs de usuarios
   */
  async assignUsers(storeId: string, userIds: string[]): Promise<void> {
    const store = await this.repository.findOne({
      where: { id: storeId },
      relations: ['assigned_users'],
    });

    if (!store) return;

    // Crear relaciones sin cargar entidades completas (mejor performance)
    const existingIds = store.assigned_users?.map((u) => u.id) || [];
    const newIds = userIds.filter((id) => !existingIds.includes(id));

    if (newIds.length === 0) return;

    // Agregar solo los usuarios nuevos
    store.assigned_users = [
      ...(store.assigned_users || []),
      ...newIds.map((id) => ({ id }) as any),
    ];

    await this.repository.save(store);
  }

  /**
   * Remover usuarios de tienda
   *
   * @param storeId - UUID de la tienda
   * @param userIds - Array de UUIDs de usuarios a remover
   */
  async removeUsers(storeId: string, userIds: string[]): Promise<void> {
    const store = await this.repository.findOne({
      where: { id: storeId },
      relations: ['assigned_users'],
    });

    if (!store) return;

    store.assigned_users = store.assigned_users?.filter((user) => !userIds.includes(user.id)) || [];

    await this.repository.save(store);
  }

  /**
   * Obtener usuarios asignados a una tienda
   *
   * @param storeId - UUID de la tienda
   * @returns Array de usuarios
   */
  async getAssignedUsers(storeId: string): Promise<any[]> {
    const store = await this.findByIdWithUsers(storeId);
    return store?.assigned_users || [];
  }

  /**
   * Obtener tiendas asignadas a un usuario
   *
   * @param userId - UUID del usuario
   * @returns Array de StoreEntity
   */
  async findByUserId(userId: string): Promise<StoreEntity[]> {
    return await this.createStaticQueryBuilder('store')
      .leftJoin('store.assigned_users', 'user')
      .leftJoinAndSelect('store.company', 'company')
      .where('user.id = :userId', { userId })
      .andWhere('store.deleted_at IS NULL')
      .orderBy('store.nombre', 'ASC')
      .getMany();
  }

  /**
   * Obtener estadísticas globales de tiendas
   *
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns IStoreStatsResponse
   */
  async getStats(companyId?: string): Promise<IStoreStatsResponse> {
    const baseWhere = companyId
      ? 'store.company_id = :companyId AND store.deleted_at IS NULL'
      : 'store.deleted_at IS NULL';
    const params = companyId ? { companyId } : {};

    // Total y activas
    const total = await this.createStaticQueryBuilder('store').where(baseWhere, params).getCount();

    const active = await this.createStaticQueryBuilder('store')
      .where(baseWhere, params)
      .andWhere('store.activo = :activo', { activo: true })
      .getCount();

    // Por compañía
    const byCompany = await this.createStaticQueryBuilder('store')
      .leftJoin('store.company', 'company')
      .select('company.id', 'company_id')
      .addSelect('company.name', 'company_name')
      .addSelect('COUNT(*)', 'stores_count')
      .where('store.deleted_at IS NULL')
      .groupBy('company.id')
      .addGroupBy('company.name')
      .orderBy('stores_count', 'DESC')
      .getRawMany();

    // Por ciudad
    const byCity = await this.createStaticQueryBuilder('store')
      .select('store.ciudad', 'ciudad')
      .addSelect('COUNT(*)', 'count')
      .where(baseWhere, params)
      .groupBy('store.ciudad')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Por región (FASE 2)
    const byRegion = await this.createStaticQueryBuilder('store')
      .select('store.region', 'region')
      .addSelect('COUNT(*)', 'count')
      .where(baseWhere, params)
      .andWhere('store.region IS NOT NULL')
      .groupBy('store.region')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Por tipo de ubicación (FASE 2)
    const byLocationType = await this.createStaticQueryBuilder('store')
      .select('store.location_type', 'location_type')
      .addSelect('COUNT(*)', 'count')
      .where(baseWhere, params)
      .andWhere('store.location_type IS NOT NULL')
      .groupBy('store.location_type')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Por formato (FASE 2)
    const byFormat = await this.createStaticQueryBuilder('store')
      .select('store.store_format', 'store_format')
      .addSelect('COUNT(*)', 'count')
      .where(baseWhere, params)
      .andWhere('store.store_format IS NOT NULL')
      .groupBy('store.store_format')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Por tier de ventas (FASE 2)
    const bySalesTier = await this.createStaticQueryBuilder('store')
      .select('store.sales_tier', 'sales_tier')
      .addSelect('COUNT(*)', 'count')
      .where(baseWhere, params)
      .andWhere('store.sales_tier IS NOT NULL')
      .groupBy('store.sales_tier')
      .orderBy('store.sales_tier', 'ASC')
      .getRawMany();

    // Con drive-thru (FASE 2)
    const withDriveThru = await this.createStaticQueryBuilder('store')
      .where(baseWhere, params)
      .andWhere('store.has_drive_thru = :hasDriveThru', { hasDriveThru: true })
      .getCount();

    // Con delivery (FASE 2)
    const withDelivery = await this.createStaticQueryBuilder('store')
      .where(baseWhere, params)
      .andWhere('store.has_delivery = :hasDelivery', { hasDelivery: true })
      .getCount();

    return {
      total_stores: total,
      active_stores: active,
      inactive_stores: total - active,
      stores_by_company: byCompany.map((c) => ({
        company_id: c.company_id,
        company_name: c.company_name,
        stores_count: parseInt(c.stores_count, 10),
      })),
      stores_by_city: byCity.map((c) => ({
        ciudad: c.ciudad,
        count: parseInt(c.count, 10),
      })),
      stores_by_region: byRegion.map((r) => ({
        region: r.region,
        count: parseInt(r.count, 10),
      })),
      stores_by_location_type: byLocationType.map((l) => ({
        location_type: l.location_type,
        count: parseInt(l.count, 10),
      })),
      stores_by_format: byFormat.map((f) => ({
        store_format: f.store_format,
        count: parseInt(f.count, 10),
      })),
      stores_by_sales_tier: bySalesTier.map((s) => ({
        sales_tier: s.sales_tier,
        count: parseInt(s.count, 10),
      })),
      stores_with_drive_thru: withDriveThru,
      stores_with_delivery: withDelivery,
    };
  }
}
