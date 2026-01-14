// src/shared/database/database.module.ts

/**
 * @fileoverview Módulo global de utilidades de base de datos
 * @module shared/database
 */

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction.service';
import { SchemaContext } from './schema.context';
import { TenantExtractorService } from './tenant-extractor.service';
import { UserEntity } from '@modules/user/entities';
import { CompanyEntity } from '@modules/company/entities';

/**
 * DatabaseModule - Módulo compartido para utilidades de base de datos
 *
 * Proporciona servicios globales para:
 * - Manejo de transacciones (TransactionService)
 * - Contexto de schema multi-tenant (SchemaContext)
 * - Extracción de información del tenant (TenantExtractorService)
 *
 * Este módulo es @Global, por lo que sus exports están disponibles
 * en toda la aplicación sin necesidad de importarlo.
 *
 * Características multi-tenant:
 * - TenantExtractorService: Extrae schema desde userId o request
 * - SchemaContext: Mantiene contexto del tenant en AsyncLocalStorage
 * - Integración con SecurityConfigService para validar schemas
 *
 * @example
 * ```typescript
 * // TransactionService
 * @Injectable()
 * export class OrderService {
 *   constructor(private readonly transactionService: TransactionService) {}
 *
 *   async createOrder(dto: CreateOrderDto) {
 *     return this.transactionService.execute(async (manager) => {
 *       // operaciones en transacción...
 *     });
 *   }
 * }
 *
 * // SchemaContext
 * @Injectable()
 * export class ProductRepository {
 *   constructor(private readonly schemaContext: SchemaContext) {}
 *
 *   async findAll() {
 *     const schema = this.schemaContext.getSchema(); // 'company_a_schema'
 *     await queryRunner.query(`SET search_path TO ${schema}`);
 *     // queries se ejecutan en el schema del tenant
 *   }
 * }
 *
 * // TenantExtractorService
 * @Injectable()
 * export class TenantGuard implements CanActivate {
 *   constructor(private readonly tenantExtractor: TenantExtractorService) {}
 *
 *   async canActivate(context: ExecutionContext) {
 *     const userId = request.user?.id;
 *     const tenant = await this.tenantExtractor.extractFromUser(userId);
 *     request.tenant = tenant;
 *     return true;
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    // Importar entidades necesarias para TenantExtractorService
    TypeOrmModule.forFeature([UserEntity, CompanyEntity]),
  ],
  providers: [
    TransactionService,
    SchemaContext, // Contexto para multi-tenant
    TenantExtractorService, // ✅ NUEVO: Extracción de tenant
  ],
  exports: [
    TransactionService,
    SchemaContext, // Disponible en toda la app
    TenantExtractorService, // ✅ NUEVO: Disponible en toda la app
  ],
})
export class DatabaseModule {}
