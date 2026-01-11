// src/modules/health/indicators/redis.indicator.ts

/**
 * @fileoverview Health indicator para Redis
 * @module modules/health/indicators
 */

import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '@shared/redis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly redisService: RedisService) {
    super();
  }

  /**
   * Verifica la conexión a Redis
   * @param key - Clave para el resultado
   * @returns Resultado del health check
   */
  async isHealthy(key: string = 'redis'): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Verificar conexión con PING
      const pong = await this.redisService.ping();

      if (pong !== 'PONG') {
        throw new Error('Invalid PING response');
      }

      const responseTime = Date.now() - startTime;

      // Obtener información básica
      const isReady = this.redisService.isReady();

      const redisInfo = {
        status: 'up',
        responseTime: `${responseTime}ms`,
        isReady,
      };

      this.logger.debug(`Redis health check passed (${responseTime}ms)`);

      return this.getStatus(key, true, redisInfo);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Redis health check failed: ${errorMessage}`);

      const result = this.getStatus(key, false, {
        status: 'down',
        responseTime: `${responseTime}ms`,
        error: errorMessage,
      });

      throw new HealthCheckError('Redis health check failed', result);
    }
  }

  /**
   * Verifica la conexión con timeout personalizado
   * @param key - Clave para el resultado
   * @param timeout - Timeout en ms
   * @returns Resultado del health check
   */
  async isHealthyWithTimeout(
    key: string = 'redis',
    timeout: number = 3000,
  ): Promise<HealthIndicatorResult> {
    return Promise.race([
      this.isHealthy(key),
      new Promise<HealthIndicatorResult>((_, reject) => {
        setTimeout(() => {
          reject(
            new HealthCheckError(
              'Redis health check timeout',
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
   * Obtiene métricas detalladas de Redis
   * @returns Métricas de Redis
   */
  async getMetrics(): Promise<Record<string, unknown>> {
    try {
      const info = await this.redisService.info();
      const dbSize = await this.redisService.dbSize();

      // Parsear información relevante
      const infoLines = info.split('\r\n');
      const metrics: Record<string, string | number> = {};

      const relevantKeys = [
        'redis_version',
        'uptime_in_seconds',
        'connected_clients',
        'used_memory_human',
        'used_memory_peak_human',
        'total_connections_received',
        'total_commands_processed',
        'instantaneous_ops_per_sec',
        'keyspace_hits',
        'keyspace_misses',
        'expired_keys',
        'evicted_keys',
      ];

      for (const line of infoLines) {
        const [key, value] = line.split(':');
        if (key && relevantKeys.includes(key)) {
          metrics[key] = value;
        }
      }

      // Calcular hit ratio
      const hits = parseInt(String(metrics['keyspace_hits'] || '0'), 10);
      const misses = parseInt(String(metrics['keyspace_misses'] || '0'), 10);
      const hitRatio = hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(2) : '0';

      return {
        version: metrics['redis_version'],
        uptime: `${Math.floor(parseInt(String(metrics['uptime_in_seconds'] || '0'), 10) / 3600)}h`,
        connectedClients: parseInt(String(metrics['connected_clients'] || '0'), 10),
        usedMemory: metrics['used_memory_human'],
        peakMemory: metrics['used_memory_peak_human'],
        totalConnections: parseInt(String(metrics['total_connections_received'] || '0'), 10),
        totalCommands: parseInt(String(metrics['total_commands_processed'] || '0'), 10),
        opsPerSecond: parseInt(String(metrics['instantaneous_ops_per_sec'] || '0'), 10),
        cacheHitRatio: `${hitRatio}%`,
        expiredKeys: parseInt(String(metrics['expired_keys'] || '0'), 10),
        evictedKeys: parseInt(String(metrics['evicted_keys'] || '0'), 10),
        dbSize,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get Redis metrics: ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  /**
   * Verifica latencia de Redis
   * @param samples - Número de muestras para promediar
   * @returns Latencia promedio en ms
   */
  async getLatency(samples: number = 5): Promise<number> {
    const latencies: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = Date.now();
      await this.redisService.ping();
      latencies.push(Date.now() - start);
    }

    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    return Math.round(avgLatency * 100) / 100;
  }

  /**
   * Verifica memoria de Redis
   * @returns Estado de memoria
   */
  async getMemoryStatus(): Promise<Record<string, unknown>> {
    try {
      const info = await this.redisService.info('memory');
      const lines = info.split('\r\n');
      const memory: Record<string, string> = {};

      for (const line of lines) {
        const [key, value] = line.split(':');
        if (key && value) {
          memory[key] = value;
        }
      }

      return {
        used: memory['used_memory_human'],
        peak: memory['used_memory_peak_human'],
        rss: memory['used_memory_rss_human'],
        fragmentation: memory['mem_fragmentation_ratio'],
        allocator: memory['mem_allocator'],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get Redis memory status: ${errorMessage}`);
      return { error: errorMessage };
    }
  }
}
