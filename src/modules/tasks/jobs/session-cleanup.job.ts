/**
 * @fileoverview Job de limpieza de sesiones expiradas
 * @module modules/tasks/jobs
 *
 * Elimina sesiones que han expirado o han sido revocadas.
 * Se ejecuta cada 15 minutos por defecto.
 *
 * @requires AuthRepository - Para eliminar sesiones
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

import { DEFAULT_MAX_ACTIVE_SESSIONS } from '@constants';
import { AuthRepository } from '@modules/auth/auth.repository';
import { LoggerService, LogContext } from '@modules/logger';
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
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
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
      this.logWarn(`[${this.jobName}] Job ya está en ejecución, saltando`);
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
      let deactivatedExpiredCount = 0;
      let autoRevokedByLimitCount = 0;

      if (dryRun) {
        // En modo dry-run, solo contamos las sesiones que serían eliminadas
        const stats = await this.authRepository.getStats();
        deletedCount = stats.expired + stats.revoked;
        this.logger.log(`[${this.jobName}] [DRY-RUN] Se eliminarían ${deletedCount} sesiones`);
      } else {
        // 1) Marcar expiradas como inactivas para evitar "activas fantasmas"
        deactivatedExpiredCount = await this.authRepository.deactivateExpiredSessions();

        // 2) Revocar exceso de sesiones activas por usuario (global)
        const rawLimit = this.configService.get<string>('AUTH_MAX_ACTIVE_SESSIONS');
        const parsed = rawLimit ? parseInt(rawLimit, 10) : NaN;
        const maxActiveSessions =
          Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ACTIVE_SESSIONS;
        const usersExceedingLimit =
          await this.authRepository.findUsersExceedingActiveSessions(maxActiveSessions);

        for (const userId of usersExceedingLimit) {
          const activeSessions = await this.authRepository.findActiveByUserId(userId);
          const sessionsToRevoke = activeSessions
            .slice(maxActiveSessions)
            .map((session) => session.id);
          autoRevokedByLimitCount += await this.authRepository.revokeSessionsByIds(
            sessionsToRevoke,
            `Session limit exceeded (max ${maxActiveSessions})`,
          );
        }

        // 3) Ejecutar la limpieza real
        deletedCount = await this.authRepository.deleteExpiredSessions();
        this.logger.log(
          `[${this.jobName}] Desactivadas ${deactivatedExpiredCount}, auto-revocadas ${autoRevokedByLimitCount} por límite y eliminadas ${deletedCount} sesiones stale`,
        );
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        message: dryRun
          ? `Dry-run: se eliminarían ${deletedCount} sesiones`
          : `Desactivadas ${deactivatedExpiredCount}, auto-revocadas ${autoRevokedByLimitCount} y eliminadas ${deletedCount} sesiones stale`,
        duration,
        metrics: {
          affected: deletedCount + deactivatedExpiredCount + autoRevokedByLimitCount,
          processed: deletedCount + deactivatedExpiredCount + autoRevokedByLimitCount,
        },
        data: {
          deletedCount,
          deactivatedExpiredCount,
          autoRevokedByLimitCount,
          dryRun,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      this.logError(`[${this.jobName}] Error en limpieza de sesiones: ${errorMessage}`);

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

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.SYSTEM,
      service: SessionCleanupJob.name,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.SYSTEM,
      service: SessionCleanupJob.name,
      stack,
    });
  }
}
