// src/modules/company/company.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto';
import { ICompanyResponse, ICompanyWithStoresResponse, ICompanyStatsResponse } from './interfaces';
import { CompanyEntity } from './entities';

/**
 * CompanyService
 *
 * @description
 * Maneja la lógica de negocio para el módulo Company.
 * Utiliza shared services para sanitización y manejo de errores.
 *
 * Responsabilidades:
 * - Validar reglas de negocio
 * - Sanitizar inputs
 * - Coordinar operaciones con el repository
 * - Transformar entidades a respuestas
 */
@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  /**
   * Crear compañía
   *
   * @param dto - Datos de la nueva compañía
   * @returns ICompanyResponse
   * @throws ConflictException si RUC o email ya existen
   */
  async create(dto: CreateCompanyDto): Promise<ICompanyResponse> {
    this.logger.log(`Creando compañía: ${dto.name}`);

    // Validar RUC único
    const existsByRuc = await this.companyRepository.existsByRuc(dto.ruc);
    if (existsByRuc) {
      this.handleError.conflict('El RUC ya está registrado', 'ruc');
    }

    // Validar email único
    const existsByEmail = await this.companyRepository.existsByEmail(dto.email);
    if (existsByEmail) {
      this.handleError.conflict('El email ya está registrado', 'email');
    }

    // Sanitizar inputs
    const sanitizedData = this.sanitizeCreateDto(dto);

    // Crear
    try {
      const company = await this.companyRepository.create(sanitizedData);
      this.logger.log(`Compañía creada: ${company.id}`);
      return this.toResponse(company);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando compañía');
    }
  }

  /**
   * Listar compañías con filtros y paginación
   *
   * @param query - Filtros y opciones de paginación
   * @returns IPaginatedResponse<ICompanyResponse>
   */
  async findAll(query: QueryCompanyDto): Promise<IPaginatedResponse<ICompanyResponse>> {
    // Sanitizar búsqueda
    if (query.search) {
      query.search = this.sanitizer.sanitizeString(query.search);
    }

    const [companies, total] = await this.companyRepository.findAll(query);

    const page = query.page || 1;
    const limit = query.limit || 10;

    return {
      data: companies.map((c) => this.toResponse(c)),
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
   * Obtener compañía por ID
   *
   * @param id - UUID de la compañía
   * @returns ICompanyResponse
   * @throws NotFoundException si no existe
   */
  async findById(id: string): Promise<ICompanyResponse> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }
    return this.toResponse(company);
  }

  /**
   * Obtener compañía por ID con tiendas
   *
   * @param id - UUID de la compañía
   * @returns ICompanyWithStoresResponse
   * @throws NotFoundException si no existe
   */
  async findByIdWithStores(id: string): Promise<ICompanyWithStoresResponse> {
    const company = await this.companyRepository.findByIdWithStores(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    const storesCount = company.stores?.length || 0;
    const activeStoresCount = company.stores?.filter((s: any) => s.activo === true).length || 0;

    return {
      ...this.toResponse(company),
      stores_count: storesCount,
      active_stores_count: activeStoresCount,
    };
  }

  /**
   * Actualizar compañía
   *
   * @param id - UUID de la compañía
   * @param dto - Datos a actualizar
   * @returns ICompanyResponse
   * @throws NotFoundException si no existe
   * @throws ConflictException si RUC o email ya existen
   */
  async update(id: string, dto: UpdateCompanyDto): Promise<ICompanyResponse> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    // Validar RUC único (si cambió)
    if (dto.ruc && dto.ruc !== company.ruc) {
      const existsByRuc = await this.companyRepository.existsByRuc(dto.ruc, id);
      if (existsByRuc) {
        this.handleError.conflict('El RUC ya está registrado', 'ruc');
      }
    }

    // Validar email único (si cambió)
    if (dto.email && dto.email !== company.email) {
      const existsByEmail = await this.companyRepository.existsByEmail(dto.email, id);
      if (existsByEmail) {
        this.handleError.conflict('El email ya está registrado', 'email');
      }
    }

    // Sanitizar
    const sanitizedData = this.sanitizeUpdateDto(dto);

    try {
      const updated = await this.companyRepository.update(id, sanitizedData);
      this.logger.log(`Compañía actualizada: ${id}`);
      return this.toResponse(updated);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando compañía');
    }
  }

  /**
   * Eliminar compañía (soft delete)
   *
   * @param id - UUID de la compañía
   * @throws NotFoundException si no existe
   */
  async delete(id: string): Promise<void> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    await this.companyRepository.softDelete(id);
    this.logger.log(`Compañía eliminada: ${id}`);
  }

  /**
   * Restaurar compañía eliminada
   *
   * @param id - UUID de la compañía
   * @returns ICompanyResponse
   */
  async restore(id: string): Promise<ICompanyResponse> {
    const restored = await this.companyRepository.restore(id);
    if (!restored) {
      this.handleError.notFound('Compañía', id);
    }

    this.logger.log(`Compañía restaurada: ${id}`);
    return await this.findById(id);
  }

  /**
   * Activar compañía
   *
   * @param id - UUID de la compañía
   * @returns ICompanyResponse
   * @throws NotFoundException si no existe
   */
  async activate(id: string): Promise<ICompanyResponse> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    const updated = await this.companyRepository.update(id, { is_active: true });
    this.logger.log(`Compañía activada: ${id}`);
    return this.toResponse(updated);
  }

  /**
   * Desactivar compañía
   *
   * @param id - UUID de la compañía
   * @returns ICompanyResponse
   * @throws NotFoundException si no existe
   */
  async deactivate(id: string): Promise<ICompanyResponse> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    const updated = await this.companyRepository.update(id, { is_active: false });
    this.logger.log(`Compañía desactivada: ${id}`);
    return this.toResponse(updated);
  }

  /**
   * Obtener estadísticas globales
   *
   * @returns ICompanyStatsResponse
   */
  async getStats(): Promise<ICompanyStatsResponse> {
    return await this.companyRepository.getStats();
  }

  /**
   * Obtener solo compañías activas
   *
   * @returns Array de ICompanyResponse
   */
  async findActive(): Promise<ICompanyResponse[]> {
    const companies = await this.companyRepository.findActive();
    return companies.map((c) => this.toResponse(c));
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Sanitizar DTO de creación
   */
  private sanitizeCreateDto(dto: CreateCompanyDto): Partial<CompanyEntity> {
    return {
      name: this.sanitizer.sanitizeString(dto.name),
      schema: dto.schema ? this.sanitizer.sanitizeString(dto.schema) : undefined,
      domain: dto.domain ? this.sanitizer.sanitizeString(dto.domain) : undefined,
      subdomain: dto.subdomain ? this.sanitizer.sanitizeString(dto.subdomain) : undefined,
      email: this.sanitizer.sanitizeEmail(dto.email),
      telefono: dto.telefono ? this.sanitizer.sanitizeString(dto.telefono) : undefined,
      direccion: dto.direccion ? this.sanitizer.sanitizeString(dto.direccion) : undefined,
      pais: this.sanitizer.sanitizeString(dto.pais),
      ciudad: this.sanitizer.sanitizeString(dto.ciudad),
      ruc: this.sanitizer.sanitizeString(dto.ruc).toUpperCase(),
      is_active: dto.is_active ?? true,
      plan: dto.plan ? this.sanitizer.sanitizeString(dto.plan) : undefined,
      settings: dto.settings,
    };
  }

  /**
   * Sanitizar DTO de actualización
   */
  private sanitizeUpdateDto(dto: UpdateCompanyDto): Partial<CompanyEntity> {
    const sanitized: Partial<CompanyEntity> = {};

    if (dto.name) sanitized.name = this.sanitizer.sanitizeString(dto.name);
    if (dto.domain) sanitized.domain = this.sanitizer.sanitizeString(dto.domain);
    if (dto.subdomain) sanitized.subdomain = this.sanitizer.sanitizeString(dto.subdomain);
    if (dto.email) sanitized.email = this.sanitizer.sanitizeEmail(dto.email);
    if (dto.telefono) sanitized.telefono = this.sanitizer.sanitizeString(dto.telefono);
    if (dto.direccion) sanitized.direccion = this.sanitizer.sanitizeString(dto.direccion);
    if (dto.pais) sanitized.pais = this.sanitizer.sanitizeString(dto.pais);
    if (dto.ciudad) sanitized.ciudad = this.sanitizer.sanitizeString(dto.ciudad);
    if (dto.ruc) sanitized.ruc = this.sanitizer.sanitizeString(dto.ruc).toUpperCase();
    if (dto.is_active !== undefined) sanitized.is_active = dto.is_active;
    if (dto.plan) sanitized.plan = this.sanitizer.sanitizeString(dto.plan);
    if (dto.settings) sanitized.settings = dto.settings;

    return sanitized;
  }

  /**
   * Convertir entidad a respuesta
   */
  private toResponse(company: CompanyEntity): ICompanyResponse {
    return {
      id: company.id,
      name: company.name,
      schema: company.schema,
      domain: company.domain,
      subdomain: company.subdomain,
      email: company.email,
      telefono: company.telefono,
      direccion: company.direccion,
      pais: company.pais,
      ciudad: company.ciudad,
      ruc: company.ruc,
      is_active: company.is_active,
      plan: company.plan,
      plan_expires_at: company.plan_expires_at,
      settings: company.settings,
      created_at: company.created_at,
      updated_at: company.updated_at,
    };
  }
}
