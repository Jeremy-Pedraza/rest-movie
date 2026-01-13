/**
 * @fileoverview Job de precalentamiento de cache
 * @module modules/tasks/jobs
 *
 * Precalienta el cache con datos frecuentemente accedidos.
 * Se ejecuta diariamente a las 6 AM por defecto.
 *
 * @requires CacheService - Para poblar cache
 * @requires UserRepository - Para datos de usuarios
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import { CacheService } from '@modules/cache';
import { UserRepository } from '@modules/user/user.repository';
import { AuthRepository } from '@modules/auth/auth.repository';
import {
  JOB_NAMES,
  DEFAULT_JOB_CONFIG,
  CRON_EXPRESSIONS,
  getEnvKey,
} from '../tasks.constants';
import { IJobExecutionResult } from '../interfaces';

interface WarmupResult {
  key: string;
  success: boolean;
  duration: number;
  error?: string;
}

@Injectable()
export class CacheWarmupJob {
  private readonly logger = new Logger(CacheWarmupJob.name);
  private readonly jobName = JOB_NAMES.CACHE_WARMUP;
  private isRunning = false;

  constructor(
    private readonly cacheService: CacheService,
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verifica si el job está habilitado
   */
  private isEnabled(): boolean {
    const envKey = getEnvKey(this.jobName, 'enabled');
    const envValue = this.configService.get<string>(envKey);

    if (envValue !== undefined) {
      return envValue === 'true';
    }

    return DEFAULT_JOB_CONFIG[this.jobName]?.enabled ?? true;
  }

  /**
   * Obtiene el TTL por defecto para cache warmup
   */
  private getDefaultTtl(): number {
    return this.configService.get<number>('TASKS_CACHE_WARMUP_TTL') ?? 3600; // 1 hora
  }

  /**
   * Ejecuta el precalentamiento de cache
   * Cron: diario a las 6 AM (configurable via TASKS_CACHE_WARMUP_CRON)
   */
  @Cron(CRON_EXPRESSIONS.DAILY_6AM, {
    name: JOB_NAMES.CACHE_WARMUP,
  })
  async handleCron(): Promise<IJobExecutionResult> {
    return await this.execute();
  }

  /**
   * Ejecuta el job manualmente o desde el cron
   * @param dryRun - Si es true, no realiza cambios reales
   */
  async execute(dryRun: boolean = false): Promise<IJobExecutionResult> {
    const startTime = Date.now();

    // Verificar si está habilitado
    if (!this.isEnabled()) {
      this.logger.debug(`[${this.jobName}] Job deshabilitado, saltando ejecución`);
      return {
        success: true,
        message: 'Job deshabilitado',
        duration: Date.now() - startTime,
        data: { skipped: true, reason: 'disabled' },
      };
    }

    // Evitar ejecuciones concurrentes
    if (this.isRunning) {
      this.logger.warn(`[${this.jobName}] Job ya está en ejecución, saltando`);
      return {
        success: false,
        message: 'Job ya está en ejecución',
        duration: Date.now() - startTime,
        data: { skipped: true, reason: 'already_running' },
      };
    }

    this.isRunning = true;
    this.logger.log(`[${this.jobName}] Iniciando precalentamiento de cache...`);

    try {
      const results: WarmupResult[] = [];
      const ttl = this.getDefaultTtl();

      if (dryRun) {
        this.logger.log(`[${this.jobName}] [DRY-RUN] Se precalentarían las siguientes keys:`);
        this.logger.log('  - stats:users');
        this.logger.log('  - stats:sessions');
        this.logger.log('  - users:count:*');

        return {
          success: true,
          message: 'Dry-run: cache warmup simulado',
          duration: Date.now() - startTime,
          data: {
            dryRun: true,
            keysToWarm: ['stats:users', 'stats:sessions', 'users:count:*'],
          },
        };
      }

      // 1. Estadísticas de usuarios
      results.push(await this.warmupUserStats(ttl));

      // 2. Estadísticas de sesiones
      results.push(await this.warmupSessionStats(ttl));

      // 3. Conteos globales
      results.push(await this.warmupGlobalCounts(ttl));

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;
      const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);

      const duration = Date.now() - startTime;

      if (failedCount > 0 && successCount === 0) {
        return {
          success: false,
          message: `Cache warmup fallido: ${failedCount} errores`,
          duration,
          error: {
            message: results
              .filter((r) => !r.success)
              .map((r) => r.error)
              .join('; '),
          },
          data: { results },
        };
      }

      this.logger.log(
        `[${this.jobName}] Cache warmup completado: ${successCount} keys precalentadas, ${failedCount} errores en ${duration}ms`,
      );

      return {
        success: failedCount === 0,
        message:
          failedCount > 0
            ? `Cache warmup parcial: ${successCount} éxitos, ${failedCount} errores`
            : `Cache warmup completado: ${successCount} keys precalentadas`,
        duration,
        metrics: {
          processed: results.length,
          affected: successCount,
          errors: failedCount,
        },
        data: {
          ttl,
          results,
          totalWarmupTime: totalDuration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(`[${this.jobName}] Error en cache warmup: ${errorMessage}`);

      return {
        success: false,
        message: `Error en cache warmup: ${errorMessage}`,
        duration,
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Precalienta estadísticas de usuarios
   */
  private async warmupUserStats(ttl: number): Promise<WarmupResult> {
    const key = 'stats:users';
    const startTime = Date.now();

    try {
      const stats = await this.userRepository.getStats();
      await this.cacheService.set(key, stats, { ttl, tags: ['users', 'stats'] });

      this.logger.debug(`[${this.jobName}] Precalentado: ${key}`);
      return {
        key,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`[${this.jobName}] Error precalentando ${key}: ${errorMsg}`);
      return {
        key,
        success: false,
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Precalienta estadísticas de sesiones
   */
  private async warmupSessionStats(ttl: number): Promise<WarmupResult> {
    const key = 'stats:sessions';
    const startTime = Date.now();

    try {
      const stats = await this.authRepository.getStats();
      await this.cacheService.set(key, stats, { ttl, tags: ['sessions', 'stats'] });

      this.logger.debug(`[${this.jobName}] Precalentado: ${key}`);
      return {
        key,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`[${this.jobName}] Error precalentando ${key}: ${errorMsg}`);
      return {
        key,
        success: false,
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Precalienta conteos globales
   */
  private async warmupGlobalCounts(ttl: number): Promise<WarmupResult> {
    const key = 'counts:global';
    const startTime = Date.now();

    try {
      const [userCount] = await Promise.all([this.userRepository.count()]);

      const counts = {
        users: userCount,
        updatedAt: new Date().toISOString(),
      };

      await this.cacheService.set(key, counts, { ttl, tags: ['counts', 'stats'] });

      this.logger.debug(`[${this.jobName}] Precalentado: ${key}`);
      return {
        key,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.warn(`[${this.jobName}] Error precalentando ${key}: ${errorMsg}`);
      return {
        key,
        success: false,
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Obtiene el estado actual del job
   */
  getStatus(): {
    isRunning: boolean;
    isEnabled: boolean;
    config: Record<string, unknown>;
  } {
    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled(),
      config: {
        ...DEFAULT_JOB_CONFIG[this.jobName],
        currentTtl: this.getDefaultTtl(),
      },
    };
  }
}
