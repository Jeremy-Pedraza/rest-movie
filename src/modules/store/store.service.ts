// src/modules/store/store.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { CreateStoreDto, UpdateStoreDto, QueryStoreDto, AssignUsersToStoreDto, RemoveUsersFromStoreDto } from './dto';
import { IStoreResponse, IStoreWithUsersResponse, IStoreStatsResponse } from './interfaces';
import { StoreEntity } from './entities';

/**
 * StoreService
 *
 * @description
 * Maneja la lógica de negocio para el módulo Store.
 * Utiliza shared services para sanitización y manejo de errores.
 *
 * Responsabilidades:
 * - Validar reglas de negocio
 * - Sanitizar inputs
 * - Coordinar operaciones con el repository
 * - Gestionar asignación de usuarios
 * - Transformar entidades a respuestas
 */
@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private readonly storeRepository: StoreRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  /**
   * Crear tienda
   *
   * @param dto - Datos de la nueva tienda
   * @returns IStoreResponse
   * @throws ConflictException si código ya existe
   * @throws NotFoundException si company no existe
   */
  async create(dto: CreateStoreDto): Promise<IStoreResponse> {
    this.logger.log(`Creando tienda: ${dto.nombre} (${dto.codigo})`);

    // Validar código único
    const existsByCodigo = await this.storeRepository.existsByCodigo(dto.codigo);
    if (existsByCodigo) {
      this.handleError.conflict('El código de tienda ya está registrado', 'codigo');
    }

    // Sanitizar inputs
    const sanitizedData = this.sanitizeCreateDto(dto);

    // Crear
    try {
      const store = await this.storeRepository.create(sanitizedData);
      this.logger.log(`Tienda creada: ${store.id}`);
      return this.toResponse(store);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando tienda');
    }
  }

  /**
   * Listar tiendas con filtros y paginación
   *
   * @param query - Filtros y opciones de paginación
   * @returns IPaginatedResponse<IStoreResponse>
   */
  async findAll(query: QueryStoreDto): Promise<IPaginatedResponse<IStoreResponse>> {
    // Sanitizar búsqueda
    if (query.search) {
      query.search = this.sanitizer.sanitizeString(query.search);
    }

    const [stores, total] = await this.storeRepository.findAll(query);

    const page = query.page || 1;
    const limit = query.limit || 10;

    return {
      data: stores.map((s) => this.toResponse(s)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Obtener tienda por ID
   *
   * @param id - UUID de la tienda
   * @returns IStoreResponse
   * @throws NotFoundException si no existe
   */
  async findById(id: string): Promise<IStoreResponse> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }
    return this.toResponse(store);
  }

  /**
   * Obtener tienda por ID con usuarios asignados
   *
   * @param id - UUID de la tienda
   * @returns IStoreWithUsersResponse
   * @throws NotFoundException si no existe
   */
  async findByIdWithUsers(id: string): Promise<IStoreWithUsersResponse> {
    const store = await this.storeRepository.findByIdWithUsers(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }

    const assignedUsersCount = store.assigned_users?.length || 0;
    const assignedUsers = store.assigned_users?.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
    }));

    return {
      ...this.toResponse(store),
      assigned_users_count: assignedUsersCount,
      assigned_users: assignedUsers,
    };
  }

  /**
   * Obtener tiendas de una compañía
   *
   * @param companyId - UUID de la compañía
   * @returns Array de IStoreResponse
   */
  async findByCompany(companyId: string): Promise<IStoreResponse[]> {
    const stores = await this.storeRepository.findByCompany(companyId);
    return stores.map((s) => this.toResponse(s));
  }

  /**
   * Obtener solo tiendas activas de una compañía
   *
   * @param companyId - UUID de la compañía
   * @returns Array de IStoreResponse
   */
  async findActiveByCompany(companyId: string): Promise<IStoreResponse[]> {
    const stores = await this.storeRepository.findActiveByCompany(companyId);
    return stores.map((s) => this.toResponse(s));
  }

  /**
   * Actualizar tienda
   *
   * @param id - UUID de la tienda
   * @param dto - Datos a actualizar
   * @returns IStoreResponse
   * @throws NotFoundException si no existe
   */
  async update(id: string, dto: UpdateStoreDto): Promise<IStoreResponse> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }

    // Sanitizar
    const sanitizedData = this.sanitizeUpdateDto(dto);

    try {
      const updated = await this.storeRepository.update(id, sanitizedData);
      this.logger.log(`Tienda actualizada: ${id}`);
      return this.toResponse(updated);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando tienda');
    }
  }

  /**
   * Eliminar tienda (soft delete)
   *
   * @param id - UUID de la tienda
   * @throws NotFoundException si no existe
   */
  async delete(id: string): Promise<void> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }

    await this.storeRepository.softDelete(id);
    this.logger.log(`Tienda eliminada: ${id}`);
  }

  /**
   * Restaurar tienda eliminada
   *
   * @param id - UUID de la tienda
   * @returns IStoreResponse
   */
  async restore(id: string): Promise<IStoreResponse> {
    const restored = await this.storeRepository.restore(id);
    if (!restored) {
      this.handleError.notFound('Tienda', id);
    }

    this.logger.log(`Tienda restaurada: ${id}`);
    return await this.findById(id);
  }

  /**
   * Activar tienda
   *
   * @param id - UUID de la tienda
   * @returns IStoreResponse
   * @throws NotFoundException si no existe
   */
  async activate(id: string): Promise<IStoreResponse> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }

    const updated = await this.storeRepository.update(id, { activo: true });
    this.logger.log(`Tienda activada: ${id}`);
    return this.toResponse(updated);
  }

  /**
   * Desactivar tienda
   *
   * @param id - UUID de la tienda
   * @returns IStoreResponse
   * @throws NotFoundException si no existe
   */
  async deactivate(id: string): Promise<IStoreResponse> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }

    const updated = await this.storeRepository.update(id, { activo: false });
    this.logger.log(`Tienda desactivada: ${id}`);
    return this.toResponse(updated);
  }

  /**
   * Asignar usuarios a tienda
   *
   * @param id - UUID de la tienda
   * @param dto - IDs de usuarios a asignar
   * @returns IStoreWithUsersResponse
   * @throws NotFoundException si tienda no existe
   */
  async assignUsers(id: string, dto: AssignUsersToStoreDto): Promise<IStoreWithUsersResponse> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }

    await this.storeRepository.assignUsers(id, dto.user_ids);
    this.logger.log(`Usuarios asignados a tienda ${id}: ${dto.user_ids.length} usuarios`);

    return await this.findByIdWithUsers(id);
  }

  /**
   * Remover usuarios de tienda
   *
   * @param id - UUID de la tienda
   * @param dto - IDs de usuarios a remover
   * @returns IStoreWithUsersResponse
   * @throws NotFoundException si tienda no existe
   */
  async removeUsers(id: string, dto: RemoveUsersFromStoreDto): Promise<IStoreWithUsersResponse> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }

    await this.storeRepository.removeUsers(id, dto.user_ids);
    this.logger.log(`Usuarios removidos de tienda ${id}: ${dto.user_ids.length} usuarios`);

    return await this.findByIdWithUsers(id);
  }

  /**
   * Obtener tiendas asignadas a un usuario
   *
   * @param userId - UUID del usuario
   * @returns Array de IStoreResponse
   */
  async findByUserId(userId: string): Promise<IStoreResponse[]> {
    const stores = await this.storeRepository.findByUserId(userId);
    return stores.map((s) => this.toResponse(s));
  }

  /**
   * Obtener estadísticas globales
   *
   * @returns IStoreStatsResponse
   */
  async getStats(): Promise<IStoreStatsResponse> {
    return await this.storeRepository.getStats();
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Sanitizar DTO de creación
   */
  private sanitizeCreateDto(dto: CreateStoreDto): Partial<StoreEntity> {
    return {
      company_id: dto.company_id,
      nombre: this.sanitizer.sanitizeString(dto.nombre),
      codigo: this.sanitizer.sanitizeString(dto.codigo).toUpperCase(),
      email: dto.email ? this.sanitizer.sanitizeEmail(dto.email) : undefined,
      telefono: dto.telefono ? this.sanitizer.sanitizeString(dto.telefono) : undefined,
      direccion: this.sanitizer.sanitizeString(dto.direccion),
      ciudad: this.sanitizer.sanitizeString(dto.ciudad),
      zona: dto.zona ? this.sanitizer.sanitizeString(dto.zona) : undefined,
      latitud: dto.latitud,
      longitud: dto.longitud,
      activo: dto.activo ?? true,
      metadata: dto.metadata,
    };
  }

  /**
   * Sanitizar DTO de actualización
   */
  private sanitizeUpdateDto(dto: UpdateStoreDto): Partial<StoreEntity> {
    const sanitized: Partial<StoreEntity> = {};

    if (dto.nombre) sanitized.nombre = this.sanitizer.sanitizeString(dto.nombre);
    if (dto.email) sanitized.email = this.sanitizer.sanitizeEmail(dto.email);
    if (dto.telefono) sanitized.telefono = this.sanitizer.sanitizeString(dto.telefono);
    if (dto.direccion) sanitized.direccion = this.sanitizer.sanitizeString(dto.direccion);
    if (dto.ciudad) sanitized.ciudad = this.sanitizer.sanitizeString(dto.ciudad);
    if (dto.zona) sanitized.zona = this.sanitizer.sanitizeString(dto.zona);
    if (dto.latitud !== undefined) sanitized.latitud = dto.latitud;
    if (dto.longitud !== undefined) sanitized.longitud = dto.longitud;
    if (dto.activo !== undefined) sanitized.activo = dto.activo;
    if (dto.metadata) sanitized.metadata = dto.metadata;

    return sanitized;
  }

  /**
   * Convertir entidad a respuesta
   */
  private toResponse(store: StoreEntity): IStoreResponse {
    return {
      id: store.id,
      company_id: store.company_id,
      company_name: store.company?.name,
      nombre: store.nombre,
      codigo: store.codigo,
      email: store.email,
      telefono: store.telefono,
      direccion: store.direccion,
      ciudad: store.ciudad,
      zona: store.zona,
      latitud: store.latitud,
      longitud: store.longitud,
      activo: store.activo,
      metadata: store.metadata,
      created_at: store.created_at,
      updated_at: store.updated_at,
    };
  }
}
