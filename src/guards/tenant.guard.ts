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
import { TenantExtractorService } from '@shared/database/tenant-extractor.service';

/**
 * Metadata key para el decorador @SkipTenant()
 */
export const SKIP_TENANT_KEY = 'skipTenant';

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

    const request = context.switchToHttp().getRequest<Request>();

    // 2. Obtener userId del JWT (request.user fue establecido por JwtAuthGuard)
    const userId = request.user?.id;

    if (!userId) {
      // Si no hay userId, intentar extraer tenant desde request (subdomain, header)
      try {
        const tenantContext = await this.tenantExtractor.extractFromRequest(request);

        if (tenantContext) {
          request.tenant = tenantContext;
          this.logger.log(
            `✅ Tenant extraído desde request: schema=${tenantContext.schema}, company=${tenantContext.companyId}`,
          );
          return true;
        }
      } catch (error) {
        // Error al extraer desde request, usar public como fallback
        this.logger.debug(`No se pudo extraer tenant desde request: ${error.message}`);
      }

      // Si no hay tenant, usar public como fallback
      request.tenant = {
        schema: 'public',
        companyId: null,
        userId: null,
      };

      this.logger.debug('No hay userId ni tenant identificable, usando schema public');
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
      // Si falla la extracción, el error se propaga (ForbiddenException, etc)
      this.logger.error(`Error extrayendo tenant para user ${userId}: ${error.message}`);
      throw error;
    }

    // 4. Siempre permitir continuar (el contexto ya fue establecido)
    return true;
  }
}
