// src/interceptors/tenant.interceptor.ts

/**
 * @fileoverview Interceptor para inyectar contexto del tenant en AsyncLocalStorage
 * @module interceptors
 *
 * Este interceptor establece el SchemaContext para que esté disponible
 * durante toda la ejecución del request sin necesidad de pasar el schema
 * como parámetro en cada función.
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { SchemaContext, ITenantContext } from '@shared/database';

/**
 * Interfaz extendida de Request con propiedades de tenant
 * Esta interfaz evita dependencias de archivos .d.ts globales
 */
interface RequestWithTenant extends Request {
  tenant?: ITenantContext;
}

/**
 * TenantInterceptor - Inyecta el schema en AsyncLocalStorage
 *
 * Este interceptor se ejecuta DESPUÉS de TenantGuard y establece
 * el contexto de schema en AsyncLocalStorage para que esté disponible
 * en todos los servicios y repositories durante la ejecución del request.
 *
 * Orden de ejecución:
 * 1. Guards (incluyendo TenantGuard) → establece request.tenant
 * 2. Interceptors (este) → inyecta tenant en SchemaContext
 * 3. Handler (controller) → ejecuta lógica
 * 4. Repositories → acceden a SchemaContext.getSchema()
 *
 * Características:
 * - Thread-safe (cada request tiene su propio contexto)
 * - No contamina el contexto global
 * - Automático (no requiere configuración en cada endpoint)
 * - Compatible con transacciones
 *
 * @example
 * ```typescript
 * // En app.module.ts
 * providers: [
 *   { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
 *   { provide: APP_INTERCEPTOR, useClass: TenantInterceptor }, // ← NUEVO
 *   { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
 * ]
 *
 * // En un repository (automático)
 * @Injectable()
 * export class ProductsRepository {
 *   constructor(private readonly schemaContext: SchemaContext) {}
 *
 *   async findAll() {
 *     const schema = this.schemaContext.getSchema(); // 'company_a_schema'
 *     // Schema está disponible sin pasar parámetros
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TenantInterceptor.name);

  constructor(private readonly schemaContext: SchemaContext) {}

  /**
   * Intercepta el request e inyecta el contexto del tenant
   *
   * Flujo:
   * 1. Lee request.tenant (establecido por TenantGuard)
   * 2. Si no hay tenant, continúa sin establecer contexto
   * 3. Ejecuta handler dentro de SchemaContext.run()
   * 4. AsyncLocalStorage mantiene el contexto durante toda la ejecución
   *
   * @param context - Contexto de ejecución
   * @param next - Handler siguiente
   * @returns Observable del resultado
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenant = request.tenant;

    // Si no hay tenant, continuar sin contexto
    if (!tenant) {
      this.logger.debug('No hay tenant en request, ejecutando sin contexto');
      return next.handle();
    }

    // Validar que tenant tiene la estructura correcta
    if (!this.isValidTenantContext(tenant)) {
      this.logWarn('Tenant en request no tiene la estructura correcta');
      return next.handle();
    }

    // Validar consistencia tenant vs user cuando ambos están presentes
    const user = request.user as { schema?: string } | undefined;
    if (user?.schema && user.schema !== tenant.schema) {
      this.logError('Inconsistencia tenant: request.user.schema difiere de request.tenant.schema');
    }

    // Establecer contexto en AsyncLocalStorage y ejecutar handler
    // Se almacena la subscription para propagar unsubscribe (teardown)
    return new Observable((observer) => {
      let innerSub: { unsubscribe: () => void } | undefined;

      this.schemaContext.run(tenant, () => {
        // Log sin exponer IDs internos; solo schema como referencia
        this.logger.debug(`SchemaContext establecido: schema=${tenant.schema}`);

        // Ejecutar handler dentro del contexto
        innerSub = next.handle().subscribe({
          next: (data) => observer.next(data),
          error: (err: Error) => {
            this.logError(`Error durante ejecución con schema ${tenant.schema}: ${err.message}`);
            observer.error(err);
          },
          complete: () => observer.complete(),
        });
      });

      // Teardown: propagar unsubscribe al inner observable
      return () => innerSub?.unsubscribe();
    });
  }

  /**
   * Valida que el tenant tenga la estructura esperada
   * @param tenant - Objeto a validar
   * @returns true si tiene la estructura correcta
   */
  private isValidTenantContext(tenant: unknown): tenant is ITenantContext {
    return (
      typeof tenant === 'object' &&
      tenant !== null &&
      'schema' in tenant &&
      typeof (tenant as ITenantContext).schema === 'string' &&
      ('companyId' in tenant
        ? (tenant as ITenantContext).companyId === null ||
          typeof (tenant as ITenantContext).companyId === 'string'
        : true) &&
      ('userId' in tenant
        ? (tenant as ITenantContext).userId === null ||
          typeof (tenant as ITenantContext).userId === 'string'
        : true)
    );
  }

  private logWarn(message: string): void {
    // Solo consola — la persistencia la maneja AllExceptionsFilter
    this.logger.warn(message);
  }

  private logError(message: string): void {
    // Solo consola — la persistencia la maneja AllExceptionsFilter
    // que captura la excepción propagada por observer.error()
    this.logger.error(message);
  }
}
