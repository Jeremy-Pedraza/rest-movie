// src/modules/company/company.service.ts

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { LoggerService, LogContext } from '@modules/logger';
import { CompanyRepository } from './company.repository';
import { SanitizerService, HandleErrorService, IPaginatedResponse } from '@shared/common';
import { TenantSchemaService } from '@shared/database';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto';
import {
  ICompanyResponse,
  ICompanyWithStoresResponse,
  ICompanyStatsResponse,
  ICompanyListResponse,
  ICompanyLocaleResponse,
} from './interfaces';
import { CompanyEntity } from './entities';
import { sanitizeCreateCompanyDto, sanitizeUpdateCompanyDto } from './sanitizers/company.sanitizer';

/**
 * CompanyService
 *
 * @description
 * Maneja la lógica de negocio para el módulo Company.
 * Utiliza shared services para sanitización y manejo de errores.
 *
 * @version 3.0.0 - FASE 7.2.C: Creación automática de schema multi-tenant
 *
 * Responsabilidades:
 * - Validar reglas de negocio
 * - Sanitizar inputs
 * - Coordinar operaciones con el repository
 * - Transformar entidades a respuestas
 * - **Crear schema de tenant automáticamente** (FASE 7.2.C)
 */
@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
    private readonly tenantSchemaService: TenantSchemaService, // ✅ FASE 7.2.C
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Crear compañía
   *
   * @description
   * Crea una nueva compañía y, si tiene schema definido (diferente de 'public'),
   * crea automáticamente el schema del tenant con todas las tablas de reportes.
   *
   * Proceso:
   * 1. Validar RUC y email únicos
   * 2. Validar schema único (si se proporciona)
   * 3. Crear registro en public.companies
   * 4. Si schema != 'public', crear schema de tenant
   * 5. Retornar compañía creada
   *
   * @param dto - Datos de la nueva compañía
   * @returns ICompanyResponse
   * @throws ConflictException si RUC, email o schema ya existen
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

    // ✅ FASE 7.2.C: Validar schema único (si se proporciona)
    if (dto.schema && dto.schema !== 'public') {
      const existsBySchema = await this.companyRepository.existsBySchema(dto.schema);
      if (existsBySchema) {
        this.handleError.conflict('El schema ya está registrado', 'schema');
      }

      // Verificar que no exista el schema en PostgreSQL
      const schemaExists = await this.tenantSchemaService.schemaExists(dto.schema);
      if (schemaExists) {
        this.handleError.conflict(
          `El schema '${dto.schema}' ya existe en la base de datos`,
          'schema',
        );
      }
    }

    // Sanitizar inputs
    const sanitizedData = this.sanitizeCreateDto(dto);

    // Crear compañía
    let company: CompanyEntity;
    try {
      company = await this.companyRepository.create(sanitizedData);
      this.logger.log(`Compañía creada: ${company.id} (${company.name})`);
    } catch (error) {
      throw this.handleError.handle(error, 'Error creando compañía');
    }

    // ✅ FASE 7.2.C: Crear schema de tenant automáticamente
    if (company.schema && company.schema !== 'public') {
      this.logger.log(`Creando schema de tenant: ${company.schema}`);

      const schemaResult = await this.tenantSchemaService.createTenantSchema(
        company.schema,
        company.id,
      );

      if (!schemaResult.success) {
        // Si falla la creación del schema, eliminar la compañía y lanzar error
        this.logError(`Error creando schema ${company.schema}: ${schemaResult.error}`);
        await this.companyRepository.hardDelete(company.id);

        this.handleError.internal(
          `Compañía creada pero falló la creación del schema: ${schemaResult.error}`,
        );
      }

      this.logger.log(
        `Schema '${company.schema}' creado con ${schemaResult.tables_created} tablas`,
      );
    }

    return this.toResponse(company);
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
        hasPrevPage: page > 1,
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

    // ✅ NOTA: No permitir cambiar el schema después de creado
    // El schema es inmutable una vez creado (por seguridad de datos)

    // Sanitizar
    const sanitizedData = this.sanitizeUpdateDto(dto);

    try {
      const updated = await this.companyRepository.update(id, sanitizedData);
      if (!updated) {
        this.handleError.notFound('Compañía', id);
      }
      this.logger.log(`Compañía actualizada: ${id}`);
      return this.toResponse(updated);
    } catch (error) {
      throw this.handleError.handle(error, 'Error actualizando compañía');
    }
  }

  /**
   * Eliminar compañía (soft delete)
   *
   * @description
   * Elimina lógicamente la compañía. El schema del tenant NO se elimina
   * automáticamente para preservar datos históricos. Use `hardDelete`
   * para eliminar permanentemente incluyendo el schema.
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
    this.logger.log(`Compañía eliminada (soft): ${id}`);

    // ✅ NOTA: El schema NO se elimina en soft delete
    // Esto preserva los datos históricos de reportes
  }

  /**
   * Eliminar compañía permanentemente (incluyendo schema)
   *
   * @description
   * ⚠️ OPERACIÓN DESTRUCTIVA E IRREVERSIBLE
   * Elimina la compañía y su schema de tenant con todos los datos.
   *
   * @param id - UUID de la compañía
   * @param forceDropSchema - Si true, elimina el schema aunque tenga datos
   * @throws NotFoundException si no existe
   */
  async hardDelete(id: string, forceDropSchema = false): Promise<void> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    // ✅ FASE 7.2.C: Eliminar schema de tenant
    if (company.schema && company.schema !== 'public') {
      this.logWarn(`Eliminando schema de tenant: ${company.schema}`);

      const dropResult = await this.tenantSchemaService.dropTenantSchema(
        company.schema,
        forceDropSchema,
      );

      if (!dropResult.success) {
        this.logError(`Error eliminando schema ${company.schema}: ${dropResult.error}`);
        // Si no se puede eliminar el schema, no eliminar la compañía
        this.handleError.internal(
          `No se pudo eliminar el schema: ${dropResult.error}. Use forceDropSchema=true para forzar.`,
        );
      }

      this.logWarn(`Schema '${company.schema}' eliminado`);
    }

    // Eliminar compañía permanentemente
    await this.companyRepository.hardDelete(id);
    this.logWarn(`Compañía eliminada permanentemente: ${id}`);
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
    if (!updated) {
      this.handleError.notFound('Compañía', id);
    }
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
    if (!updated) {
      this.handleError.notFound('Compañía', id);
    }
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
  // MÉTODOS DE INTERNACIONALIZACIÓN (FASE 1)
  // ============================================

  /**
   * Obtener compañías por código de país
   *
   * @param countryCode - Código ISO 3166-1 alpha-2 (ej: 'DO', 'GT')
   * @returns Array de ICompanyListResponse
   */
  async findByCountryCode(countryCode: string): Promise<ICompanyListResponse[]> {
    const companies = await this.companyRepository.findByCountryCode(countryCode);
    return companies.map((c) => this.toListResponse(c));
  }

  /**
   * Obtener compañías por moneda
   *
   * @param currencyCode - Código ISO 4217 (ej: 'DOP', 'GTQ')
   * @returns Array de ICompanyListResponse
   */
  async findByCurrency(currencyCode: string): Promise<ICompanyListResponse[]> {
    const companies = await this.companyRepository.findByCurrency(currencyCode);
    return companies.map((c) => this.toListResponse(c));
  }

  /**
   * Obtener configuración de localización de una compañía
   *
   * @param id - UUID de la compañía
   * @returns ICompanyLocaleResponse
   */
  async getLocale(id: string): Promise<ICompanyLocaleResponse> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }
    return this.toLocaleResponse(company);
  }

  /**
   * Obtener listado de países únicos
   *
   * @returns Array de { pais, country_code, count }
   */
  async getCountryCodes(): Promise<Array<{ pais: string; country_code: string; count: number }>> {
    return await this.companyRepository.getCountryCodes();
  }

  /**
   * Obtener listado de monedas únicas
   *
   * @returns Array de { currency_code, currency_symbol, count }
   */
  async getCurrencies(): Promise<
    Array<{ currency_code: string; currency_symbol: string; count: number }>
  > {
    return await this.companyRepository.getCurrencies();
  }

  // ============================================
  // MÉTODOS DE GESTIÓN DE SCHEMA (FASE 7.2.C)
  // ============================================

  /**
   * Obtener información del schema de una compañía
   *
   * @param id - UUID de la compañía
   * @returns Información del schema o null
   */
  async getSchemaInfo(id: string) {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    if (!company.schema || company.schema === 'public') {
      return null;
    }

    return await this.tenantSchemaService.getSchemaInfo(company.schema);
  }

  /**
   * Sincronizar schema de una compañía con el template
   *
   * @description
   * Útil cuando se agregan nuevas tablas al template y se quieren
   * propagar a schemas existentes.
   *
   * @param id - UUID de la compañía
   * @returns Resultado de la sincronización
   */
  async syncSchema(id: string) {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      this.handleError.notFound('Compañía', id);
    }

    if (!company.schema || company.schema === 'public') {
      return {
        success: false,
        message: 'La compañía no tiene schema de tenant',
      };
    }

    return await this.tenantSchemaService.syncSchemaWithTemplate(company.schema);
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Sanitizar DTO de creación
   */
  private sanitizeCreateDto(dto: CreateCompanyDto): Partial<CompanyEntity> {
    return sanitizeCreateCompanyDto(this.sanitizer, dto);
  }

  /**
   * Sanitizar DTO de actualización
   */
  private sanitizeUpdateDto(dto: UpdateCompanyDto): Partial<CompanyEntity> {
    return sanitizeUpdateCompanyDto(this.sanitizer, dto);
  }

  /**
   * Convertir entidad a respuesta completa
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
      plan_expires_at: company.plan_expires_at ?? undefined,
      settings: company.settings,

      // Campos de internacionalización (FASE 1)
      timezone: company.timezone,
      country_code: company.country_code,
      departamento: company.departamento,
      currency_code: company.currency_code,
      currency_symbol: company.currency_symbol,
      date_format: company.date_format,
      tax_config: company.tax_config,

      // Timestamps
      created_at: company.createdAt,
      updated_at: company.updatedAt,
    };
  }

  /**
   * Convertir entidad a respuesta simplificada (para listados)
   */
  private toListResponse(company: CompanyEntity): ICompanyListResponse {
    return {
      id: company.id,
      name: company.name,
      subdomain: company.subdomain,
      country_code: company.country_code,
      currency_code: company.currency_code,
      is_active: company.is_active,
    };
  }

  /**
   * Convertir entidad a respuesta de localización
   */
  private toLocaleResponse(company: CompanyEntity): ICompanyLocaleResponse {
    return {
      id: company.id,
      name: company.name,
      country_code: company.country_code,
      timezone: company.timezone,
      currency_code: company.currency_code,
      currency_symbol: company.currency_symbol,
      date_format: company.date_format,
      tax_config: company.tax_config,
    };
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.BUSINESS,
      service: CompanyService.name,
    });
  }

  private logError(message: string): void {
    this.logger.error(message);
    void this.loggerService?.error(message, {
      context: LogContext.BUSINESS,
      service: CompanyService.name,
    });
  }
}
