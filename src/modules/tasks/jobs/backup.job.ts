/**
 * @fileoverview Job de backup de datos críticos
 * @module modules/tasks/jobs
 *
 * Crea backups de tablas críticas en formato JSON.
 * Se ejecuta semanalmente los domingos a las 2 AM por defecto.
 *
 * @requires DataSource - Para acceder a entidades
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import {
  JOB_NAMES,
  DEFAULT_JOB_CONFIG,
  CRON_EXPRESSIONS,
  TASKS_CONFIG,
  getEnvKey,
} from '../tasks.constants';
import { IJobExecutionResult } from '../interfaces';

interface BackupConfig {
  tables: string[];
  outputDir?: string;
  keepBackups?: number;
}

@Injectable()
export class BackupJob {
  private readonly logger = new Logger(BackupJob.name);
  private readonly jobName = JOB_NAMES.BACKUP;
  private isRunning = false;

  constructor(
    private readonly dataSource: DataSource,
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
   * Obtiene las tablas a respaldar
   */
  private getTablesToBackup(): string[] {
    const envValue = this.configService.get<string>('TASKS_BACKUP_TABLES');
    if (envValue) {
      return envValue.split(',').map((t) => t.trim());
    }

    const config = DEFAULT_JOB_CONFIG[this.jobName];
    // Usar spread para convertir readonly array a mutable array
    return config && 'tables' in config ? [...config.tables] : ['users', 'roles', 'permissions'];
  }

  /**
   * Obtiene el directorio de salida para backups
   */
  private getOutputDir(): string {
    const envValue = this.configService.get<string>('TASKS_BACKUP_DIR');
    if (envValue) {
      return envValue;
    }

    const config = DEFAULT_JOB_CONFIG[this.jobName] as { outputDir?: string };
    return config?.outputDir ?? TASKS_CONFIG.BACKUP_DIR;
  }

  /**
   * Obtiene el número de backups a mantener
   */
  private getKeepBackups(): number {
    const envValue = this.configService.get<number>('TASKS_BACKUP_KEEP');
    if (envValue) {
      return envValue;
    }

    const config = DEFAULT_JOB_CONFIG[this.jobName] as { keepBackups?: number };
    return config?.keepBackups ?? 4; // Por defecto mantener últimos 4 backups
  }

  /**
   * Genera el nombre del archivo de backup con timestamp
   */
  private generateBackupFilename(tableName: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${tableName}_${timestamp}.json`;
  }

  /**
   * Asegura que el directorio de backups existe
   */
  private ensureBackupDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`[${this.jobName}] Directorio de backups creado: ${dir}`);
    }
  }

  /**
   * Limpia backups antiguos manteniendo solo los últimos N
   */
  private async cleanOldBackups(dir: string, tableName: string, keep: number): Promise<number> {
    const pattern = new RegExp(`^${tableName}_.*\\.json$`);
    const files = fs
      .readdirSync(dir)
      .filter((f) => pattern.test(f))
      .map((f) => ({
        name: f,
        path: path.join(dir, f),
        mtime: fs.statSync(path.join(dir, f)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    let deletedCount = 0;
    if (files.length > keep) {
      const toDelete = files.slice(keep);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(file.path);
          deletedCount++;
          this.logger.debug(`[${this.jobName}] Backup antiguo eliminado: ${file.name}`);
        } catch (err) {
          this.logger.warn(`[${this.jobName}] No se pudo eliminar backup: ${file.name}`);
        }
      }
    }

    return deletedCount;
  }

  /**
   * Ejecuta el backup de datos
   * Cron: domingos a las 2 AM (configurable via TASKS_BACKUP_CRON)
   */
  @Cron(CRON_EXPRESSIONS.WEEKLY_SUNDAY_2AM, {
    name: JOB_NAMES.BACKUP,
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
    params?: { tables?: string[]; outputDir?: string },
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

    const tables = params?.tables ?? this.getTablesToBackup();
    const outputDir = params?.outputDir ?? this.getOutputDir();
    const keepBackups = this.getKeepBackups();

    this.logger.log(
      `[${this.jobName}] Iniciando backup de tablas: ${tables.join(', ')} → ${outputDir}`,
    );

    try {
      // Asegurar directorio de backups
      if (!dryRun) {
        this.ensureBackupDir(outputDir);
      }

      const results: Record<
        string,
        {
          records: number;
          filename: string;
          size?: number;
          oldBackupsDeleted?: number;
        }
      > = {};
      let totalRecords = 0;
      let totalSize = 0;
      const errors: string[] = [];

      for (const tableName of tables) {
        try {
          // Encontrar la entidad correspondiente
          const metadata = this.dataSource.entityMetadatas.find(
            (m) => m.tableName === tableName,
          );

          if (!metadata) {
            errors.push(`Tabla '${tableName}' no encontrada`);
            this.logger.warn(`[${this.jobName}] Tabla no encontrada: ${tableName}`);
            continue;
          }

          // Obtener todos los registros (sin soft-deleted)
          const records = await this.dataSource
            .createQueryBuilder()
            .select('*')
            .from(metadata.target, 'entity')
            .getRawMany();

          const recordCount = records.length;
          totalRecords += recordCount;

          if (dryRun) {
            this.logger.log(
              `[${this.jobName}] [DRY-RUN] ${tableName}: ${recordCount} registros serían respaldados`,
            );
            results[tableName] = {
              records: recordCount,
              filename: this.generateBackupFilename(tableName),
            };
            continue;
          }

          // Generar archivo de backup
          const filename = this.generateBackupFilename(tableName);
          const filepath = path.join(outputDir, filename);

          const backupData = {
            table: tableName,
            timestamp: new Date().toISOString(),
            recordCount,
            data: records,
          };

          fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf-8');
          const stats = fs.statSync(filepath);
          totalSize += stats.size;

          // Limpiar backups antiguos
          const oldDeleted = await this.cleanOldBackups(outputDir, tableName, keepBackups);

          results[tableName] = {
            records: recordCount,
            filename,
            size: stats.size,
            oldBackupsDeleted: oldDeleted,
          };

          this.logger.log(
            `[${this.jobName}] ${tableName}: ${recordCount} registros → ${filename} (${this.formatBytes(stats.size)})`,
          );
        } catch (tableError) {
          const errorMsg = tableError instanceof Error ? tableError.message : 'Error desconocido';
          errors.push(`${tableName}: ${errorMsg}`);
          this.logger.error(`[${this.jobName}] Error respaldando ${tableName}: ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;

      if (errors.length > 0 && errors.length === tables.length) {
        // Todos fallaron
        return {
          success: false,
          message: `Backup fallido: ${errors.join('; ')}`,
          duration,
          error: {
            message: errors.join('; '),
          },
        };
      }

      if (errors.length > 0) {
        // Algunos fallaron
        this.logger.warn(
          `[${this.jobName}] Backup parcial: ${totalRecords} registros, ${errors.length} errores`,
        );
        return {
          success: false,
          message: `Backup parcial: ${totalRecords} registros respaldados, ${errors.length} errores`,
          duration,
          metrics: {
            processed: tables.length,
            affected: totalRecords,
            errors: errors.length,
          },
          data: {
            dryRun,
            outputDir,
            tables,
            results,
            errors,
            totalSize,
            totalSizeFormatted: this.formatBytes(totalSize),
          },
        };
      }

      this.logger.log(
        `[${this.jobName}] Backup completado: ${totalRecords} registros de ${tables.length} tablas (${this.formatBytes(totalSize)}) en ${duration}ms`,
      );

      return {
        success: true,
        message: dryRun
          ? `Dry-run: ${totalRecords} registros serían respaldados`
          : `Backup completado: ${totalRecords} registros de ${tables.length} tablas`,
        duration,
        metrics: {
          processed: tables.length,
          affected: totalRecords,
        },
        data: {
          dryRun,
          outputDir,
          tables,
          results,
          totalSize,
          totalSizeFormatted: this.formatBytes(totalSize),
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(`[${this.jobName}] Error en backup: ${errorMessage}`);

      return {
        success: false,
        message: `Error en backup: ${errorMessage}`,
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
   * Formatea bytes a formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtiene el estado actual del job
   */
  getStatus(): {
    isRunning: boolean;
    isEnabled: boolean;
    config: Record<string, unknown>;
    existingBackups: Record<string, number>;
  } {
    const outputDir = this.getOutputDir();
    const tables = this.getTablesToBackup();
    const existingBackups: Record<string, number> = {};

    if (fs.existsSync(outputDir)) {
      for (const table of tables) {
        const pattern = new RegExp(`^${table}_.*\\.json$`);
        const count = fs.readdirSync(outputDir).filter((f) => pattern.test(f)).length;
        existingBackups[table] = count;
      }
    }

    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled(),
      config: {
        ...DEFAULT_JOB_CONFIG[this.jobName],
        currentTables: tables,
        currentOutputDir: outputDir,
        keepBackups: this.getKeepBackups(),
      },
      existingBackups,
    };
  }
}
