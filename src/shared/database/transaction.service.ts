// src/shared/database/transaction.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';

/**
 * Tipo para funciones que se ejecutan dentro de una transacción
 */
export type TransactionCallback<T> = (manager: EntityManager) => Promise<T>;

/**
 * Opciones para la transacción
 */
export interface ITransactionOptions {
  /**
   * Nivel de aislamiento de la transacción
   * @default 'READ COMMITTED'
   */
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';

  /**
   * Tiempo máximo de espera para la transacción (ms)
   */
  timeout?: number;

  /**
   * Contexto para logging
   */
  context?: string;
}

/**
 * TransactionService - Servicio para manejo de transacciones de base de datos
 *
 * Proporciona métodos para ejecutar operaciones en transacciones
 * con manejo automático de commit/rollback.
 *
 * @example
 * ```typescript
 * // Uso básico
 * const result = await this.transactionService.execute(async (manager) => {
 *   const user = manager.create(User, { name: 'John' });
 *   await manager.save(user);
 *
 *   const profile = manager.create(Profile, { userId: user.id });
 *   await manager.save(profile);
 *
 *   return user;
 * });
 *
 * // Con opciones
 * const result = await this.transactionService.execute(
 *   async (manager) => {
 *     // operaciones...
 *   },
 *   { isolationLevel: 'SERIALIZABLE', context: 'CreateOrder' }
 * );
 * ```
 */
@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Ejecuta una función dentro de una transacción
   *
   * Si la función se ejecuta exitosamente, se hace commit.
   * Si ocurre un error, se hace rollback automáticamente.
   *
   * @param callback - Función a ejecutar dentro de la transacción
   * @param options - Opciones de la transacción
   * @returns Resultado de la función callback
   * @throws El error original si la transacción falla
   */
  async execute<T>(callback: TransactionCallback<T>, options?: ITransactionOptions): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    const context = options?.context || 'Transaction';

    await queryRunner.connect();

    // Configurar nivel de aislamiento si se especifica
    if (options?.isolationLevel) {
      await queryRunner.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
    }

    await queryRunner.startTransaction();

    this.logger.debug(`[${context}] Transaction started`);

    try {
      const result = await callback(queryRunner.manager);

      await queryRunner.commitTransaction();

      this.logger.debug(`[${context}] Transaction committed successfully`);

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[${context}] Transaction rolled back: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ejecuta múltiples operaciones en una transacción con reintentos
   *
   * Útil para operaciones que pueden fallar por conflictos de concurrencia.
   *
   * @param callback - Función a ejecutar
   * @param maxRetries - Número máximo de reintentos (default: 3)
   * @param options - Opciones de la transacción
   * @returns Resultado de la función callback
   */
  async executeWithRetry<T>(
    callback: TransactionCallback<T>,
    maxRetries: number = 3,
    options?: ITransactionOptions,
  ): Promise<T> {
    const context = options?.context || 'TransactionWithRetry';
    let lastError: Error = new Error('Transaction failed');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`[${context}] Attempt ${attempt}/${maxRetries}`);

        return await this.execute(callback, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Si es el último intento, no esperar
        if (attempt < maxRetries) {
          // Espera exponencial: 100ms, 200ms, 400ms...
          const delay = Math.pow(2, attempt - 1) * 100;
          this.logger.warn(
            `[${context}] Attempt ${attempt} failed, retrying in ${delay}ms: ${lastError.message}`,
          );
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(`[${context}] All ${maxRetries} attempts failed`, lastError.stack);
    throw lastError;
  }

  /**
   * Crea un QueryRunner para manejo manual de transacciones
   *
   * Útil cuando necesitas más control sobre la transacción.
   * IMPORTANTE: Debes liberar el QueryRunner manualmente.
   *
   * @example
   * ```typescript
   * const queryRunner = await this.transactionService.createQueryRunner();
   * try {
   *   await queryRunner.startTransaction();
   *   // operaciones...
   *   await queryRunner.commitTransaction();
   * } catch (error) {
   *   await queryRunner.rollbackTransaction();
   *   throw error;
   * } finally {
   *   await queryRunner.release();
   * }
   * ```
   */
  async createQueryRunner(): Promise<QueryRunner> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    return queryRunner;
  }

  /**
   * Ejecuta una función usando el método transaction() de TypeORM
   *
   * Alternativa más simple que usa el wrapper interno de TypeORM.
   *
   * @param callback - Función a ejecutar
   * @returns Resultado de la función callback
   */
  async run<T>(callback: TransactionCallback<T>): Promise<T> {
    return await this.dataSource.transaction(callback);
  }

  /**
   * Verifica si la conexión a la base de datos está activa
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el EntityManager del DataSource
   */
  getManager(): EntityManager {
    return this.dataSource.manager;
  }

  /**
   * Helper para esperar un tiempo determinado
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
