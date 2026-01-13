/**
 * @fileoverview Service para gestión de tareas programadas
 * @module modules/tasks
 *
 * ⚠️ REGLAS:
 * - Usar SchedulerRegistry para gestión dinámica de cron jobs
 * - Usar HandleErrorService para errores
 * - NO usar try-catch en métodos públicos (filter global)
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ConfigService } from '@nestjs/config';

import { HandleErrorService } from '@shared/common';

import {
  JOB_NAMES,
  JOB_STATUS,
  DEFAULT_JOB_CONFIG,
  TASKS_CONFIG,
  JobName,
  JobStatus,
  getEnvKey,
} from './tasks.constants';
import {
  ITaskInfo,
  ITaskDetailResponse,
  ITaskListResponse,
  IRunTaskResponse,
  IToggleTaskResponse,
  ITasksStatsResponse,
  INextRunsResponse,
  ITaskHistoryResponse,
  IJobExecutionResult,
  IJobExecutionHistory,
} from './interfaces';
import { QueryTaskDto, QueryTaskHistoryDto, RunTaskDto } from './dto';

// Jobs
import {
  CleanupJob,
  BackupJob,
  SessionCleanupJob,
  LogCleanupJob,
  CacheWarmupJob,
} from './jobs';

/**
 * Registro interno de ejecuciones
 */
interface ExecutionRecord {
  id: string;
  jobName: string;
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  startedAt: Date;
  completedAt: Date;
  duration: number;
  isManual: boolean;
  triggeredBy?: string;
  result?: IJobExecutionResult;
  errorMessage?: string;
}

@Injectable()
export class TasksService implements OnModuleInit {
  private readonly logger = new Logger(TasksService.name);

  /**
   * Historial de ejecuciones en memoria
   * En producción, esto podría persistirse en BD
   */
  private executionHistory: Map<string, ExecutionRecord[]> = new Map();

  /**
   * Mapa de jobs registrados para acceso directo
   */
  private readonly jobInstances: Map<string, any> = new Map();

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly handleError: HandleErrorService,
    // Jobs
    private readonly cleanupJob: CleanupJob,
    private readonly backupJob: BackupJob,
    private readonly sessionCleanupJob: SessionCleanupJob,
    private readonly logCleanupJob: LogCleanupJob,
    private readonly cacheWarmupJob: CacheWarmupJob,
  ) {
    // Registrar instancias de jobs
    this.jobInstances.set(JOB_NAMES.CLEANUP, this.cleanupJob);
    this.jobInstances.set(JOB_NAMES.BACKUP, this.backupJob);
    this.jobInstances.set(JOB_NAMES.SESSION_CLEANUP, this.sessionCleanupJob);
    this.jobInstances.set(JOB_NAMES.LOG_CLEANUP, this.logCleanupJob);
    this.jobInstances.set(JOB_NAMES.CACHE_WARMUP, this.cacheWarmupJob);
  }

  async onModuleInit() {
    this.logger.log('TasksService initialized');
    this.logger.log(`Registered jobs: ${Array.from(this.jobInstances.keys()).join(', ')}`);

    // Inicializar historial para cada job
    for (const jobName of Object.values(JOB_NAMES)) {
      this.executionHistory.set(jobName, []);
    }
  }

  // ============================================
  // LISTAR TAREAS
  // ============================================

  /**
   * Lista todas las tareas programadas con filtros opcionales
   */
  async listTasks(query: QueryTaskDto): Promise<ITaskListResponse> {
    const allJobs = this.getAllJobNames();
    let tasks: ITaskInfo[] = [];

    for (const jobName of allJobs) {
      const taskInfo = await this.getTaskInfo(jobName);
      tasks.push(taskInfo);
    }

    // Aplicar filtros
    if (query.status) {
      tasks = tasks.filter((t) => t.status === query.status);
    }

    if (query.enabled !== undefined) {
      tasks = tasks.filter((t) => t.enabled === query.enabled);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower),
      );
    }

    // Ordenar
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'ASC';
    tasks.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'lastRun') {
        const aTime = a.lastRun?.getTime() || 0;
        const bTime = b.lastRun?.getTime() || 0;
        comparison = aTime - bTime;
      } else if (sortBy === 'nextRun') {
        const aTime = a.nextRun?.getTime() || Infinity;
        const bTime = b.nextRun?.getTime() || Infinity;
        comparison = aTime - bTime;
      }
      return sortOrder === 'ASC' ? comparison : -comparison;
    });

    // Resumen
    const summary = {
      total: tasks.length,
      active: tasks.filter((t) => t.status === JOB_STATUS.ACTIVE).length,
      disabled: tasks.filter((t) => !t.enabled).length,
      running: tasks.filter((t) => t.status === JOB_STATUS.RUNNING).length,
    };

    return { tasks, summary };
  }

  /**
   * Obtiene información detallada de una tarea
   */
  async getTask(name: string): Promise<ITaskDetailResponse> {
    this.validateJobExists(name);

    const taskInfo = await this.getTaskInfo(name);
    const history = this.getJobHistory(name);
    const stats = this.calculateJobStats(name);

    return {
      ...taskInfo,
      config: this.getJobConfig(name),
      stats,
      recentExecutions: history.slice(0, 10),
    };
  }

  // ============================================
  // EJECUTAR TAREAS
  // ============================================

  /**
   * Ejecuta una tarea manualmente
   */
  async runTask(name: string, dto: RunTaskDto, triggeredBy?: string): Promise<IRunTaskResponse> {
    this.validateJobExists(name);

    const jobInstance = this.jobInstances.get(name);
    if (!jobInstance) {
      this.handleError.notFound('Job instance', name);
    }

    const status = jobInstance.getStatus();

    // Verificar si está habilitado (a menos que se fuerce)
    if (!status.isEnabled && !dto.force) {
      this.handleError.badRequest(
        `La tarea '${name}' está deshabilitada. Use force=true para ejecutar de todos modos.`,
      );
    }

    // Verificar si ya está corriendo
    if (status.isRunning) {
      this.handleError.conflict(`La tarea '${name}' ya está en ejecución`);
    }

    const executionId = this.generateExecutionId();
    const startedAt = new Date();

    this.logger.log(`[${name}] Ejecución manual iniciada (ID: ${executionId}, dryRun: ${dto.dryRun})`);

    // Ejecutar el job
    const result = await jobInstance.execute(dto.dryRun, dto.params);

    // Registrar en historial
    this.recordExecution(name, {
      id: executionId,
      jobName: name,
      status: result.success ? 'completed' : 'failed',
      startedAt,
      completedAt: new Date(),
      duration: result.duration,
      isManual: true,
      triggeredBy,
      result,
      errorMessage: result.error?.message,
    });

    return {
      executionId,
      jobName: name,
      started: true,
      message: result.message,
      startedAt,
      isDryRun: dto.dryRun || false,
      result,
    };
  }

  // ============================================
  // HABILITAR / DESHABILITAR
  // ============================================

  /**
   * Habilita una tarea
   */
  async enableTask(name: string, reason?: string): Promise<IToggleTaskResponse> {
    this.validateJobExists(name);

    const cronJob = this.getCronJob(name);
    if (!cronJob) {
      // El job no está registrado en SchedulerRegistry, solo log
      this.logger.warn(`[${name}] No se encontró CronJob en registry para habilitar`);
    } else {
      cronJob.start();
    }

    const nextRun = cronJob ? cronJob.nextDate().toJSDate() : null;

    this.logger.log(`[${name}] Tarea habilitada${reason ? ` (razón: ${reason})` : ''}`);

    return {
      jobName: name,
      enabled: true,
      previousState: false,
      message: `Tarea '${name}' habilitada exitosamente`,
      nextRun,
    };
  }

  /**
   * Deshabilita una tarea
   */
  async disableTask(name: string, reason?: string): Promise<IToggleTaskResponse> {
    this.validateJobExists(name);

    const cronJob = this.getCronJob(name);
    if (!cronJob) {
      this.logger.warn(`[${name}] No se encontró CronJob en registry para deshabilitar`);
    } else {
      cronJob.stop();
    }

    this.logger.log(`[${name}] Tarea deshabilitada${reason ? ` (razón: ${reason})` : ''}`);

    return {
      jobName: name,
      enabled: false,
      previousState: true,
      message: `Tarea '${name}' deshabilitada exitosamente`,
      nextRun: null,
    };
  }

  // ============================================
  // HISTORIAL
  // ============================================

  /**
   * Obtiene el historial de ejecuciones de una tarea
   */
  async getTaskHistory(name: string, query: QueryTaskHistoryDto): Promise<ITaskHistoryResponse> {
    this.validateJobExists(name);

    let history = this.getJobHistory(name);

    // Aplicar filtros
    if (query.status) {
      history = history.filter((h) => h.status === query.status);
    }

    if (query.manualOnly) {
      history = history.filter((h) => h.isManual);
    }

    if (query.after) {
      const afterDate = new Date(query.after);
      history = history.filter((h) => h.startedAt >= afterDate);
    }

    if (query.before) {
      const beforeDate = new Date(query.before);
      history = history.filter((h) => h.startedAt <= beforeDate);
    }

    // Paginación
    const page = query.page || 1;
    const limit = query.limit || 20;
    const total = history.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedHistory = history.slice(start, start + limit);

    return {
      jobName: name,
      executions: paginatedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene estadísticas globales de todas las tareas
   */
  async getStats(): Promise<ITasksStatsResponse> {
    const byTask: ITasksStatsResponse['byTask'] = {};
    let totalExecutions = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let execLast24h = 0;
    let execLastWeek = 0;
    let execLastMonth = 0;

    for (const jobName of Object.values(JOB_NAMES)) {
      const history = this.getJobHistory(jobName);
      const successful = history.filter((h) => h.status === 'completed').length;
      const failed = history.filter((h) => h.status === 'failed').length;
      const lastExec = history[0];

      byTask[jobName] = {
        totalExecutions: history.length,
        successfulExecutions: successful,
        failedExecutions: failed,
        successRate: history.length > 0 ? (successful / history.length) * 100 : 0,
        lastRun: lastExec?.startedAt || null,
        lastStatus: lastExec?.status || null,
      };

      totalExecutions += history.length;
      totalSuccessful += successful;
      totalFailed += failed;

      // Contar por período
      execLast24h += history.filter((h) => h.startedAt >= last24Hours).length;
      execLastWeek += history.filter((h) => h.startedAt >= lastWeek).length;
      execLastMonth += history.filter((h) => h.startedAt >= lastMonth).length;
    }

    return {
      byTask,
      totals: {
        totalExecutions,
        totalSuccessful,
        totalFailed,
        overallSuccessRate: totalExecutions > 0 ? (totalSuccessful / totalExecutions) * 100 : 0,
      },
      byPeriod: {
        last24Hours: execLast24h,
        lastWeek: execLastWeek,
        lastMonth: execLastMonth,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Obtiene las próximas ejecuciones programadas
   */
  async getNextRuns(): Promise<INextRunsResponse> {
    const nextRuns: INextRunsResponse['nextRuns'] = [];
    const now = new Date();

    for (const jobName of Object.values(JOB_NAMES)) {
      const cronJob = this.getCronJob(jobName);
      const config = DEFAULT_JOB_CONFIG[jobName];

      if (cronJob && this.isCronJobRunning(cronJob)) {
        const nextDate = cronJob.nextDate().toJSDate();
        const timeUntil = nextDate.getTime() - now.getTime();

        nextRuns.push({
          jobName,
          description: config?.description || '',
          nextRun: nextDate,
          timeUntil,
          timeUntilHuman: this.formatDuration(timeUntil),
          cron: config?.cron || '',
        });
      }
    }

    // Ordenar por próxima ejecución
    nextRuns.sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());

    return {
      nextRuns,
      checkedAt: now,
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Obtiene todos los nombres de jobs registrados
   */
  private getAllJobNames(): string[] {
    return Object.values(JOB_NAMES);
  }

  /**
   * Valida que un job existe
   */
  private validateJobExists(name: string): void {
    if (!this.jobInstances.has(name)) {
      this.handleError.notFound('Tarea', name);
    }
  }

  /**
   * Obtiene el CronJob del registry
   */
  private getCronJob(name: string): CronJob | null {
    try {
      return this.schedulerRegistry.getCronJob(name);
    } catch {
      return null;
    }
  }

  /**
   * Obtiene información de una tarea
   */
  private async getTaskInfo(name: string): Promise<ITaskInfo> {
    const jobInstance = this.jobInstances.get(name);
    const status = jobInstance?.getStatus() || { isRunning: false, isEnabled: false };
    const config = DEFAULT_JOB_CONFIG[name as JobName];
    const cronJob = this.getCronJob(name);
    const history = this.getJobHistory(name);
    const lastExec = history[0];

    let jobStatus: JobStatus = JOB_STATUS.ACTIVE;
    if (status.isRunning) {
      jobStatus = JOB_STATUS.RUNNING;
    } else if (!status.isEnabled) {
      jobStatus = JOB_STATUS.DISABLED;
    } else if (lastExec?.status === 'failed') {
      jobStatus = JOB_STATUS.FAILED;
    }

    return {
      name,
      description: config?.description || '',
      status: jobStatus,
      cron: config?.cron || '',
      cronHuman: this.cronToHuman(config?.cron || ''),
      enabled: status.isEnabled,
      nextRun: cronJob && this.isCronJobRunning(cronJob) ? cronJob.nextDate().toJSDate() : null,
      lastRun: lastExec?.startedAt || null,
      lastRunStatus: lastExec?.status === 'completed' ? 'success' : lastExec?.status === 'failed' ? 'failed' : null,
    };
  }

  /**
   * Obtiene la configuración de un job
   */
  private getJobConfig(name: string): ITaskDetailResponse['config'] {
    const jobInstance = this.jobInstances.get(name);
    const status = jobInstance?.getStatus() || {};
    return {
      timeout: TASKS_CONFIG.MAX_EXECUTION_TIME,
      maxRetries: TASKS_CONFIG.MAX_RETRIES,
      retryDelay: TASKS_CONFIG.RETRY_DELAY,
      ...status.config,
    };
  }

  /**
   * Obtiene el historial de un job
   */
  private getJobHistory(name: string): IJobExecutionHistory[] {
    return this.executionHistory.get(name) || [];
  }

  /**
   * Calcula estadísticas de un job
   */
  private calculateJobStats(name: string): ITaskDetailResponse['stats'] {
    const history = this.getJobHistory(name);
    const successful = history.filter((h) => h.status === 'completed');
    const failed = history.filter((h) => h.status === 'failed');
    const durations = history.map((h) => h.duration).filter((d) => d > 0);

    return {
      totalExecutions: history.length,
      successfulExecutions: successful.length,
      failedExecutions: failed.length,
      successRate: history.length > 0 ? (successful.length / history.length) * 100 : 0,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
    };
  }

  /**
   * Registra una ejecución en el historial
   */
  private recordExecution(name: string, record: ExecutionRecord): void {
    const history = this.executionHistory.get(name) || [];
    history.unshift(record);

    // Mantener solo las últimas N ejecuciones
    if (history.length > TASKS_CONFIG.HISTORY_LIMIT) {
      history.pop();
    }

    this.executionHistory.set(name, history);
  }

  /**
   * Genera un ID único para la ejecución
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convierte expresión cron a formato legible
   */
  private cronToHuman(cron: string): string {
    if (!cron) return 'No configurado';

    const cronMap: Record<string, string> = {
      '* * * * *': 'Cada minuto',
      '*/5 * * * *': 'Cada 5 minutos',
      '*/15 * * * *': 'Cada 15 minutos',
      '*/30 * * * *': 'Cada 30 minutos',
      '0 * * * *': 'Cada hora',
      '0 */6 * * *': 'Cada 6 horas',
      '0 */12 * * *': 'Cada 12 horas',
      '0 0 * * *': 'Diario a medianoche',
      '0 2 * * *': 'Diario a las 2 AM',
      '0 3 * * *': 'Diario a las 3 AM',
      '0 4 * * *': 'Diario a las 4 AM',
      '0 6 * * *': 'Diario a las 6 AM',
      '0 2 * * 0': 'Domingos a las 2 AM',
      '0 6 * * 1': 'Lunes a las 6 AM',
      '0 3 1 * *': 'Día 1 de cada mes a las 3 AM',
    };

    return cronMap[cron] || cron;
  }

  /**
   * Verifica si un CronJob está activo/corriendo
   * La propiedad 'running' existe pero no está correctamente tipada en cron v3.x
   */
  private isCronJobRunning(cronJob: CronJob): boolean {
    // En cron v3.x, 'running' es un getter que existe pero TypeScript no lo reconoce
    // Usamos type assertion para acceder de forma segura
    return (cronJob as unknown as { running: boolean }).running ?? false;
  }

  /**
   * Formatea duración en formato legible
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
    return `${Math.round(ms / 86400000)}d`;
  }
}
