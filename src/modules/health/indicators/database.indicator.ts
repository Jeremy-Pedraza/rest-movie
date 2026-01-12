// src/modules/health/indicators/database.indicator.ts

/**
 * @fileoverview Health indicator para PostgreSQL
 * @module modules/health/indicators
 */

import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

/**
 * Resultado de pg_stat_database
 */
interface DatabaseStats {
  active_connections: string;
  transactions_committed: string;
  transactions_rolledback: string;
  blocks_read: string;
  blocks_hit: string;
  rows_returned: string;
  rows_fetched: string;
  rows_inserted: string;
  rows_updated: string;
  rows_deleted: string;
}

/**
 * Resultado de pg_stat_activity para conexiones
 */
interface ConnectionInfo {
  total_connections: string;
  active: string;
  idle: string;
  idle_in_transaction: string;
}

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
      const result = await this.dataSource.query<DatabaseStats[]>(`
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

      const stats = result[0];
      if (!stats) {
        return { error: 'No database stats available' };
      }

      // Calcular hit ratio
      const blocksHit = parseInt(stats.blocks_hit, 10);
      const blocksRead = parseInt(stats.blocks_read, 10);
      const hitRatio =
        blocksHit > 0 ? ((blocksHit / (blocksHit + blocksRead)) * 100).toFixed(2) : '0';

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

      const result = await this.dataSource.query<ConnectionInfo[]>(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active,
          count(*) FILTER (WHERE state = 'idle') as idle,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      const connectionInfo = result[0];
      if (!connectionInfo) {
        return { error: 'No connection info available', configured: poolSize };
      }

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
