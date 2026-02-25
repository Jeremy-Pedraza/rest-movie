/**
 * @fileoverview Job de limpieza de Redis (Bull queues + cache orphans)
 * @module modules/tasks/jobs
 *
 * Limpia:
 * - Jobs fallidos de Bull que exceden la edad configurada (default 7 dias)
 * - Jobs completados de Bull que exceden la edad (default 1 hora)
 * - Claves huerfanas de cache:stats:tag:* (sin cache:tag:* correspondiente)
 * - Claves huerfanas de cache:keytags:* (sin clave de cache subyacente)
 *
 * Se ejecuta cada 6 horas por defecto.
 * Usa lock distribuido para evitar ejecuciones concurrentes.
 *
 * @requires QueueService - Para limpiar jobs de las colas Bull
 * @requires RedisService - Para escanear y eliminar claves huerfanas
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { LoggerService, LogContext } from '@modules/logger';
import { QueueService } from '@modules/queue';
import { QUEUE_NAMES } from '@modules/queue/queue.constants';
import { RedisService } from '@shared/redis';

import { IJobExecutionResult } from '../interfaces';
import { CRON_EXPRESSIONS, DEFAULT_JOB_CONFIG, getEnvKey, JOB_NAMES } from '../tasks.constants';

/** Prefijo para claves de tags de cache */
const TAG_PREFIX = 'cache:tag:';

/** Prefijo para claves de stats de cache */
const STATS_PREFIX = 'cache:stats:';

/** Prefijo para indice inverso key->tags */
const KEY_TAGS_PREFIX = 'cache:keytags:';

/** Grace period para jobs fallidos: 7 dias en ms */
const FAILED_JOBS_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** Grace period para jobs completados: 1 hora en ms */
const COMPLETED_JOBS_GRACE_MS = 60 * 60 * 1000;

/** TTL del lock distribuido en segundos */
const LOCK_TTL = 120;

/** Nombre del lock distribuido */
const LOCK_KEY = 'lock:redis-cleanup';

@Injectable()
export class RedisCleanupJob {
  private readonly logger = new Logger(RedisCleanupJob.name);
  private readonly jobName = JOB_NAMES.REDIS_CLEANUP;
  private isRunning = false;

  constructor(
    private readonly queueService: QueueService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Verifica si el job esta habilitado
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
   * Ejecuta la limpieza de Redis
   * Cron: cada 6 horas (configurable via TASKS_REDIS_CLEANUP_CRON)
   */
  @Cron(CRON_EXPRESSIONS.EVERY_6_HOURS, {
    name: JOB_NAMES.REDIS_CLEANUP,
  })
  async handleCron(): Promise<IJobExecutionResult> {
    return await this.execute();
  }

  /**
   * Ejecuta el job manualmente o desde el cron
   * @param dryRun - Si es true, no realiza cambios reales
   */
  async execute(
    dryRun: boolean = false,
    _params?: Record<string, unknown>,
  ): Promise<IJobExecutionResult> {
    const startTime = Date.now();

    // Verificar si esta habilitado
    if (!this.isEnabled()) {
      this.logger.debug(`[${this.jobName}] Job deshabilitado, saltando ejecucion`);
      return {
        success: true,
        message: 'Job deshabilitado',
        duration: Date.now() - startTime,
        data: { skipped: true, reason: 'disabled' },
      };
    }

    // Evitar ejecuciones concurrentes (local)
    if (this.isRunning) {
      this.logWarn(`[${this.jobName}] Job ya esta en ejecucion, saltando`);
      return {
        success: false,
        message: 'Job ya esta en ejecucion',
        duration: Date.now() - startTime,
        data: { skipped: true, reason: 'already_running' },
      };
    }

    this.isRunning = true;

    // Lock distribuido para evitar ejecucion concurrente en multiples instancias
    const lockValue = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let lockAcquired = false;

    try {
      const lockResult = await this.redis.acquireLock(LOCK_KEY, LOCK_TTL, lockValue);
      lockAcquired = lockResult !== null;

      if (!lockAcquired) {
        this.logger.log(`[${this.jobName}] No se pudo adquirir lock distribuido, otra instancia ejecutando`);
        return {
          success: true,
          message: 'Otra instancia ejecutando (lock distribuido)',
          duration: Date.now() - startTime,
          data: { skipped: true, reason: 'distributed_lock' },
        };
      }

      this.logger.log(
        `[${this.jobName}] Iniciando limpieza de Redis (dryRun: ${dryRun})...`,
      );

      const metrics = {
        failedJobsCleaned: 0,
        completedJobsCleaned: 0,
        orphanedStatsCleaned: 0,
        orphanedKeytagsCleaned: 0,
        errors: 0,
      };
      const errors: string[] = [];

      // ============================================
      // 1. Limpiar jobs de Bull (failed + completed)
      // ============================================
      const queueNames = [QUEUE_NAMES.EMAIL, QUEUE_NAMES.NOTIFICATION, QUEUE_NAMES.REPORT];

      for (const queueName of queueNames) {
        try {
          // Limpiar jobs fallidos (grace: 7 dias)
          if (!dryRun) {
            const failedResult = await this.queueService.cleanJobs(queueName, {
              grace: FAILED_JOBS_GRACE_MS,
              status: 'failed',
              limit: 5000,
            } as any);
            metrics.failedJobsCleaned += failedResult.cleaned;
          }

          // Limpiar jobs completados (grace: 1 hora)
          if (!dryRun) {
            const completedResult = await this.queueService.cleanJobs(queueName, {
              grace: COMPLETED_JOBS_GRACE_MS,
              status: 'completed',
              limit: 5000,
            } as any);
            metrics.completedJobsCleaned += completedResult.cleaned;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          errors.push(`Queue ${queueName}: ${errorMsg}`);
          metrics.errors++;
          this.logError(`[${this.jobName}] Error limpiando cola ${queueName}: ${errorMsg}`);
        }
      }

      // ============================================
      // 2. Limpiar stats de tags huerfanos
      // ============================================
      try {
        const orphanedStats = await this.cleanOrphanedTagStats(dryRun);
        metrics.orphanedStatsCleaned = orphanedStats;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Orphaned stats: ${errorMsg}`);
        metrics.errors++;
        this.logError(`[${this.jobName}] Error limpiando stats huerfanos: ${errorMsg}`);
      }

      // ============================================
      // 3. Limpiar indices inversos huerfanos
      // ============================================
      try {
        const orphanedKeytags = await this.cleanOrphanedKeytags(dryRun);
        metrics.orphanedKeytagsCleaned = orphanedKeytags;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        errors.push(`Orphaned keytags: ${errorMsg}`);
        metrics.errors++;
        this.logError(`[${this.jobName}] Error limpiando keytags huerfanos: ${errorMsg}`);
      }

      const duration = Date.now() - startTime;
      const totalCleaned =
        metrics.failedJobsCleaned +
        metrics.completedJobsCleaned +
        metrics.orphanedStatsCleaned +
        metrics.orphanedKeytagsCleaned;

      if (errors.length > 0) {
        this.logWarn(
          `[${this.jobName}] Limpieza completada con ${errors.length} errores. Total limpiado: ${totalCleaned}`,
        );
        return {
          success: false,
          message: `Limpieza parcial: ${totalCleaned} elementos limpiados, ${errors.length} errores`,
          duration,
          metrics: {
            processed: totalCleaned + metrics.errors,
            affected: totalCleaned,
            errors: metrics.errors,
          },
          data: { dryRun, ...metrics, errors },
        };
      }

      this.logger.log(
        `[${this.jobName}] Limpieza completada: ${totalCleaned} elementos limpiados en ${duration}ms`,
      );

      return {
        success: true,
        message: dryRun
          ? `Dry-run: se limpiarian ${totalCleaned} elementos`
          : `Limpiados ${totalCleaned} elementos de Redis`,
        duration,
        metrics: {
          processed: totalCleaned,
          affected: totalCleaned,
        },
        data: { dryRun, ...metrics },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      this.logError(`[${this.jobName}] Error en limpieza: ${errorMessage}`);

      return {
        success: false,
        message: `Error en limpieza: ${errorMessage}`,
        duration,
        error: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        },
      };
    } finally {
      // Liberar lock distribuido
      if (lockAcquired) {
        await this.redis.releaseLock(LOCK_KEY, lockValue).catch((err) => {
          this.logError(`[${this.jobName}] Error liberando lock: ${err?.message}`);
        });
      }
      this.isRunning = false;
    }
  }

  /**
   * Limpia claves cache:stats:tag:* que no tienen un cache:tag:* correspondiente
   * (tag stats sin tag set activo = huerfano)
   */
  private async cleanOrphanedTagStats(dryRun: boolean): Promise<number> {
    let cleaned = 0;
    let cursor = '0';

    do {
      const page = await this.redis.scanPage(cursor, {
        pattern: `${STATS_PREFIX}tag:*`,
        count: 100,
      });
      cursor = page.nextCursor;

      for (const statsKey of page.keys) {
        // Extraer nombre del tag: cache:stats:tag:{tag} -> {tag}
        const tag = statsKey.replace(`${STATS_PREFIX}tag:`, '');
        const tagKey = `${TAG_PREFIX}${tag}`;

        // Si no existe el tag set correspondiente, es huerfano
        const tagExists = await this.redis.exists(tagKey);
        if (!tagExists) {
          if (!dryRun) {
            await this.redis.del(statsKey);
          }
          cleaned++;
        }
      }
    } while (cursor !== '0');

    if (cleaned > 0) {
      this.logger.log(
        `[${this.jobName}] ${dryRun ? '[DRY-RUN] ' : ''}Stats huerfanos: ${cleaned} eliminados`,
      );
    }

    return cleaned;
  }

  /**
   * Limpia claves cache:keytags:* cuya clave de cache subyacente ya no existe
   * (indice inverso sin clave de cache = huerfano)
   */
  private async cleanOrphanedKeytags(dryRun: boolean): Promise<number> {
    let cleaned = 0;
    let cursor = '0';

    do {
      const page = await this.redis.scanPage(cursor, {
        pattern: `${KEY_TAGS_PREFIX}*`,
        count: 100,
      });
      cursor = page.nextCursor;

      for (const keytagKey of page.keys) {
        // Extraer la key original: cache:keytags:{cacheKey} -> {cacheKey}
        const cacheKey = keytagKey.replace(KEY_TAGS_PREFIX, '');

        // Si la clave de cache original ya no existe, el indice inverso es huerfano
        const cacheKeyExists = await this.redis.exists(cacheKey);
        if (!cacheKeyExists) {
          if (!dryRun) {
            // Limpiar las membresías en tags antes de eliminar
            const tags = await this.redis.sMembers(keytagKey);
            for (const tag of tags) {
              const tagSetKey = `${TAG_PREFIX}${tag}`;
              await this.redis.sRem(tagSetKey, cacheKey);
            }
            await this.redis.del(keytagKey);
          }
          cleaned++;
        }
      }
    } while (cursor !== '0');

    if (cleaned > 0) {
      this.logger.log(
        `[${this.jobName}] ${dryRun ? '[DRY-RUN] ' : ''}Keytags huerfanos: ${cleaned} eliminados`,
      );
    }

    return cleaned;
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
        failedJobsGraceMs: FAILED_JOBS_GRACE_MS,
        completedJobsGraceMs: COMPLETED_JOBS_GRACE_MS,
        lockTtl: LOCK_TTL,
      },
    };
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.SYSTEM,
      service: RedisCleanupJob.name,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.SYSTEM,
      service: RedisCleanupJob.name,
      stack,
    });
  }
}
