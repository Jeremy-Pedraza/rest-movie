// src/modules/store/store.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from './entities';
import { QueryStoreDto } from './dto';

/**
 * StoreRepository
 *
 * @description
 * Maneja todas las operaciones de base de datos para StoreEntity.
 * Utiliza createQueryBuilder para prevenir SQL injection.
 *
 * Métodos disponibles:
 * - CRUD básico (create, findAll, findById, update, softDelete, restore)
 * - Búsquedas específicas (findByCodigo, findByCompany, findActiveByCompany)
 * - Verificaciones (existsByCodigo)
 * - Gestión de usuarios (assignUsers, removeUsers)
 * - Estadísticas (getStats)
 */
@Injectable()
export class StoreRepository {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly repo: Repository<StoreEntity>,
  ) {}

  /**
   * Crear tienda
   *
   * @param data - Datos parciales de la tienda
   * @returns StoreEntity creada
   */
  async create(data: Partial<StoreEntity>): Promise<StoreEntity> {
    const store = this.repo.create(data);
    return await this.repo.save(store);
  }

  /**
   * Buscar todas con filtros y paginación
   *
   * @param query - Filtros y opciones de paginación
   * @returns Tupla [tiendas, total]
   */
  async findAll(query: QueryStoreDto): Promise<[StoreEntity[], number]> {
    const qb = this.repo.createQueryBuilder('store');
    qb.leftJoinAndSelect('store.company', 'company');

    // Filtros
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

    // Soft delete
    qb.andWhere('store.deleted_at IS NULL');

    // Ordenamiento
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'DESC';
    qb.orderBy(`store.${sortBy}`, sortOrder);

    // Paginación
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
    return await this.repo
      .createQueryBuilder('store')
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
    return await this.repo
      .createQueryBuilder('store')
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
    return await this.repo
      .createQueryBuilder('store')
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
    return await this.repo
      .createQueryBuilder('store')
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
    return await this.repo
      .createQueryBuilder('store')
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
    return await this.repo
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.company', 'company')
      .where('store.ciudad = :ciudad', { ciudad })
      .andWhere('store.deleted_at IS NULL')
      .orderBy('store.nombre', 'ASC')
      .getMany();
  }

  /**
   * Verificar si existe por código
   *
   * @param codigo - Código a verificar
   * @param excludeId - ID a excluir de la búsqueda (para updates)
   * @returns true si existe, false si no
   */
  async existsByCodigo(codigo: string, excludeId?: string): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('store')
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
    await this.repo.update(id, data);
    return await this.findById(id);
  }

  /**
   * Soft delete
   *
   * @param id - UUID de la tienda
   * @returns true si se eliminó, false si no
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Restaurar tienda eliminada
   *
   * @param id - UUID de la tienda
   * @returns true si se restauró, false si no
   */
  async restore(id: string): Promise<boolean> {
    const result = await this.repo.restore(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Asignar usuarios a tienda
   *
   * @param storeId - UUID de la tienda
   * @param userIds - Array de UUIDs de usuarios
   */
  async assignUsers(storeId: string, userIds: string[]): Promise<void> {
    const store = await this.repo.findOne({
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
      ...newIds.map((id) => ({ id } as any)),
    ];

    await this.repo.save(store);
  }

  /**
   * Remover usuarios de tienda
   *
   * @param storeId - UUID de la tienda
   * @param userIds - Array de UUIDs de usuarios a remover
   */
  async removeUsers(storeId: string, userIds: string[]): Promise<void> {
    const store = await this.repo.findOne({
      where: { id: storeId },
      relations: ['assigned_users'],
    });

    if (!store) return;

    store.assigned_users =
      store.assigned_users?.filter((user) => !userIds.includes(user.id)) || [];

    await this.repo.save(store);
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
    return await this.repo
      .createQueryBuilder('store')
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
   * @returns Objeto con estadísticas
   */
  async getStats(): Promise<any> {
    const total = await this.repo
      .createQueryBuilder('store')
      .where('store.deleted_at IS NULL')
      .getCount();

    const active = await this.repo
      .createQueryBuilder('store')
      .where('store.activo = :activo', { activo: true })
      .andWhere('store.deleted_at IS NULL')
      .getCount();

    const byCompany = await this.repo
      .createQueryBuilder('store')
      .leftJoin('store.company', 'company')
      .select('company.id', 'company_id')
      .addSelect('company.name', 'company_name')
      .addSelect('COUNT(*)', 'stores_count')
      .where('store.deleted_at IS NULL')
      .groupBy('company.id')
      .addGroupBy('company.name')
      .orderBy('stores_count', 'DESC')
      .getRawMany();

    const byCity = await this.repo
      .createQueryBuilder('store')
      .select('store.ciudad', 'ciudad')
      .addSelect('COUNT(*)', 'count')
      .where('store.deleted_at IS NULL')
      .groupBy('store.ciudad')
      .orderBy('count', 'DESC')
      .getRawMany();

    return {
      total_stores: total,
      active_stores: active,
      inactive_stores: total - active,
      stores_by_company: byCompany,
      stores_by_city: byCity,
    };
  }
}
