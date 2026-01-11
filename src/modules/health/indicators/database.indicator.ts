// src/modules/health/indicators/database.indicator.ts

/**
 * @fileoverview Health indicator para PostgreSQL
 * @module modules/health/indicators
 */

import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  /**
   * Verifica la conexión a la base de datos
   * @param key - Clave para el resultado
   * @returns Resultado del health check
   */
  async isHealthy(key: string = 'database'): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Verificar si el DataSource está inicializado
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource not initialized');
      }

      // Ejecutar query simple para verificar conexión
      await this.dataSource.query('SELECT 1');

      const responseTime = Date.now() - startTime;

      // Obtener información adicional
      const databaseInfo = {
        status: 'up',
        responseTime: `${responseTime}ms`,
        database: this.dataSource.options.database,
        type: this.dataSource.options.type,
        isConnected: this.dataSource.isInitialized,
      };

      this.logger.debug(`Database health check passed (${responseTime}ms)`);

      return this.getStatus(key, true, databaseInfo);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Database health check failed: ${errorMessage}`);

      const result = this.getStatus(key, false, {
        status: 'down',
        responseTime: `${responseTime}ms`,
        error: errorMessage,
      });

      throw new HealthCheckError('Database health check failed', result);
    }
  }

  /**
   * Verifica la conexión con timeout personalizado
   * @param key - Clave para el resultado
   * @param timeout - Timeout en ms
   * @returns Resultado del health check
   */
  async isHealthyWithTimeout(
    key: string = 'database',
    timeout: number = 5000,
  ): Promise<HealthIndicatorResult> {
    return Promise.race([
      this.isHealthy(key),
      new Promise<HealthIndicatorResult>((_, reject) => {
        setTimeout(() => {
          reject(
            new HealthCheckError(
              'Database health check timeout',
              this.getStatus(key, false, {
                status: 'down',
                error: `Timeout after ${timeout}ms`,
              }),
            ),
          );
        }, timeout);
      }),
    ]);
  }

  /**
   * Obtiene métricas detalladas de la base de datos
   * @returns Métricas de la base de datos
   */
  async getMetrics(): Promise<Record<string, unknown>> {
    try {
      if (!this.dataSource.isInitialized) {
        return { error: 'DataSource not initialized' };
      }

      // Query para obtener estadísticas de PostgreSQL
      const [stats] = await this.dataSource.query(`
        SELECT 
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolledback,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as rows_returned,
          tup_fetched as rows_fetched,
          tup_inserted as rows_inserted,
          tup_updated as rows_updated,
          tup_deleted as rows_deleted
        FROM pg_stat_database 
        WHERE datname = current_database()
      `);

      // Calcular hit ratio
      const hitRatio =
        stats.blocks_hit > 0
          ? ((stats.blocks_hit / (stats.blocks_hit + stats.blocks_read)) * 100).toFixed(2)
          : '0';

      return {
        activeConnections: parseInt(stats.active_connections, 10),
        transactionsCommitted: parseInt(stats.transactions_committed, 10),
        transactionsRolledback: parseInt(stats.transactions_rolledback, 10),
        cacheHitRatio: `${hitRatio}%`,
        rows: {
          returned: parseInt(stats.rows_returned, 10),
          fetched: parseInt(stats.rows_fetched, 10),
          inserted: parseInt(stats.rows_inserted, 10),
          updated: parseInt(stats.rows_updated, 10),
          deleted: parseInt(stats.rows_deleted, 10),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get database metrics: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  /**
   * Verifica el pool de conexiones
   * @returns Estado del pool
   */
  async getPoolStatus(): Promise<Record<string, unknown>> {
    try {
      if (!this.dataSource.isInitialized) {
        return { error: 'DataSource not initialized' };
      }

      // Obtener información del pool si está disponible
      const poolSize = (this.dataSource.options as { poolSize?: number }).poolSize || 'N/A';

      const [connectionInfo] = await this.dataSource.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return {
        configured: poolSize,
        total: parseInt(connectionInfo.total_connections, 10),
        active: parseInt(connectionInfo.active, 10),
        idle: parseInt(connectionInfo.idle, 10),
        idleInTransaction: parseInt(connectionInfo.idle_in_transaction, 10),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get pool status: ${errorMessage}`);
      return { error: errorMessage };
    }
  }
}
