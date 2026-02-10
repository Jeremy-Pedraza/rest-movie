// src/shared/database/database.module.ts

/**
 * @fileoverview Módulo global de utilidades de base de datos
 * @module shared/database
 *
 * FASE 6: Documentación actualizada para multi-tenant
 *
 * NOTA: TenantInterceptor y TenantGuard están registrados GLOBALMENTE
 * en AppModule, no aquí. Este módulo solo provee los servicios.
 */

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction.service';
import { SchemaContext } from './schema.context';
import { TenantExtractorService } from './tenant-extractor.service';
import { TenantSchemaService } from './tenant-schema.service';
import { TenantSchemaEntity } from './entities';
import { UserEntity } from '@modules/user/entities';
import { CompanyEntity } from '@modules/company/entities';

/**
 * DatabaseModule - Módulo compartido para utilidades de base de datos
 *
 * Proporciona servicios globales para:
 * - Manejo de transacciones (TransactionService)
 * - Contexto de schema multi-tenant (SchemaContext)
 * - Extracción de información del tenant (TenantExtractorService)
 * - Gestión dinámica de schemas (TenantSchemaService)
 *
 * Este módulo es @Global, por lo que sus exports están disponibles
 * en toda la aplicación sin necesidad de importarlo.
 *
 * Flujo Multi-Tenant (FASE 6):
 * ```
 * Request → JwtAuthGuard (establece request.user)
 *         → TenantGuard (extrae tenant, establece request.tenant)
 *         → TenantInterceptor (establece SchemaContext)
 *         → Handler
 *         → Repository usa SchemaContext.getSchema()
 *         → Query con SET search_path TO {tenant_schema}
 * ```
 *
 * IMPORTANTE:
 * - TenantGuard y TenantInterceptor están en src/guards/ y src/interceptors/
 * - Se registran globalmente en AppModule con APP_GUARD y APP_INTERCEPTOR
 * - Este módulo solo provee los servicios que usan
 *
 * @example
 * ```typescript
 * // El interceptor establece el contexto automáticamente
 * // El repository puede obtener el schema sin pasarlo como parámetro
 *
 * @Injectable()
 * export class ProductRepository extends BaseRepository<ProductEntity> {
 *   async findAll() {
 *     // withSchema() usa el contexto establecido por TenantInterceptor
 *     return await this.withSchema(async () => {
 *       return await this.repository.find();
 *     });
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CompanyEntity, TenantSchemaEntity])],
  providers: [
    // Servicios core
    TransactionService,
    SchemaContext,
    TenantExtractorService,
    TenantSchemaService,
  ],
  exports: [
    TransactionService,
    SchemaContext,
    TenantExtractorService,
    TenantSchemaService,
    TypeOrmModule,
  ],
})
export class DatabaseModule {}
