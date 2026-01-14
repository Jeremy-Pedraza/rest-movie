// src/shared/database/schema.context.ts

/**
 * @fileoverview Contexto de schema para multi-tenant
 * @module shared/database
 *
 * Usa AsyncLocalStorage para mantener el contexto del tenant
 * durante toda la ejecución de un request
 */

import { Injectable, Logger } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Interfaz para el contexto del tenant
 */
export interface ITenantContext {
  /**
   * Schema de PostgreSQL del tenant
   * @example 'public', 'company_a_schema', 'restaurant_valle_schema'
   */
  schema: string;

  /**
   * ID de la empresa (tenant)
   * @nullable Solo disponible si el usuario pertenece a una company
   */
  companyId: string | null;

  /**
   * ID del usuario autenticado
   * @nullable Solo disponible en requests autenticados
   */
  userId: string | null;
}

/**
 * SchemaContext - Servicio para gestionar el contexto del schema
 *
 * Usa AsyncLocalStorage de Node.js para mantener el contexto
 * del tenant durante toda la ejecución de un request sin
 * necesidad de pasar el schema como parámetro en cada función.
 *
 * Características:
 * - Thread-safe (cada request tiene su propio contexto)
 * - No contamina el contexto global
 * - Automático con interceptors
 *
 * @example
 * ```typescript
 * // En TenantInterceptor
 * schemaContext.run(tenantContext, () => {
 *   // Dentro de este callback, todas las funciones
 *   // pueden obtener el schema sin pasarlo como parámetro
 * });
 *
 * // En Repository
 * const schema = schemaContext.getSchema(); // 'company_a_schema'
 * await queryRunner.query(`SET search_path TO ${schema}`);
 * ```
 */
@Injectable()
export class SchemaContext {
  private readonly logger = new Logger(SchemaContext.name);
  private readonly storage = new AsyncLocalStorage<ITenantContext>();

  /**
   * Ejecuta callback con contexto de tenant
   *
   * Esta función debe ser llamada por TenantInterceptor
   * para establecer el contexto al inicio del request
   *
   * @param context - Contexto del tenant (schema, companyId, userId)
   * @param callback - Función a ejecutar con el contexto establecido
   *
   * @example
   * ```typescript
   * schemaContext.run({ schema: 'tenant_a', companyId: '123', userId: 'user-1' }, () => {
   *   // Código que necesita el contexto
   *   const schema = schemaContext.getSchema(); // 'tenant_a'
   * });
   * ```
   */
  run(context: ITenantContext, callback: () => void): void {
    this.logger.debug(
      `Estableciendo contexto: schema=${context.schema}, company=${context.companyId}`,
    );
    this.storage.run(context, callback);
  }

  /**
   * Obtiene contexto completo del tenant actual
   *
   * @returns Contexto del tenant o undefined si no hay contexto
   *
   * @example
   * ```typescript
   * const context = schemaContext.get();
   * if (context) {
   *   console.log(context.schema); // 'company_a_schema'
   *   console.log(context.companyId); // 'company-id-123'
   * }
   * ```
   */
  get(): ITenantContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Obtiene schema del contexto actual
   *
   * Si no hay contexto, retorna 'public' como default
   *
   * @returns Schema actual o 'public'
   *
   * @example
   * ```typescript
   * const schema = schemaContext.getSchema(); // 'company_a_schema' o 'public'
   * await queryRunner.query(`SET search_path TO ${schema}`);
   * ```
   */
  getSchema(): string {
    const context = this.storage.getStore();
    const schema = context?.schema || 'public';

    if (!context) {
      this.logger.debug('No hay contexto de tenant, usando schema public');
    }

    return schema;
  }

  /**
   * Obtiene ID de la empresa del contexto actual
   *
   * @returns ID de la empresa o undefined
   *
   * @example
   * ```typescript
   * const companyId = schemaContext.getCompanyId();
   * if (companyId) {
   *   // Usuario pertenece a una company
   * }
   * ```
   */
  getCompanyId(): string | null | undefined {
    return this.storage.getStore()?.companyId;
  }

  /**
   * Obtiene ID del usuario del contexto actual
   *
   * @returns ID del usuario o undefined
   *
   * @example
   * ```typescript
   * const userId = schemaContext.getUserId();
   * if (userId) {
   *   // Request autenticado
   * }
   * ```
   */
  getUserId(): string | null | undefined {
    return this.storage.getStore()?.userId;
  }

  /**
   * Verifica si hay un contexto de tenant activo
   *
   * @returns true si hay contexto
   *
   * @example
   * ```typescript
   * if (schemaContext.hasContext()) {
   *   // Hay contexto, se puede obtener schema
   *   const schema = schemaContext.getSchema();
   * }
   * ```
   */
  hasContext(): boolean {
    return this.storage.getStore() !== undefined;
  }

  /**
   * Verifica si el schema actual es 'public'
   *
   * @returns true si es public o no hay contexto
   *
   * @example
   * ```typescript
   * if (schemaContext.isPublicSchema()) {
   *   // Usuario sin company o sin contexto
   * }
   * ```
   */
  isPublicSchema(): boolean {
    return this.getSchema() === 'public';
  }

  /**
   * Obtiene información del contexto para logging
   *
   * @returns String con información del contexto
   *
   * @example
   * ```typescript
   * logger.log(`Ejecutando query: ${schemaContext.getContextInfo()}`);
   * // "Ejecutando query: schema=company_a_schema, company=123, user=user-1"
   * ```
   */
  getContextInfo(): string {
    const context = this.storage.getStore();

    if (!context) {
      return 'schema=public (sin contexto)';
    }

    return `schema=${context.schema}, company=${context.companyId || 'null'}, user=${context.userId || 'null'}`;
  }
}
