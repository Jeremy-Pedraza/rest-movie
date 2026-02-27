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
import { LoggerService, LogContext } from '@modules/logger';
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
    protected readonly loggerService?: LoggerService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  // ============================================
  // SCHEMA VALIDATION
  // ============================================

  /** Regex canónica para schemas válidos: letras, números, underscores */
  private static readonly VALID_SCHEMA_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

  /**
   * Valida y quotea un identificador de schema para uso seguro en SQL.
   * Previene SQL injection en SET search_path.
   *
   * @param schema - Nombre del schema a validar
   * @returns Schema quoted con comillas dobles PostgreSQL
   * @throws Error si el schema contiene caracteres inválidos
   */
  protected static safeSchemaIdentifier(schema: string): string {
    if (!BaseRepository.VALID_SCHEMA_REGEX.test(schema)) {
      throw new Error(
        `Invalid schema name: "${schema}". Only alphanumeric and underscores allowed.`,
      );
    }
    // PostgreSQL double-quote identifier escaping
    return `"${schema}"`;
  }

  // ============================================
  // MÉTODOS PRINCIPALES
  // ============================================

  /**
   * Ejecuta callback con SET search_path dinámico
   *
   * MULTI-TENANT: Método principal para queries con schema dinámico
   *
   * Establece search_path en un QueryRunner y pasa el manager de ese QueryRunner
   * al callback para que todas las queries usen el mismo search_path.
   *
   * Características:
   * - Obtiene schema desde SchemaContext (TenantInterceptor)
   * - Crea QueryRunner dedicado
   * - Establece search_path (tenant, public)
   * - Pasa manager al callback
   * - Restaura search_path y libera QueryRunner
   * - Thread-safe (cada request tiene su QueryRunner)
   *
   * @param callback - Función async que recibe EntityManager con search_path
   * @returns Resultado del callback
   *
   * @example
   * ```typescript
   * async findById(id: string): Promise<Product | null> {
   *   return await this.withSchema(async (manager) => {
   *     return await manager
   *       .getRepository(ProductEntity)
   *       .createQueryBuilder('product')
   *       .where('product.id = :id', { id })
   *       .getOne();
   *   });
   * }
   * ```
   */
  protected async withSchema<R>(callback: (manager: EntityManager) => Promise<R>): Promise<R> {
    const schema = this.schemaContext.getSchema();
    const connection = this.repository.manager.connection;
    const queryRunner = connection.createQueryRunner();

    try {
      // Conectar el QueryRunner
      await queryRunner.connect();

      // Establecer search_path con identificador validado y seguro
      const safeSchema = BaseRepository.safeSchemaIdentifier(schema);
      await queryRunner.query(`SET search_path TO ${safeSchema}, "public"`);

      this.logger.debug(`search_path establecido: ${safeSchema}`);

      // Ejecutar callback pasando el manager del QueryRunner
      // ✅ CRÍTICO: El manager del QueryRunner tiene el search_path aplicado
      const result = await callback(queryRunner.manager);

      return result;
    } catch (error) {
      this.logError(`Error ejecutando query con schema ${schema}:`, error);
      throw error;
    } finally {
      // Restaurar search_path a public
      try {
        await queryRunner.query(`SET search_path TO public`);
      } catch (err) {
        this.logWarn('No se pudo restaurar search_path a public:', err);
      }

      // Liberar QueryRunner
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
      // Establecer search_path con identificador validado y seguro
      const safeSchema = BaseRepository.safeSchemaIdentifier(schema);
      await queryRunner.query(`SET search_path TO ${safeSchema}, "public"`);

      this.logger.debug(`Transacción iniciada con search_path: ${safeSchema}`);

      // Ejecutar callback con el manager de la transacción
      const result = await callback(queryRunner.manager);

      // Commit
      await queryRunner.commitTransaction();

      this.logger.debug(`Transacción completada exitosamente`);

      return result;
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      this.logError(`Error en transacción con schema ${schema}:`, error);
      throw error;
    } finally {
      // Restaurar search_path y liberar conexión
      try {
        await queryRunner.query(`SET search_path TO public`);
      } catch (err) {
        this.logWarn('No se pudo restaurar search_path a public:', err);
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
   * @deprecated Usar manager.getRepository(Entity).createQueryBuilder() dentro de withSchema() en su lugar.
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
   * return await this.withSchema(async (manager) => {
   *   return await manager
   *     .getRepository(Entity)
   *     .createQueryBuilder('alias')
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
  protected async createTenantQueryBuilder(_alias: string): Promise<SelectQueryBuilder<T>> {
    throw new Error(
      'createTenantQueryBuilder() ha sido eliminado por ser inseguro (no thread-safe). ' +
        'Usar manager.getRepository(Entity).createQueryBuilder() dentro de withSchema() en su lugar. ' +
        'Ver docs/BASE-REPOSITORY.md para guía de migración.',
    );
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
   * @deprecated Usar withSchema() en su lugar. Este método NO es thread-safe en alta concurrencia.
   *
   * @returns EntityManager con search_path configurado
   */
  protected async getSchemaManager(): Promise<EntityManager> {
    throw new Error(
      'getSchemaManager() ha sido eliminado por ser inseguro (no thread-safe). ' +
        'Usar withSchema() en su lugar. Ver docs/BASE-REPOSITORY.md para guía de migración.',
    );
  }

  protected logWarn(message: string, details?: unknown): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.DATABASE,
      service: this.constructor.name,
      metadata: details ? { details: String(details) } : undefined,
    });
  }

  protected logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.DATABASE,
      service: this.constructor.name,
      stack,
      metadata: details ? { details: String(details) } : undefined,
    });
  }
}
