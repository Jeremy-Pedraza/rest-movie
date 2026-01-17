// src/shared/database/base.repository.ts

/**
 * @fileoverview Base repository para queries multi-tenant
 * @module shared/database
 * @version 2.0.0 - createTenantQueryBuilder() deprecated
 *
 * Proporciona métodos para ejecutar queries con SET search_path dinámico
 * según el tenant actual establecido en SchemaContext.
 * 
 * IMPORTANTE: Usar withSchema() + this.repository.createQueryBuilder()
 * en lugar de createTenantQueryBuilder() (deprecated).
 * 
 * @see docs/BASE-REPOSITORY.md para documentación completa
 */

import { Repository, SelectQueryBuilder, EntityManager, ObjectLiteral } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SchemaContext } from './schema.context';

/**
 * BaseRepository - Repositorio base para multi-tenant
 *
 * Características:
 * - SET search_path automático basado en SchemaContext
 * - Queries aisladas por schema (tenant)
 * - Soporte para transacciones
 * - Métodos helper para queries tenant-aware
 * - Compatible con entidades en schema public y tenant schemas
 *
 * Uso:
 * - Extend BaseRepository en tus repositories
 * - Usa withSchema() para queries en schema tenant
 * - Usa métodos estándar de TypeORM para queries en schema public
 *
 * @example
 * ```typescript
 * // Entidad tenant (sin schema explícito)
 * @Entity({ name: 'products' })
 * export class ProductEntity extends BaseEntity {}
 *
 * // Repository
 * @Injectable()
 * export class ProductsRepository extends BaseRepository<ProductEntity> {
 *   constructor(
 *     @InjectRepository(ProductEntity) repository: Repository<ProductEntity>,
 *     schemaContext: SchemaContext,
 *   ) {
 *     super(repository, schemaContext);
 *   }
 *
 *   async findAll(): Promise<ProductEntity[]> {
 *     return await this.withSchema(async () => {
 *       return await this.repository.find({ where: { isActive: true } });
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseRepository<T extends ObjectLiteral> {
  protected readonly logger: Logger;

  /**
   * Constructor
   *
   * @param repository - Repository de TypeORM para la entidad
   * @param schemaContext - Contexto de schema (inyectado automáticamente)
   */
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly schemaContext: SchemaContext,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  // ============================================
  // MÉTODOS PRINCIPALES
  // ============================================

  /**
   * Ejecuta callback con SET search_path dinámico
   *
   * Este es el método principal para queries multi-tenant.
   * Establece el search_path al schema del tenant actual y ejecuta el callback.
   *
   * Características:
   * - Obtiene schema desde SchemaContext (establecido por TenantInterceptor)
   * - Establece search_path con fallback a 'public'
   * - Restaura search_path después de ejecutar
   * - Thread-safe (cada request tiene su propio QueryRunner)
   *
   * @param callback - Función async que ejecuta las queries
   * @returns Resultado del callback
   *
   * @example
   * ```typescript
   * async findById(id: string): Promise<Product | null> {
   *   return await this.withSchema(async () => {
   *     return await this.repository.findOne({ where: { id } });
   *   });
   * }
   * ```
   */
  protected async withSchema<R>(callback: () => Promise<R>): Promise<R> {
    const schema = this.schemaContext.getSchema();
    const manager = this.repository.manager;
    const queryRunner = manager.connection.createQueryRunner();

    try {
      // Establecer search_path (primero tenant, luego public como fallback)
      const searchPath = schema === 'public' ? 'public' : `${schema}, public`;
      await queryRunner.query(`SET search_path TO ${searchPath}`);

      this.logger.debug(`search_path establecido: ${searchPath}`);

      // Ejecutar callback
      const result = await callback();

      return result;
    } catch (error) {
      this.logger.error(`Error ejecutando query con schema ${schema}:`, error);
      throw error;
    } finally {
      // Restaurar search_path a public
      try {
        await queryRunner.query(`SET search_path TO public`);
      } catch (err) {
        this.logger.warn('No se pudo restaurar search_path a public:', err);
      }
      await queryRunner.release();
    }
  }

  /**
   * Ejecuta transacción con SET search_path dinámico
   *
   * Similar a withSchema() pero dentro de una transacción.
   * Útil para operaciones que requieren atomicidad.
   *
   * @param callback - Función async que ejecuta las queries en transacción
   * @returns Resultado del callback
   *
   * @example
   * ```typescript
   * async createOrder(dto: CreateOrderDto): Promise<Order> {
   *   return await this.withSchemaTransaction(async (manager) => {
   *     const order = await manager.save(Order, { ... });
   *     await manager.save(OrderItem, items);
   *     return order;
   *   });
   * }
   * ```
   */
  protected async withSchemaTransaction<R>(
    callback: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    const schema = this.schemaContext.getSchema();
    const connection = this.repository.manager.connection;
    const queryRunner = connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Establecer search_path
      const searchPath = schema === 'public' ? 'public' : `${schema}, public`;
      await queryRunner.query(`SET search_path TO ${searchPath}`);

      this.logger.debug(`Transacción iniciada con search_path: ${searchPath}`);

      // Ejecutar callback con el manager de la transacción
      const result = await callback(queryRunner.manager);

      // Commit
      await queryRunner.commitTransaction();

      this.logger.debug(`Transacción completada exitosamente`);

      return result;
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error en transacción con schema ${schema}:`, error);
      throw error;
    } finally {
      // Restaurar search_path y liberar conexión
      try {
        await queryRunner.query(`SET search_path TO public`);
      } catch (err) {
        this.logger.warn('No se pudo restaurar search_path a public:', err);
      }
      await queryRunner.release();
    }
  }

  // ============================================
  // QUERY BUILDERS
  // ============================================

  /**
   * Query builder estático (para entidades en schema public)
   *
   * Usa este método para queries en tablas del schema public
   * como users, roles, companies, etc.
   *
   * @param alias - Alias de la tabla
   * @returns QueryBuilder
   *
   * @example
   * ```typescript
   * // En UserRepository (entidad en schema public)
   * async findByEmail(email: string): Promise<User | null> {
   *   return await this.createStaticQueryBuilder('user')
   *     .where('user.email = :email', { email })
   *     .getOne();
   * }
   * ```
   */
  protected createStaticQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * Query builder con search_path dinámico (para entidades tenant)
   *
   * @deprecated Usar this.repository.createQueryBuilder() dentro de withSchema() en su lugar.
   * 
   * Este método usa manager.query() que NO es thread-safe en alta concurrencia.
   * Es redundante con withSchema() que ya establece search_path de forma aislada.
   * 
   * Migración:
   * ```typescript
   * // ❌ ANTES (deprecated)
   * const qb = await this.createTenantQueryBuilder('alias');
   * return await qb.where(...).getOne();
   * 
   * // ✅ DESPUÉS (correcto)
   * return await this.withSchema(async () => {
   *   return await this.repository.createQueryBuilder('alias')
   *     .where(...)
   *     .getOne();
   * });
   * ```
   * 
   * @see docs/BASE-REPOSITORY.md para documentación completa
   *
   * @param alias - Alias de la tabla
   * @returns Promise<QueryBuilder>
   */
  protected async createTenantQueryBuilder(alias: string): Promise<SelectQueryBuilder<T>> {
    const schema = this.schemaContext.getSchema();
    const manager = this.repository.manager;

    // SET search_path antes de crear query builder
    const searchPath = schema === 'public' ? 'public' : `${schema}, public`;
    await manager.query(`SET search_path TO ${searchPath}`);

    return this.repository.createQueryBuilder(alias);
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtiene el schema actual del contexto
   *
   * @returns Schema actual ('public' si no hay contexto)
   */
  protected getCurrentSchema(): string {
    return this.schemaContext.getSchema();
  }

  /**
   * Verifica si estamos en schema public
   *
   * @returns true si el schema actual es 'public'
   */
  protected isPublicSchema(): boolean {
    return this.schemaContext.isPublicSchema();
  }

  /**
   * Obtiene información del contexto para logging
   *
   * @returns String con información del contexto
   */
  protected getContextInfo(): string {
    return this.schemaContext.getContextInfo();
  }

  /**
   * Obtiene entity manager con search_path establecido
   *
   * Útil para operaciones manuales con el manager
   *
   * @returns EntityManager con search_path configurado
   */
  protected async getSchemaManager(): Promise<EntityManager> {
    const schema = this.schemaContext.getSchema();
    const manager = this.repository.manager;

    const searchPath = schema === 'public' ? 'public' : `${schema}, public`;
    await manager.query(`SET search_path TO ${searchPath}`);

    return manager;
  }
}
