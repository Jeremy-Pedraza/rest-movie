// src/shared/database/index.ts

/**
 * @fileoverview Barrel export para módulo database
 * @module shared/database
 *
 * ARQUITECTURA MULTI-TENANT (FASE 6 COMPLETADA)
 *
 * Flujo de ejecución:
 * ```
 * Request
 *   → Middleware (RequestId, Logger)
 *   → Guards:
 *       1. ThrottlerGuard (rate limiting)
 *       2. JwtAuthGuard (autenticación, establece request.user)
 *       3. TenantGuard (extrae tenant, establece request.tenant)
 *       4. RolesGuard (autorización)
 *   → Interceptors:
 *       1. LoggingInterceptor (log entrada)
 *       2. TenantInterceptor (SchemaContext.run())
 *       3. TimeoutInterceptor (30s)
 *   → Controller/Handler
 *   → Service
 *   → Repository (usa SchemaContext.getSchema())
 *   → Query con SET search_path TO {schema}
 * ```
 *
 * Componentes principales:
 * - SchemaContext: AsyncLocalStorage para mantener schema durante request
 * - TenantExtractorService: Extrae tenant desde user, subdomain o header
 * - TenantSchemaService: Crea/elimina schemas dinámicamente
 * - BaseRepository: Métodos withSchema() y withSchemaTransaction()
 *
 * Guards e Interceptors globales:
 * - TenantGuard: src/guards/tenant.guard.ts (registrado en AppModule)
 * - TenantInterceptor: src/interceptors/tenant.interceptor.ts (registrado en AppModule)
 */

// Módulo principal
export * from './database.module';

// Servicios
export * from './transaction.service';
export * from './schema.context';
export * from './tenant-extractor.service';
export * from './tenant-schema.service';

// Base repository
export * from './base.repository';

// Entidades
export * from './entities';

// Re-exports de guards e interceptors globales
export * from './interceptors';
export * from './guards';

// Types
export type { ITenantContext } from './schema.context';
export type { ISchemaOperationResult, ISchemaInfo } from './tenant-schema.service';
