// src/guards/tenant.guard.ts

/**
 * @fileoverview Guard para extraer y establecer contexto del tenant
 * @module guards
 *
 * Este guard se ejecuta DESPUÉS de JwtAuthGuard y ANTES de RolesGuard
 * Extrae información del tenant (schema, company) desde el usuario autenticado
 * y la establece en request.tenant
 */

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TenantExtractorService, ITenantContext } from '@shared/database';

/**
 * Metadata key para el decorador @SkipTenant()
 */
export const SKIP_TENANT_KEY = 'skipTenant';

/**
 * Interfaz extendida de Request con propiedades de tenant y user
 * Esta interfaz evita dependencias de archivos .d.ts globales
 */
interface RequestWithTenant extends Request {
  tenant?: ITenantContext;
  user?: {
    id: string;
    email: string;
    companyId?: string | null;
    schema?: string | null;
    roles?: string[];
    [key: string]: unknown;
  };
}

/**
 * TenantGuard - Guard global para multi-tenant
 *
 * Responsabilidades:
 * - Extraer información del tenant desde el usuario autenticado
 * - Validar que el schema esté permitido en whitelist
 * - Establecer request.tenant con el contexto del tenant
 * - Permitir bypass con @SkipTenant() decorator
 *
 * Orden de ejecución de guards:
 * 1. ThrottlerGuard (rate limiting)
 * 2. JwtAuthGuard (autenticación) ← Antes de TenantGuard
 * 3. TenantGuard (tenant context) ← ESTE
 * 4. RolesGuard (autorización)
 *
 * @example
 * ```typescript
 * // En app.module.ts
 * providers: [
 *   { provide: APP_GUARD, useClass: JwtAuthGuard },
 *   { provide: APP_GUARD, useClass: TenantGuard }, // Después de JWT
 *   { provide: APP_GUARD, useClass: RolesGuard },
 * ]
 *
 * // En un controller
 * @Get('products')
 * async findAll(@Req() req: Request) {
 *   console.log(req.tenant.schema); // 'company_a_schema'
 * }
 *
 * // Skipear tenant guard
 * @SkipTenant()
 * @Get('health')
 * health() {
 *   return { status: 'ok' };
 * }
 * ```
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tenantExtractor: TenantExtractorService,
  ) {}

  /**
   * Verifica si el host tiene un subdomain válido para tenant
   * Ignora IPs locales y subdomains comunes
   */
  private isValidHostForTenant(host: string): boolean {
    if (!host) return false;

    // Ignorar IPs (127.0.0.1, localhost, 192.168.x.x, etc)
    if (/^(localhost|127\.|192\.168\.|10\.)/.test(host)) {
      return false;
    }

    const parts = host.split('.');
    // Necesita al menos 3 partes (subdomain.domain.tld)
    if (parts.length < 3) return false;

    const subdomain = parts[0];
    const ignoredSubdomains = ['www', 'api', 'admin'];

    return !ignoredSubdomains.includes(subdomain);
  }

  /**
   * Valida y establece el contexto del tenant
   *
   * Flujo:
   * 1. Verifica si tiene @SkipTenant() decorator
   * 2. Obtiene userId del JWT (ya validado por JwtAuthGuard)
   * 3. Extrae tenant desde userId o request
   * 4. Establece request.tenant
   * 5. Permite continuar (siempre retorna true)
   *
   * @param context - Contexto de ejecución
   * @returns true (siempre permite continuar)
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Verificar si tiene decorator @SkipTenant()
    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTenant) {
      this.logger.debug('Tenant guard skipped por @SkipTenant() decorator');
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    // 2. Obtener userId del JWT
    const userId = request.user?.id;

    if (!userId) {
      // ✅ Solo intentar extraer tenant si hay indicadores válidos
      const headerSubdomain = request.headers['x-tenant-subdomain'];
      const host = request.headers['host'] as string;
      const hasValidSubdomain = headerSubdomain || this.isValidHostForTenant(host);

      if (hasValidSubdomain) {
        try {
          const tenantContext = await this.tenantExtractor.extractFromRequest(request);

          if (tenantContext) {
            request.tenant = tenantContext;
            this.logger.debug(`✅ Tenant extraído desde request: schema=${tenantContext.schema}`);
            return true;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.debug(`No se pudo extraer tenant: ${errorMessage}`);
        }
      }

      // Fallback a public
      request.tenant = {
        schema: 'public',
        companyId: null,
        userId: null,
      };

      this.logger.debug('Usando schema public (sin autenticación)');
      return true;
    }

    // 3. Extraer tenant desde userId
    try {
      const tenantContext = await this.tenantExtractor.extractFromUser(userId);
      request.tenant = tenantContext;

      this.logger.log(
        `✅ Tenant extraído: schema=${tenantContext.schema}, company=${tenantContext.companyId}, user=${userId}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error extrayendo tenant para user ${userId}: ${errorMessage}`);
      throw error;
    }

    return true;
  }
}
