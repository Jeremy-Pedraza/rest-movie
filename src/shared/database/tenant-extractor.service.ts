// src/shared/database/tenant-extractor.service.ts

/**
 * @fileoverview Servicio para extraer información del tenant
 * @module shared/database
 *
 * Extrae el contexto del tenant (schema, company, user) desde diferentes fuentes:
 * - Usuario autenticado (más común)
 * - Subdomain del request
 * - Header X-Tenant-Subdomain
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@modules/user/entities';
import { CompanyEntity } from '@modules/company/entities';
import { SecurityConfigService } from '@config/security';
import { HandleErrorService } from '@shared/common';
import { LoggerService, LogContext } from '@modules/logger';
import { ITenantContext } from './schema.context';

/**
 * TenantExtractorService - Servicio para extraer contexto del tenant
 *
 * Este servicio es usado por TenantGuard para obtener información
 * del tenant desde diferentes fuentes y validar que el schema
 * esté permitido en la whitelist.
 *
 * Flujo típico:
 * 1. JwtAuthGuard valida el token y establece request.user
 * 2. TenantGuard llama a extractFromUser(userId)
 * 3. Se busca el usuario con su company
 * 4. Se valida que el schema esté permitido
 * 5. Se retorna el contexto del tenant
 *
 * @example
 * ```typescript
 * // En TenantGuard
 * const userId = request.user?.userId;
 * const context = await tenantExtractor.extractFromUser(userId);
 * // context = { schema: 'company_a_schema', companyId: '123', userId: 'user-1' }
 * ```
 */
@Injectable()
export class TenantExtractorService {
  private readonly logger = new Logger(TenantExtractorService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    private readonly securityConfig: SecurityConfigService,
    private readonly handleError: HandleErrorService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Extrae información del tenant desde el userId
   *
   * Este es el método principal usado en la mayoría de los casos.
   * Busca el usuario con su company y extrae el schema.
   *
   * @param userId - ID del usuario autenticado
   * @returns Contexto del tenant con schema
   * @throws UnauthorizedException Si el usuario no existe
   * @throws ForbiddenException Si la company está inactiva o schema no permitido
   *
   * @example
   * ```typescript
   * const context = await tenantExtractor.extractFromUser('user-123');
   * console.log(context.schema); // 'company_a_schema' o 'public'
   * console.log(context.companyId); // 'company-id' o null
   * ```
   */
  async extractFromUser(userId: string): Promise<ITenantContext> {
    // 1. Buscar usuario con su company (eager loading)
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      this.logError(`Usuario no encontrado: ${userId}`);
      this.handleError.unauthorized('Usuario no encontrado');
    }

    // 2. Si no tiene company, usar schema public
    if (!user.company || !user.company_id) {
      this.logger.debug(`Usuario ${userId} sin company, usando schema public`);
      return {
        schema: 'public',
        companyId: null,
        userId,
      };
    }

    // 3. Validar que la company esté activa
    if (!user.company.is_active) {
      this.logWarn(`Company ${user.company.id} inactiva, usuario ${userId} bloqueado`);
      this.handleError.forbidden('Empresa desactivada');
    }

    // 4. Obtener schema de la company
    const schema = user.company.schema;

    // 5. Validar que el schema esté permitido en whitelist
    if (!this.securityConfig.isSchemaAllowed(schema)) {
      this.logError(
        `Schema no permitido: ${schema} para company ${user.company.id}, usuario ${userId}`,
      );
      this.handleError.forbidden(`Schema no permitido: ${schema}`);
    }

    // 6. Retornar contexto completo
    this.logger.debug(
      `Contexto extraído: schema=${schema}, company=${user.company.id}, user=${userId}`,
    );

    return {
      schema,
      companyId: user.company.id,
      userId,
    };
  }

  /**
   * Extrae tenant desde request (subdomain o header)
   *
   * Este método es alternativo para casos donde no hay usuario autenticado
   * pero se puede identificar el tenant por subdomain o header.
   *
   * Útil para:
   * - Landing pages públicas por tenant
   * - Páginas de login específicas por tenant
   * - APIs públicas multi-tenant
   *
   * @param req - Request de Express
   * @returns Contexto del tenant o null si no se puede extraer
   * @throws ForbiddenException Si el tenant no existe o schema no permitido
   *
   * @example
   * ```typescript
   * // Request a: https://company-a.miapp.com/login
   * const context = await tenantExtractor.extractFromRequest(req);
   * // context = { schema: 'company_a_schema', companyId: '123', userId: null }
   *
   * // Request con header: X-Tenant-Subdomain: company-a
   * const context = await tenantExtractor.extractFromRequest(req);
   * // context = { schema: 'company_a_schema', companyId: '123', userId: null }
   * ```
   */
  async extractFromRequest(req: any): Promise<ITenantContext | null> {
    // Opción 1: Header X-Tenant-Subdomain
    const headerSubdomain = req.headers['x-tenant-subdomain'] as string;
    if (headerSubdomain) {
      this.logger.debug(`Tenant identificado por header: ${headerSubdomain}`);
      return this.extractFromSubdomain(headerSubdomain);
    }

    // Opción 2: Subdomain del host
    const host = req.headers['host'] as string;
    if (host) {
      const parts = host.split('.');

      // Si tiene más de 2 partes, el primero es el subdomain
      // Ejemplo: company-a.miapp.com → ['company-a', 'miapp', 'com']
      if (parts.length > 2) {
        const subdomain = parts[0];

        // Ignorar subdomains comunes que no son tenants
        const ignoredSubdomains = ['www', 'api', 'admin', 'localhost'];
        if (!ignoredSubdomains.includes(subdomain)) {
          this.logger.debug(`Tenant identificado por subdomain: ${subdomain}`);
          return this.extractFromSubdomain(subdomain);
        }
      }
    }

    // No se pudo identificar tenant
    this.logger.debug('No se pudo identificar tenant desde request');
    return null;
  }

  /**
   * Extrae tenant desde subdomain
   *
   * Busca una company activa por subdomain y extrae su schema.
   *
   * @param subdomain - Subdomain a buscar
   * @returns Contexto del tenant
   * @throws ForbiddenException Si el tenant no existe o schema no permitido
   * @private
   *
   * @example
   * ```typescript
   * const context = await this.extractFromSubdomain('company-a');
   * // context = { schema: 'company_a_schema', companyId: '123', userId: null }
   * ```
   */
  private async extractFromSubdomain(subdomain: string): Promise<ITenantContext> {
    // Buscar company por subdomain
    const company = await this.companyRepo.findOne({
      where: { subdomain, is_active: true },
    });

    if (!company) {
      this.logWarn(`Tenant no encontrado o inactivo: ${subdomain}`);
      this.handleError.forbidden(`Tenant no encontrado: ${subdomain}`);
    }

    // Validar que el schema esté permitido
    if (!this.securityConfig.isSchemaAllowed(company.schema)) {
      this.logError(`Schema no permitido: ${company.schema} para subdomain ${subdomain}`);
      this.handleError.forbidden(`Schema no permitido: ${company.schema}`);
    }

    this.logger.debug(
      `Contexto extraído desde subdomain: schema=${company.schema}, company=${company.id}`,
    );

    return {
      schema: company.schema,
      companyId: company.id,
      userId: null, // No hay usuario en este flujo
    };
  }

  /**
   * Valida que un usuario tenga acceso a una company específica
   *
   * Útil para validaciones adicionales en endpoints específicos
   *
   * @param userId - ID del usuario
   * @param companyId - ID de la company a validar
   * @returns true si el usuario pertenece a la company
   * @throws ForbiddenException Si el usuario no pertenece a la company
   *
   * @example
   * ```typescript
   * // En un service
   * await tenantExtractor.validateUserAccess(userId, companyId);
   * ```
   */
  async validateUserAccess(userId: string, companyId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      this.handleError.unauthorized('Usuario no encontrado');
    }

    if (!user.company || user.company.id !== companyId) {
      this.logWarn(
        `Usuario ${userId} intentó acceder a company ${companyId} sin permiso (su company: ${user.company?.id || 'null'})`,
      );
      this.handleError.forbidden('No tienes acceso a esta empresa');
    }

    return true;
  }

  /**
   * Obtiene información de la company de un usuario
   *
   * Útil para obtener detalles de la company sin todo el contexto
   *
   * @param userId - ID del usuario
   * @returns Company o null si no tiene
   *
   * @example
   * ```typescript
   * const company = await tenantExtractor.getUserCompany(userId);
   * console.log(company.name); // 'Restaurante Valle'
   * console.log(company.schema); // 'restaurant_valle_schema'
   * ```
   */
  async getUserCompany(userId: string): Promise<CompanyEntity | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    return user?.company || null;
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.AUTH,
      service: TenantExtractorService.name,
    });
  }

  private logError(message: string): void {
    this.logger.error(message);
    void this.loggerService?.error(message, {
      context: LogContext.AUTH,
      service: TenantExtractorService.name,
    });
  }
}
