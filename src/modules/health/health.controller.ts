// src/modules/health/health.controller.ts

import { Controller, Get, Logger, Inject, Optional } from '@nestjs/common';
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
import { LoggerService, LogContext } from '@modules/logger';
import { DatabaseHealthIndicator } from './indicators/database.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Health check basico - Liveness probe
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check basico (liveness)' })
  @ApiResponse({ status: 200, description: 'Aplicacion corriendo' })
  liveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check completo - Readiness probe
   */
  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check (todos los servicios)' })
  @ApiResponse({ status: 200, description: 'Todos los servicios estan listos' })
  @ApiResponse({ status: 503, description: 'Algun servicio no esta disponible' })
  async readiness(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () => this.database.isHealthy('database'),
        () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
        () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      ]);
    } catch (error) {
      this.logError('Readiness check failed', error);
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
      this.logError('Database health check failed', error);
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
  @ApiResponse({ status: 200, description: 'Memoria dentro de limites' })
  @ApiResponse({ status: 503, description: 'Memoria excede limites' })
  async checkMemory(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
        () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
      ]);
    } catch (error) {
      this.logError('Memory health check failed', error);
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
  @ApiResponse({ status: 200, description: 'Disco dentro de limites' })
  @ApiResponse({ status: 503, description: 'Disco excede limites' })
  async checkDisk(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () =>
          this.disk.checkStorage('disk', {
            path: '/',
            thresholdPercent: 0.9,
          }),
      ]);
    } catch (error) {
      this.logError('Disk health check failed', error);
      throw error;
    }
  }

  /**
   * Metricas detalladas de la base de datos
   */
  @Public()
  @Get('metrics/database')
  @ApiOperation({ summary: 'Metricas de PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Metricas de la base de datos' })
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
      this.logError('Failed to get database metrics', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Metricas de memoria del proceso
   */
  @Public()
  @Get('metrics/memory')
  @ApiOperation({ summary: 'Metricas de memoria del proceso' })
  @ApiResponse({ status: 200, description: 'Metricas de memoria' })
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
   * Informacion del sistema
   */
  @Public()
  @Get('info')
  @ApiOperation({ summary: 'Informacion del sistema' })
  @ApiResponse({ status: 200, description: 'Informacion del sistema' })
  systemInfo(): Record<string, unknown> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: {
        name: process.env.APP_NAME || 'Rest-backend',
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

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.SYSTEM,
      service: HealthController.name,
      stack,
      metadata: details ? { details: String(details) } : undefined,
    });
  }
}
