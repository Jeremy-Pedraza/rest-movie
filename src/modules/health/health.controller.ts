// src/modules/health/health.controller.ts

/**
 * @fileoverview Controller para health checks
 * @module modules/health
 */

import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import * as os from 'os';

import { Public } from '@decorators/public.decorator';
import { SkipTenant } from '@decorators/skip-tenant.decorator';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';

@ApiTags('Health')
@Controller('health')
@SkipTenant() // Health checks no requieren contexto de tenant
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  // ============================================
  // HEALTH CHECK ENDPOINTS
  // ============================================

  /**
   * Health check básico - Liveness probe
   * Verifica que la aplicación está corriendo
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check básico (liveness)' })
  @ApiResponse({ status: 200, description: 'Aplicación corriendo' })
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check completo - Readiness probe
   * Verifica que todos los servicios están listos
   */
  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check (todos los servicios)' })
  @ApiResponse({ status: 200, description: 'Todos los servicios están listos' })
  @ApiResponse({ status: 503, description: 'Algún servicio no está disponible' })
  async readiness(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () => this.database.isHealthy('database'),
        () => this.redis.isHealthy('redis'),
        () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
        () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024), // 500MB
      ]);
    } catch (error) {
      this.logger.error('Readiness check failed', error);
      throw error;
    }
  }

  /**
   * Health check de base de datos
   */
  @Public()
  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Base de datos disponible' })
  @ApiResponse({ status: 503, description: 'Base de datos no disponible' })
  async checkDatabase(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([() => this.database.isHealthy('database')]);
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw error;
    }
  }

  /**
   * Health check de Redis
   */
  @Public()
  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de Redis' })
  @ApiResponse({ status: 200, description: 'Redis disponible' })
  @ApiResponse({ status: 503, description: 'Redis no disponible' })
  async checkRedis(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([() => this.redis.isHealthy('redis')]);
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      throw error;
    }
  }

  /**
   * Health check de memoria
   */
  @Public()
  @Get('memory')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de memoria' })
  @ApiResponse({ status: 200, description: 'Memoria dentro de límites' })
  @ApiResponse({ status: 503, description: 'Memoria excede límites' })
  async checkMemory(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
        () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      ]);
    } catch (error) {
      this.logger.error('Memory health check failed', error);
      throw error;
    }
  }

  /**
   * Health check de disco
   */
  @Public()
  @Get('disk')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de disco' })
  @ApiResponse({ status: 200, description: 'Disco dentro de límites' })
  @ApiResponse({ status: 503, description: 'Disco excede límites' })
  async checkDisk(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () =>
          this.disk.checkStorage('disk', {
            path: '/',
            thresholdPercent: 0.9, // 90%
          }),
      ]);
    } catch (error) {
      this.logger.error('Disk health check failed', error);
      throw error;
    }
  }

  // ============================================
  // METRICS ENDPOINTS
  // ============================================

  /**
   * Métricas detalladas de la base de datos
   */
  @Public()
  @Get('metrics/database')
  @ApiOperation({ summary: 'Métricas de PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Métricas de la base de datos' })
  async databaseMetrics(): Promise<Record<string, unknown>> {
    try {
      const [metrics, poolStatus] = await Promise.all([
        this.database.getMetrics(),
        this.database.getPoolStatus(),
      ]);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        metrics,
        pool: poolStatus,
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Métricas detalladas de Redis
   */
  @Public()
  @Get('metrics/redis')
  @ApiOperation({ summary: 'Métricas de Redis' })
  @ApiResponse({ status: 200, description: 'Métricas de Redis' })
  async redisMetrics(): Promise<Record<string, unknown>> {
    try {
      const [metrics, latency, memory] = await Promise.all([
        this.redis.getMetrics(),
        this.redis.getLatency(),
        this.redis.getMemoryStatus(),
      ]);

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        metrics,
        latency: `${latency}ms`,
        memory,
      };
    } catch (error) {
      this.logger.error('Failed to get Redis metrics', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Métricas de memoria del proceso
   */
  @Public()
  @Get('metrics/memory')
  @ApiOperation({ summary: 'Métricas de memoria del proceso' })
  @ApiResponse({ status: 200, description: 'Métricas de memoria' })
  memoryMetrics(): Record<string, unknown> {
    const memUsage = process.memoryUsage();

    const formatBytes = (bytes: number): string => {
      const mb = bytes / 1024 / 1024;
      return `${mb.toFixed(2)} MB`;
    };

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: formatBytes(memUsage.heapUsed),
        heapTotal: formatBytes(memUsage.heapTotal),
        external: formatBytes(memUsage.external),
        rss: formatBytes(memUsage.rss),
        arrayBuffers: formatBytes(memUsage.arrayBuffers),
      },
      raw: memUsage,
    };
  }

  /**
   * Información del sistema
   */
  @Public()
  @Get('info')
  @ApiOperation({ summary: 'Información del sistema' })
  @ApiResponse({ status: 200, description: 'Información del sistema' })
  systemInfo(): Record<string, unknown> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: {
        name: process.env.APP_NAME || 'mokka-backend',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      uptime: {
        process: `${Math.floor(process.uptime())}s`,
        system: `${Math.floor(os.uptime())}s`,
      },
      pid: process.pid,
    };
  }
}
