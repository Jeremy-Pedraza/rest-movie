/**
 * @fileoverview Job de limpieza de sesiones expiradas
 * @module modules/tasks/jobs
 *
 * Elimina sesiones que han expirado o han sido revocadas.
 * Se ejecuta cada 15 minutos por defecto.
 *
 * @requires AuthRepository - Para eliminar sesiones
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { AuthRepository } from '@modules/auth/auth.repository';
import { IJobExecutionResult } from '../interfaces';
import { CRON_EXPRESSIONS, DEFAULT_JOB_CONFIG, getEnvKey, JOB_NAMES } from '../tasks.constants';

@Injectable()
export class SessionCleanupJob {
  private readonly logger = new Logger(SessionCleanupJob.name);
  private readonly jobName = JOB_NAMES.SESSION_CLEANUP;
  private isRunning = false;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verifica si el job está habilitado
   */
  private isEnabled(): boolean {
    const envKey = getEnvKey(this.jobName, 'enabled');
    const envValue = this.configService.get<string>(envKey);

    // Si hay variable de entorno, usarla
    if (envValue !== undefined) {
      return envValue === 'true';
    }

    // Usar configuración por defecto
    return DEFAULT_JOB_CONFIG[this.jobName]?.enabled ?? true;
  }

  /**
   * Ejecuta la limpieza de sesiones expiradas
   * Cron: cada 15 minutos (configurable via TASKS_SESSION_CLEANUP_CRON)
   */
  @Cron(CRON_EXPRESSIONS.EVERY_15_MINUTES, {
    name: JOB_NAMES.SESSION_CLEANUP,
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
    this.logger.log(`[${this.jobName}] Iniciando limpieza de sesiones expiradas...`);

    try {
      let deletedCount = 0;

      if (dryRun) {
        // En modo dry-run, solo contamos las sesiones que serían eliminadas
        const stats = await this.authRepository.getStats();
        deletedCount = stats.expired + stats.revoked;
        this.logger.log(`[${this.jobName}] [DRY-RUN] Se eliminarían ${deletedCount} sesiones`);
      } else {
        // Ejecutar la limpieza real
        deletedCount = await this.authRepository.deleteExpiredSessions();
        this.logger.log(`[${this.jobName}] Eliminadas ${deletedCount} sesiones expiradas`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: dryRun
          ? `Dry-run: se eliminarían ${deletedCount} sesiones`
          : `Eliminadas ${deletedCount} sesiones expiradas`,
        duration,
        metrics: {
          affected: deletedCount,
          processed: deletedCount,
        },
        data: {
          deletedCount,
          dryRun,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(`[${this.jobName}] Error en limpieza de sesiones: ${errorMessage}`);

      return {
        success: false,
        message: `Error en limpieza de sesiones: ${errorMessage}`,
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
  getStatus(): { isRunning: boolean; isEnabled: boolean; config: Record<string, unknown> } {
    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled(),
      config: DEFAULT_JOB_CONFIG[this.jobName],
    };
  }
}
