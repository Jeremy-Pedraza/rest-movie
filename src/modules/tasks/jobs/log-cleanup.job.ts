/**
 * @fileoverview Job de limpieza de logs antiguos
 * @module modules/tasks/jobs
 *
 * Elimina logs de nivel debug/verbose que tienen más de X días.
 * Se ejecuta diariamente a las 4 AM por defecto.
 *
 * @requires LoggerRepository - Para eliminar logs
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { LogLevel } from '@modules/logger/entities/log.entity';
import { LoggerRepository } from '@modules/logger/logger.repository';
import { IJobExecutionResult } from '../interfaces';
import { CRON_EXPRESSIONS, DEFAULT_JOB_CONFIG, getEnvKey, JOB_NAMES } from '../tasks.constants';

@Injectable()
export class LogCleanupJob {
  private readonly logger = new Logger(LogCleanupJob.name);
  private readonly jobName = JOB_NAMES.LOG_CLEANUP;
  private isRunning = false;

  constructor(
    private readonly loggerRepository: LoggerRepository,
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
   * Obtiene los días de retención configurados
   */
  private getRetentionDays(): number {
    const envValue = this.configService.get<number>('TASKS_LOG_CLEANUP_RETENTION_DAYS');
    if (envValue) {
      return envValue;
    }

    const config = DEFAULT_JOB_CONFIG[this.jobName] as { retentionDays?: number };
    return config?.retentionDays ?? 7;
  }

  /**
   * Obtiene los niveles de log a limpiar
   */
  private getLevelsToClean(): LogLevel[] {
    const envValue = this.configService.get<string>('TASKS_LOG_CLEANUP_LEVELS');
    if (envValue) {
      return envValue.split(',').map((l) => l.trim() as LogLevel);
    }

    const config = DEFAULT_JOB_CONFIG[this.jobName];
    // Usar spread para convertir readonly array a mutable array
    const levels = config && 'levels' in config ? [...config.levels] : ['debug', 'verbose'];
    return levels as LogLevel[];
  }

  /**
   * Ejecuta la limpieza de logs antiguos
   * Cron: diario a las 4 AM (configurable via TASKS_LOG_CLEANUP_CRON)
   */
  @Cron(CRON_EXPRESSIONS.DAILY_4AM, {
    name: JOB_NAMES.LOG_CLEANUP,
  })
  async handleCron(): Promise<IJobExecutionResult> {
    return await this.execute();
  }

  /**
   * Ejecuta el job manualmente o desde el cron
   * @param dryRun - Si es true, no realiza cambios reales
   * @param params - Parámetros opcionales
   */
  async execute(
    dryRun: boolean = false,
    params?: { retentionDays?: number; levels?: LogLevel[] },
  ): Promise<IJobExecutionResult> {
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

    const retentionDays = params?.retentionDays ?? this.getRetentionDays();
    const levels = params?.levels ?? this.getLevelsToClean();

    this.logger.log(
      `[${this.jobName}] Iniciando limpieza de logs (retención: ${retentionDays} días, niveles: ${levels.join(', ')})...`,
    );

    try {
      const results: Record<string, number> = {};
      let totalDeleted = 0;

      if (dryRun) {
        // En modo dry-run, solo reportamos lo que se haría
        const currentCount = await this.loggerRepository.count();
        this.logger.log(
          `[${this.jobName}] [DRY-RUN] Total de logs actuales: ${currentCount}. Se limpiarían logs de niveles: ${levels.join(', ')} con más de ${retentionDays} días.`,
        );
        return {
          success: true,
          message: `Dry-run: se eliminarían logs de niveles [${levels.join(', ')}] mayores a ${retentionDays} días`,
          duration: Date.now() - startTime,
          data: {
            dryRun: true,
            retentionDays,
            levels,
            currentTotalLogs: currentCount,
          },
        };
      }

      // Eliminar logs por cada nivel configurado
      for (const level of levels) {
        const deletedCount = await this.loggerRepository.deleteByLevel(level, retentionDays);
        results[level] = deletedCount;
        totalDeleted += deletedCount;
        this.logger.log(`[${this.jobName}] Eliminados ${deletedCount} logs de nivel ${level}`);
      }

      const duration = Date.now() - startTime;

      this.logger.log(
        `[${this.jobName}] Limpieza completada: ${totalDeleted} logs eliminados en ${duration}ms`,
      );

      return {
        success: true,
        message: `Eliminados ${totalDeleted} logs antiguos`,
        duration,
        metrics: {
          affected: totalDeleted,
          processed: totalDeleted,
        },
        data: {
          retentionDays,
          levels,
          deletedByLevel: results,
          totalDeleted,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(`[${this.jobName}] Error en limpieza de logs: ${errorMessage}`);

      return {
        success: false,
        message: `Error en limpieza de logs: ${errorMessage}`,
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
        currentRetentionDays: this.getRetentionDays(),
        currentLevels: this.getLevelsToClean(),
      },
    };
  }
}
