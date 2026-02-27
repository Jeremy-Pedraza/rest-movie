/**
 * @fileoverview Job de limpieza de registros soft-deleted
 * @module modules/tasks/jobs
 *
 * Elimina permanentemente registros que fueron soft-deleted
 * hace más de X días (por defecto 30 días).
 * Se ejecuta diariamente a las 3 AM por defecto.
 *
 * @requires DataSource - Para acceder a entidades con soft-delete
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { DataSource, EntityMetadata } from 'typeorm';
import { LoggerService, LogContext } from '@modules/logger';

import { IJobExecutionResult } from '../interfaces';
import { CRON_EXPRESSIONS, DEFAULT_JOB_CONFIG, getEnvKey, JOB_NAMES } from '../tasks.constants';

@Injectable()
export class CleanupJob {
  private readonly logger = new Logger(CleanupJob.name);
  private readonly jobName = JOB_NAMES.CLEANUP;
  private isRunning = false;

  constructor(
    private readonly dataSource: DataSource,
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

    if (envValue !== undefined) {
      return envValue === 'true';
    }

    return DEFAULT_JOB_CONFIG[this.jobName]?.enabled ?? true;
  }

  /**
   * Obtiene los días de retención configurados
   */
  private getRetentionDays(): number {
    const envValue = this.configService.get<number>('TASKS_CLEANUP_RETENTION_DAYS');
    if (envValue) {
      return envValue;
    }

    const config = DEFAULT_JOB_CONFIG[this.jobName] as { retentionDays?: number };
    return config?.retentionDays ?? 30;
  }

  /**
   * Obtiene las tablas a limpiar (si están configuradas)
   */
  private getTablesToClean(): string[] | null {
    const envValue = this.configService.get<string>('TASKS_CLEANUP_TABLES');
    if (envValue) {
      return envValue.split(',').map((t) => t.trim());
    }

    const config = DEFAULT_JOB_CONFIG[this.jobName] as { tables?: string[] };
    return config?.tables ?? null; // null = todas las tablas con soft-delete
  }

  /**
   * Encuentra entidades que tienen soft-delete habilitado
   */
  private findSoftDeleteEntities(): EntityMetadata[] {
    const configuredTables = this.getTablesToClean();

    return this.dataSource.entityMetadatas.filter((metadata) => {
      // Verificar si tiene columna deletedAt (soft-delete)
      const hasDeletedAt = metadata.columns.some(
        (col) => col.propertyName === 'deletedAt' && col.isDeleteDate,
      );

      if (!hasDeletedAt) {
        return false;
      }

      // Si hay tablas configuradas, filtrar solo esas
      if (configuredTables && configuredTables.length > 0) {
        return configuredTables.includes(metadata.tableName);
      }

      return true;
    });
  }

  /**
   * Ejecuta la limpieza de registros soft-deleted
   * Cron: diario a las 3 AM (configurable via TASKS_CLEANUP_CRON)
   */
  @Cron(CRON_EXPRESSIONS.DAILY_3AM, {
    name: JOB_NAMES.CLEANUP,
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
    params?: { retentionDays?: number; tables?: string[] },
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
      this.logWarn(`[${this.jobName}] Job ya está en ejecución, saltando`);
      return {
        success: false,
        message: 'Job ya está en ejecución',
        duration: Date.now() - startTime,
        data: { skipped: true, reason: 'already_running' },
      };
    }

    this.isRunning = true;

    const retentionDays = params?.retentionDays ?? this.getRetentionDays();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.logger.log(
      `[${this.jobName}] Iniciando limpieza de registros soft-deleted (retención: ${retentionDays} días, fecha corte: ${cutoffDate.toISOString()})...`,
    );

    try {
      const entities = this.findSoftDeleteEntities();

      if (entities.length === 0) {
        this.logger.log(`[${this.jobName}] No se encontraron entidades con soft-delete`);
        return {
          success: true,
          message: 'No hay entidades con soft-delete configuradas',
          duration: Date.now() - startTime,
          data: { entitiesFound: 0 },
        };
      }

      const results: Record<string, { counted: number; deleted: number }> = {};
      let totalDeleted = 0;
      let totalCounted = 0;
      const errors: string[] = [];

      for (const entity of entities) {
        const tableName = entity.tableName;
        const entityName = entity.name;

        try {
          // Contar registros a eliminar
          const countQuery = await this.dataSource
            .createQueryBuilder()
            .select('COUNT(*)', 'count')
            .from(entity.target, 'entity')
            .withDeleted() // Incluir soft-deleted
            .where('entity.deletedAt IS NOT NULL')
            .andWhere('entity.deletedAt < :cutoffDate', { cutoffDate })
            .getRawOne<{ count: string }>();

          const counted = parseInt(countQuery?.count ?? '0', 10);
          totalCounted += counted;

          if (counted === 0) {
            results[tableName] = { counted: 0, deleted: 0 };
            continue;
          }

          if (dryRun) {
            this.logger.log(
              `[${this.jobName}] [DRY-RUN] ${tableName}: ${counted} registros serían eliminados`,
            );
            results[tableName] = { counted, deleted: 0 };
            continue;
          }

          // Eliminar registros permanentemente
          const deleteResult = await this.dataSource
            .createQueryBuilder()
            .delete()
            .from(entity.target)
            .where('deletedAt IS NOT NULL')
            .andWhere('deletedAt < :cutoffDate', { cutoffDate })
            .execute();

          const deleted = deleteResult.affected ?? 0;
          totalDeleted += deleted;
          results[tableName] = { counted, deleted };

          this.logger.log(
            `[${this.jobName}] ${tableName}: eliminados ${deleted}/${counted} registros`,
          );
        } catch (entityError) {
          const errorMsg = entityError instanceof Error ? entityError.message : 'Error desconocido';
          errors.push(`${entityName}: ${errorMsg}`);
          this.logError(`[${this.jobName}] Error limpiando ${tableName}: ${errorMsg}`);
          results[tableName] = { counted: 0, deleted: 0 };
        }
      }

      const duration = Date.now() - startTime;

      if (errors.length > 0) {
        this.logWarn(
          `[${this.jobName}] Limpieza completada con ${errors.length} errores: ${totalDeleted} registros eliminados`,
        );
        return {
          success: false,
          message: `Limpieza parcial: ${totalDeleted} eliminados, ${errors.length} errores`,
          duration,
          metrics: {
            processed: totalCounted,
            affected: totalDeleted,
            errors: errors.length,
          },
          data: {
            dryRun,
            retentionDays,
            cutoffDate: cutoffDate.toISOString(),
            entitiesProcessed: entities.length,
            results,
            errors,
          },
        };
      }

      this.logger.log(
        `[${this.jobName}] Limpieza completada: ${totalDeleted} registros eliminados de ${entities.length} tablas en ${duration}ms`,
      );

      return {
        success: true,
        message: dryRun
          ? `Dry-run: ${totalCounted} registros serían eliminados de ${entities.length} tablas`
          : `Eliminados ${totalDeleted} registros de ${entities.length} tablas`,
        duration,
        metrics: {
          processed: totalCounted,
          affected: totalDeleted,
        },
        data: {
          dryRun,
          retentionDays,
          cutoffDate: cutoffDate.toISOString(),
          entitiesProcessed: entities.length,
          results,
        },
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
    entities: string[];
  } {
    const entities = this.findSoftDeleteEntities().map((e) => e.tableName);

    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled(),
      config: {
        ...DEFAULT_JOB_CONFIG[this.jobName],
        currentRetentionDays: this.getRetentionDays(),
        configuredTables: this.getTablesToClean(),
      },
      entities,
    };
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.SYSTEM,
      service: CleanupJob.name,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.SYSTEM,
      service: CleanupJob.name,
      stack,
    });
  }
}
