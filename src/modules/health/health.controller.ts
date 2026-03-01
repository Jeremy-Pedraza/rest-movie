// src/modules/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import * as os from 'os';

import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { Public } from '@decorators/public.decorator';
import { IApiResponse } from '@shared/common';
import { DatabaseHealthIndicator } from './indicators/database.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  /**
   * Health check basico - Liveness probe
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check basico (liveness)' })
  @ApiResponse({ status: 200, description: 'Aplicacion corriendo' })
  liveness(): IApiResponse<{ status: string; timestamp: string }> {
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
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
  async readiness(): Promise<IApiResponse<HealthCheckResult>> {
    const data = await this.health.check([
      () => this.database.isHealthy('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);

    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
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
  async checkDatabase(): Promise<IApiResponse<HealthCheckResult>> {
    const data = await this.health.check([() => this.database.isHealthy('database')]);

    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
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
  async checkMemory(): Promise<IApiResponse<HealthCheckResult>> {
    const data = await this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),
    ]);

    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
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
  async checkDisk(): Promise<IApiResponse<HealthCheckResult>> {
    const data = await this.health.check([
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);

    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data,
    };
  }

  /**
   * Metricas detalladas de la base de datos
   */
  @Public()
  @Get('metrics/database')
  @ApiOperation({ summary: 'Metricas de PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Metricas de la base de datos' })
  async databaseMetrics(): Promise<
    IApiResponse<{
      status: string;
      timestamp: string;
      metrics: Record<string, unknown>;
      pool: Record<string, unknown>;
    }>
  > {
    const [metrics, pool] = await Promise.all([
      this.database.getMetrics(),
      this.database.getPoolStatus(),
    ]);

    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        metrics,
        pool,
      },
    };
  }

  /**
   * Metricas de memoria del proceso
   */
  @Public()
  @Get('metrics/memory')
  @ApiOperation({ summary: 'Metricas de memoria del proceso' })
  @ApiResponse({ status: 200, description: 'Metricas de memoria' })
  memoryMetrics(): IApiResponse<Record<string, unknown>> {
    const memUsage = process.memoryUsage();

    const formatBytes = (bytes: number): string => {
      const mb = bytes / 1024 / 1024;
      return `${mb.toFixed(2)} MB`;
    };

    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data: {
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
      },
    };
  }

  /**
   * Informacion del sistema
   */
  @Public()
  @Get('info')
  @ApiOperation({ summary: 'Informacion del sistema' })
  @ApiResponse({ status: 200, description: 'Informacion del sistema' })
  systemInfo(): IApiResponse<Record<string, unknown>> {
    return {
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.FETCHED,
      data: {
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
      },
    };
  }
}
