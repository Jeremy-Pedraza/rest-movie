// src/modules/store/store.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { StoreRepository } from './store.repository';
import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import {
  CreateStoreDto,
  UpdateStoreDto,
  QueryStoreDto,
  AssignUsersToStoreDto,
  RemoveUsersFromStoreDto,
} from './dto';
import {
  BulkCreateStoreDto,
  IBulkCreateStoreResponse,
  IBulkCreateStoreResult,
} from './dto/bulk-create-store.dto';
import {
  IStoreResponse,
  IStoreWithUsersResponse,
  IStoreStatsResponse,
  IStoreListResponse,
  IStoreSegmentationResponse,
} from './interfaces';
import { StoreEntity } from './entities';
import { GeographyRepository } from '@modules/geography/geography.repository';

/**
 * StoreService
 *
 * @description
 * Maneja la lógica de negocio para el módulo Store.
 * Utiliza shared services para sanitización y manejo de errores.
 *
 * @version 2.0.0 - Agregados métodos de segmentación (FASE 2)
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
    private readonly geographyRepository: GeographyRepository,
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

    // Validar geo_city_id contra catálogo geográfico (si se proporcionó)
    if (dto.geo_city_id) {
      await this.validateGeoCity(dto.geo_city_id);
    } else {
      this.logger.warn(
        `Tienda ${dto.codigo} creada sin geo_city_id. ` +
          `Se recomienda vincular al catálogo geográfico para heredar timezone, moneda e impuestos.`,
      );
    }

    // Sanitizar inputs
    const sanitizedData = this.sanitizeCreateDto(dto);

    // Crear
    try {
      const store = await this.storeRepository.create(sanitizedData);

      // Si tiene geo_city_id, cargar relación geo para la respuesta
      if (dto.geo_city_id) {
        const storeWithGeo = await this.storeRepository.findByIdWithGeo(store.id);
        if (storeWithGeo) {
          this.logger.log(`Tienda creada: ${store.id} (geo: ${storeWithGeo.geo_city?.name})`);
          return this.toResponse(storeWithGeo);
        }
      }

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
        hasPrevPage: page > 1,
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

  // ============================================
  // CREACIÓN MASIVA
  // ============================================

  /**
   * Crear múltiples tiendas en una sola petición
   *
   * @description
   * Procesa cada tienda secuencialmente. Errores individuales no detienen
   * la creación de las demás. Retorna resultado detallado por cada tienda.
   *
   * @param dto - Array de tiendas a crear (máx 100)
   * @returns IBulkCreateStoreResponse con detalle por tienda
   */
  async bulkCreate(dto: BulkCreateStoreDto): Promise<IBulkCreateStoreResponse> {
    this.logger.log(`Creación masiva iniciada: ${dto.stores.length} tiendas`);

    const results: IBulkCreateStoreResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < dto.stores.length; i++) {
      const storeDto = dto.stores[i];

      try {
        const created = await this.create(storeDto);

        results.push({
          index: i,
          success: true,
          codigo: storeDto.codigo,
          store_id: created.id,
          nombre: created.nombre,
        });
        successCount++;
      } catch (error: any) {
        const errorMessage = error?.response?.message || error?.message || 'Error desconocido';

        results.push({
          index: i,
          success: false,
          codigo: storeDto.codigo,
          error: errorMessage,
        });
        failedCount++;

        this.logger.warn(`Bulk: tienda ${storeDto.codigo} (índice ${i}) falló: ${errorMessage}`);
      }
    }

    this.logger.log(
      `Creación masiva completada: ${successCount} éxitos, ${failedCount} errores de ${dto.stores.length} total`,
    );

    return {
      total: dto.stores.length,
      success_count: successCount,
      failed_count: failedCount,
      results,
    };
  }

  // ============================================
  // MÉTODOS DE SEGMENTACIÓN (FASE 2)
  // ============================================

  /**
   * Obtener tiendas por región
   *
   * @param region - Nombre de la región
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de IStoreListResponse
   */
  async findByRegion(region: string, companyId?: string): Promise<IStoreListResponse[]> {
    const stores = await this.storeRepository.findByRegion(region, companyId);
    return stores.map((s) => this.toListResponse(s));
  }

  /**
   * Obtener tiendas por tipo de ubicación
   *
   * @param locationType - Tipo de ubicación
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de IStoreListResponse
   */
  async findByLocationType(
    locationType: string,
    companyId?: string,
  ): Promise<IStoreListResponse[]> {
    const stores = await this.storeRepository.findByLocationType(locationType, companyId);
    return stores.map((s) => this.toListResponse(s));
  }

  /**
   * Obtener tiendas por formato
   *
   * @param storeFormat - Formato de tienda
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de IStoreListResponse
   */
  async findByFormat(storeFormat: string, companyId?: string): Promise<IStoreListResponse[]> {
    const stores = await this.storeRepository.findByFormat(storeFormat, companyId);
    return stores.map((s) => this.toListResponse(s));
  }

  /**
   * Obtener tiendas por tier de ventas
   *
   * @param salesTier - Clasificación de ventas (A, B, C, D, E)
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de IStoreListResponse
   */
  async findBySalesTier(salesTier: string, companyId?: string): Promise<IStoreListResponse[]> {
    const stores = await this.storeRepository.findBySalesTier(salesTier, companyId);
    return stores.map((s) => this.toListResponse(s));
  }

  /**
   * Obtener tiendas con drive-thru
   *
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de IStoreListResponse
   */
  async findWithDriveThru(companyId?: string): Promise<IStoreListResponse[]> {
    const stores = await this.storeRepository.findWithDriveThru(companyId);
    return stores.map((s) => this.toListResponse(s));
  }

  /**
   * Obtener tiendas con delivery
   *
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns Array de IStoreListResponse
   */
  async findWithDelivery(companyId?: string): Promise<IStoreListResponse[]> {
    const stores = await this.storeRepository.findWithDelivery(companyId);
    return stores.map((s) => this.toListResponse(s));
  }

  /**
   * Obtener datos de segmentación de una tienda
   *
   * @param id - UUID de la tienda
   * @returns IStoreSegmentationResponse
   */
  async getSegmentation(id: string): Promise<IStoreSegmentationResponse> {
    const store = await this.storeRepository.findById(id);
    if (!store) {
      this.handleError.notFound('Tienda', id);
    }
    return this.toSegmentationResponse(store);
  }

  /**
   * Obtener regiones de una compañía
   *
   * @param companyId - UUID de la compañía
   * @returns Array de { region, count }
   */
  async getRegions(companyId: string): Promise<Array<{ region: string; count: number }>> {
    return await this.storeRepository.getRegions(companyId);
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
      if (!updated) {
        this.handleError.internal('Error al actualizar tienda');
      }
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
    if (!updated) {
      this.handleError.internal('Error al activar tienda');
    }
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
    if (!updated) {
      this.handleError.internal('Error al desactivar tienda');
    }
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
   * @param companyId - (Opcional) Filtrar por compañía
   * @returns IStoreStatsResponse
   */
  async getStats(companyId?: string): Promise<IStoreStatsResponse> {
    return await this.storeRepository.getStats(companyId);
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Validar que geo_city_id exista y esté activo en el catálogo geográfico
   *
   * @param geoCityId - UUID de la ciudad en el catálogo
   * @throws NotFoundException si la ciudad no existe o no está activa
   */
  private async validateGeoCity(geoCityId: string): Promise<void> {
    const city = await this.geographyRepository.findCityById(geoCityId);
    if (!city) {
      this.handleError.notFound('Ciudad en catálogo geográfico', geoCityId);
    }

    this.logger.debug(
      `Geo validación OK: ciudad=${city.name}, ` +
        `depto=${city.department?.name}, ` +
        `país=${city.department?.country?.name} (${city.department?.country?.code})`,
    );
  }

  /**
   * Sanitizar DTO de creación
   */
  private sanitizeCreateDto(dto: CreateStoreDto): Partial<StoreEntity> {
    return {
      // Campos base
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

      // Referencia geográfica (catálogo)
      geo_city_id: dto.geo_city_id || undefined,

      // Campos de segmentación (FASE 2)
      region: dto.region ? this.sanitizer.sanitizeString(dto.region) : undefined,
      location_type: dto.location_type || undefined,
      store_format: dto.store_format || undefined,
      seating_capacity: dto.seating_capacity,
      has_drive_thru: dto.has_drive_thru ?? false,
      has_delivery: dto.has_delivery ?? false,
      operating_hours: dto.operating_hours || undefined,
      opening_date: dto.opening_date ? new Date(dto.opening_date) : undefined,
      manager_name: dto.manager_name ? this.sanitizer.sanitizeString(dto.manager_name) : undefined,
      sales_tier: dto.sales_tier || undefined,
      tags: dto.tags || undefined,
    };
  }

  /**
   * Sanitizar DTO de actualización
   */
  private sanitizeUpdateDto(dto: UpdateStoreDto): Partial<StoreEntity> {
    const sanitized: Partial<StoreEntity> = {};

    // Campos base
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

    // Campos de segmentación (FASE 2)
    if (dto.region) sanitized.region = this.sanitizer.sanitizeString(dto.region);
    if (dto.location_type) sanitized.location_type = dto.location_type;
    if (dto.store_format) sanitized.store_format = dto.store_format;
    if (dto.seating_capacity !== undefined) sanitized.seating_capacity = dto.seating_capacity;
    if (dto.has_drive_thru !== undefined) sanitized.has_drive_thru = dto.has_drive_thru;
    if (dto.has_delivery !== undefined) sanitized.has_delivery = dto.has_delivery;
    if (dto.operating_hours) sanitized.operating_hours = dto.operating_hours;
    if (dto.opening_date) sanitized.opening_date = new Date(dto.opening_date);
    if (dto.manager_name) sanitized.manager_name = this.sanitizer.sanitizeString(dto.manager_name);
    if (dto.sales_tier) sanitized.sales_tier = dto.sales_tier;
    if (dto.tags) sanitized.tags = dto.tags;

    return sanitized;
  }

  /**
   * Convertir entidad a respuesta completa
   * Si tiene geo_city cargado, enriquece con datos del catálogo geográfico
   */
  private toResponse(store: StoreEntity): IStoreResponse {
    const response: IStoreResponse = {
      id: store.id,
      company_id: store.company_id,
      company_name: store.company?.name,

      // Información básica
      nombre: store.nombre,
      codigo: store.codigo,
      email: store.email,
      telefono: store.telefono,

      // Ubicación
      direccion: store.direccion,
      ciudad: store.ciudad,
      zona: store.zona,
      latitud: store.latitud ? Number(store.latitud) : undefined,
      longitud: store.longitud ? Number(store.longitud) : undefined,

      // Campos de segmentación (FASE 2)
      region: store.region,
      location_type: store.location_type,
      store_format: store.store_format,
      seating_capacity: store.seating_capacity,
      has_drive_thru: store.has_drive_thru,
      has_delivery: store.has_delivery,
      operating_hours: store.operating_hours,
      opening_date: store.opening_date,
      manager_name: store.manager_name,
      sales_tier: store.sales_tier,
      tags: store.tags,

      // Referencia geográfica
      geo_city_id: store.geo_city_id,

      // Estado
      activo: store.activo,
      metadata: store.metadata,

      // Timestamps
      created_at: store.created_at,
      updated_at: store.updated_at,
    };

    // Enriquecer con datos del catálogo geográfico si está cargado
    if (store.geo_city) {
      const city = store.geo_city as any;
      const country = city.department?.country;

      response.geo_city_name = city.name;
      response.geo_department_name = city.department?.name;
      response.geo_country_code = country?.code;
      response.geo_country_name = country?.name;
      response.geo_timezone = city.timezone || country?.timezone;
      response.geo_currency_code = country?.currency_code;
      response.geo_currency_symbol = country?.currency_symbol;
      response.geo_tax_name = country?.tax_name;
      response.geo_tax_rate = country?.tax_rate ? Number(country.tax_rate) : undefined;
    }

    return response;
  }

  /**
   * Convertir entidad a respuesta simplificada (para listados)
   */
  private toListResponse(store: StoreEntity): IStoreListResponse {
    return {
      id: store.id,
      nombre: store.nombre,
      codigo: store.codigo,
      ciudad: store.ciudad,
      region: store.region,
      store_format: store.store_format,
      sales_tier: store.sales_tier,
      activo: store.activo,
    };
  }

  /**
   * Convertir entidad a respuesta de segmentación
   */
  private toSegmentationResponse(store: StoreEntity): IStoreSegmentationResponse {
    return {
      id: store.id,
      nombre: store.nombre,
      codigo: store.codigo,
      region: store.region,
      location_type: store.location_type,
      store_format: store.store_format,
      sales_tier: store.sales_tier,
      has_drive_thru: store.has_drive_thru,
      has_delivery: store.has_delivery,
      tags: store.tags,
    };
  }
}
