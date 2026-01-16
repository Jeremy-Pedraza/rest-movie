// src/shared/database/interceptors/tenant.interceptor.ts

/**
 * @fileoverview Interceptor para establecer el contexto de tenant
 * @module shared/database/interceptors
 *
 * ARQUITECTURA MULTI-TENANT (FASE 6):
 *
 * Este interceptor establece el SchemaContext basado en el usuario autenticado.
 * Se ejecuta DESPUÉS de JwtAuthGuard, por lo que request.user ya está disponible.
 *
 * Flujo:
 * 1. Request llega → Guards (JwtAuthGuard establece request.user)
 * 2. TenantInterceptor obtiene schema de request.user
 * 3. Establece SchemaContext.run() con el schema del tenant
 * 4. Handler se ejecuta DENTRO del contexto
 * 5. Repository usa SchemaContext.getSchema() para queries
 *
 * @example
 * ```
 * Request:
 *   Authorization: Bearer <jwt-con-company>
 *
 * Usuario autenticado (request.user):
 *   { id: 'user-1', schema: 'taco_bell_rd', companyId: 'company-1' }
 *
 * Contexto establecido:
 *   { schema: 'taco_bell_rd', companyId: 'company-1', userId: 'user-1' }
 *
 * Repository query:
 *   SET search_path TO taco_bell_rd, public
 *   SELECT * FROM report_headers WHERE ...
 * ```
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SchemaContext, ITenantContext } from '../schema.context';
import { UserSessionDto } from '@modules/auth/interfaces';

/**
 * TenantInterceptor - Establece contexto de tenant para cada request
 *
 * Características:
 * - Se ejecuta después de guards (request.user disponible)
 * - Extrae schema del usuario autenticado
 * - Fallback a 'public' si no hay schema
 * - Thread-safe (AsyncLocalStorage)
 * - Compatible con rutas @Public() (usa schema 'public')
 *
 * Prioridad de schema:
 * 1. user.company.schema (más confiable, cargado de BD)
 * 2. user.schema (del JWT payload)
 * 3. 'public' (fallback para usuarios sin company)
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private readonly schemaContext: SchemaContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserSessionDto | undefined;

    // Construir contexto del tenant
    const tenantContext = this.buildTenantContext(user);

    this.logger.debug(
      `Contexto de tenant establecido: schema=${tenantContext.schema}, ` +
        `company=${tenantContext.companyId}, user=${tenantContext.userId}`,
    );

    // Ejecutar handler dentro del contexto de tenant
    // Usamos una Promise para manejar el Observable correctamente
    return new Observable((subscriber) => {
      this.schemaContext.run(tenantContext, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  /**
   * Construye el contexto del tenant basado en el usuario
   *
   * @param user - Usuario autenticado (puede ser undefined en rutas públicas)
   * @returns Contexto del tenant
   */
  private buildTenantContext(user: UserSessionDto | undefined): ITenantContext {
    // Si no hay usuario (ruta pública), usar schema public
    if (!user) {
      return {
        schema: 'public',
        companyId: null,
        userId: null,
      };
    }

    // Obtener schema con prioridad: company.schema > user.schema > 'public'
    const schema = user.company?.schema || user.schema || 'public';

    return {
      schema,
      companyId: user.companyId || user.company?.id || null,
      userId: user.id,
    };
  }
}
