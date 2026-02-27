// src/shared/database/transaction.service.ts
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { LoggerService, LogContext } from '@modules/logger';

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

  constructor(
    private readonly dataSource: DataSource,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

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
    await queryRunner.startTransaction();

    // Configurar nivel de aislamiento DENTRO de la transacción activa
    // PostgreSQL requiere SET TRANSACTION dentro de un bloque transaccional
    if (options?.isolationLevel) {
      await queryRunner.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
    }

    // Configurar timeout a nivel PostgreSQL (SET LOCAL se limita a la transacción actual)
    if (options?.timeout && options.timeout > 0) {
      await queryRunner.query(`SET LOCAL statement_timeout = ${Math.floor(options.timeout)}`);
    }

    this.logger.debug(`[${context}] Transaction started`);

    try {
      // Ejecutar callback con timeout de aplicación si se especificó
      let result: T;
      if (options?.timeout && options.timeout > 0) {
        result = await this.withTimeout(callback(queryRunner.manager), options.timeout, context);
      } else {
        result = await callback(queryRunner.manager);
      }

      await queryRunner.commitTransaction();

      this.logger.debug(`[${context}] Transaction committed successfully`);

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logError(
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

        // Solo reintentar errores transitorios de PostgreSQL
        if (!this.isTransientError(error)) {
          this.logError(`[${context}] Non-transient error, not retrying: ${lastError.message}`);
          throw lastError;
        }

        // Si es el último intento, no esperar
        if (attempt < maxRetries) {
          // Espera exponencial con jitter: base * 2^(attempt-1) + random(0..base)
          const base = 100;
          const delay = Math.pow(2, attempt - 1) * base + Math.floor(Math.random() * base);
          this.logWarn(
            `[${context}] Transient error on attempt ${attempt}, retrying in ${delay}ms: ${lastError.message}`,
          );
          await this.sleep(delay);
        }
      }
    }

    this.logError(`[${context}] All ${maxRetries} attempts failed`, lastError.stack);
    throw lastError;
  }

  /**
   * Determina si un error de PostgreSQL es transitorio y merece reintento.
   *
   * SQLSTATE codes considerados transitorios:
   * - 40P01: deadlock_detected
   * - 40001: serialization_failure
   * - 08006: connection_failure
   * - 08001: sqlclient_unable_to_establish_sqlconnection
   * - 57P01: admin_shutdown (PostgreSQL reiniciándose)
   *
   * @param error - Error capturado
   * @returns true si el error es transitorio
   */
  private isTransientError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const pgError = error as { code?: string };
    const transientCodes = new Set([
      '40P01', // deadlock_detected
      '40001', // serialization_failure
      '08006', // connection_failure
      '08001', // sqlclient_unable_to_establish_sqlconnection
      '57P01', // admin_shutdown
    ]);

    return typeof pgError.code === 'string' && transientCodes.has(pgError.code);
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

  /**
   * Ejecuta una promesa con timeout de aplicación.
   * Doble protección junto con SET LOCAL statement_timeout de PostgreSQL.
   *
   * @param promise - Promesa a ejecutar
   * @param timeoutMs - Timeout en milisegundos
   * @param context - Contexto para logging
   * @returns Resultado de la promesa
   * @throws TransactionTimeoutError si se excede el timeout
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, context: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new TransactionTimeoutError(`[${context}] Transaction timed out after ${timeoutMs}ms`),
        );
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.DATABASE,
      service: TransactionService.name,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.DATABASE,
      service: TransactionService.name,
      stack,
      metadata: details ? { details: String(details) } : undefined,
    });
  }
}

/**
 * Error lanzado cuando una transacción excede su timeout configurado
 */
export class TransactionTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionTimeoutError';
  }
}
