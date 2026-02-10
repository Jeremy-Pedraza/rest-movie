import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HandleErrorService } from '@shared/common/handle-error.service';
import { SanitizerService } from '@shared/common/sanitizer.service';
import { JobStatus as BullJobStatus, Job, JobCounts, JobStatusClean, Queue } from 'bull';
import { AddJobDto, CleanJobsDto, JobStatus, QueryJobDto } from './dto';
import {
  IAllQueuesStatsResponse,
  ICleanJobsResponse,
  IJobDetailResponse,
  IJobResponse,
  IJobsListResponse,
  IPauseQueueResponse,
  IQueueHealthResponse,
  IQueueMetrics,
  IQueueStats,
  IRemoveJobResponse,
  IRetryJobResponse,
} from './interfaces';
import { DEFAULT_JOB_OPTIONS, QUEUE_NAMES } from './queue.constants';

/**
 * @class QueueService
 * @description Servicio central para gestión de colas Bull
 *
 * Características:
 * - Gestión de múltiples colas (email, notification, report)
 * - CRUD de jobs (agregar, obtener, eliminar, reintentar)
 * - Estadísticas y métricas por cola
 * - Health checks de colas
 * - Pausar/reanudar colas
 * - Limpieza de jobs antiguos
 */
@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private queues: Map<string, Queue> = new Map();

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.REPORT) private readonly reportQueue: Queue,
    private readonly configService: ConfigService,
    private readonly sanitizer: SanitizerService,
    private readonly handleError: HandleErrorService,
  ) {}

  /**
   * Inicialización del módulo
   * Registra las colas en el Map para acceso rápido
   */
  onModuleInit(): void {
    this.queues.set(QUEUE_NAMES.EMAIL, this.emailQueue);
    this.queues.set(QUEUE_NAMES.NOTIFICATION, this.notificationQueue);
    this.queues.set(QUEUE_NAMES.REPORT, this.reportQueue);

    this.logger.log(`✅ QueueService initialized with ${this.queues.size} queues`);
    this.logger.log(`📋 Available queues: ${Array.from(this.queues.keys()).join(', ')}`);
  }

  /**
   * Obtener una cola por nombre
   * @param queueName Nombre de la cola
   * @returns Queue instance
   */
  private getQueue(queueName: string): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) {
      this.handleError.badRequest(`Cola '${queueName}' no encontrada`);
    }
    return queue;
  }

  /**
   * Agregar un job a la cola
   * @param queueName Nombre de la cola
   * @param dto Datos del job
   * @returns IJobResponse
   */
  async addJob<T = any>(queueName: string, dto: AddJobDto<T>): Promise<IJobResponse> {
    const queue = this.getQueue(queueName);

    // Sanitizar nombre del job
    const sanitizedJobName = this.sanitizer.sanitizeString(dto.jobName);

    // Sanitizar datos si son strings
    const sanitizedData = this.sanitizeJobData(dto.data);

    // Merge opciones con defaults
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...dto.options,
    };

    // Agregar job a la cola
    const job = await queue.add(sanitizedJobName, sanitizedData, jobOptions);

    this.logger.log(
      `✅ Job agregado: ${job.id} (${sanitizedJobName}) en ${queueName} con prioridad ${jobOptions.priority}`,
    );

    return {
      jobId: job.id,
      jobName: sanitizedJobName,
      queueName,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Obtener estadísticas de una cola
   * @param queueName Nombre de la cola
   * @returns IQueueStats
   */
  async getQueueStats(queueName: string): Promise<IQueueStats> {
    const queue = this.getQueue(queueName);

    const counts: JobCounts = await queue.getJobCounts();

    return {
      queueName,
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: (counts as any).paused || 0,
      total:
        (counts.waiting || 0) +
        (counts.active || 0) +
        (counts.completed || 0) +
        (counts.failed || 0) +
        (counts.delayed || 0),
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Obtener estadísticas de todas las colas
   * @returns IAllQueuesStatsResponse
   */
  async getAllQueuesStats(): Promise<IAllQueuesStatsResponse> {
    const queuesStats: IQueueStats[] = [];
    let totalWaiting = 0;
    let totalActive = 0;
    let totalCompleted = 0;
    let totalFailed = 0;
    let totalDelayed = 0;

    for (const queueName of this.queues.keys()) {
      const stats = await this.getQueueStats(queueName);
      queuesStats.push(stats);

      totalWaiting += stats.waiting;
      totalActive += stats.active;
      totalCompleted += stats.completed;
      totalFailed += stats.failed;
      totalDelayed += stats.delayed;
    }

    return {
      totalQueues: this.queues.size,
      queues: queuesStats,
      summary: {
        totalWaiting,
        totalActive,
        totalCompleted,
        totalFailed,
        totalDelayed,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtener detalles de un job
   * @param queueName Nombre de la cola
   * @param jobId ID del job
   * @returns IJobDetailResponse
   */
  async getJob(queueName: string, jobId: string | number): Promise<IJobDetailResponse> {
    const queue = this.getQueue(queueName);

    const job = await queue.getJob(jobId);
    if (!job) {
      this.handleError.notFound('Job', jobId.toString());
    }

    const state = await job.getState();
    const progress = await job.progress();

    return {
      queueName,
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      state,
      progress: progress || 0,
      delay: job.opts.delay,
      priority: job.opts.priority,
    };
  }

  /**
   * Listar jobs de una cola con filtros
   * @param queueName Nombre de la cola
   * @param query Filtros de búsqueda
   * @returns IJobsListResponse
   */
  async listJobs(queueName: string, query: QueryJobDto): Promise<IJobsListResponse> {
    const queue = this.getQueue(queueName);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Obtener jobs según el estado
    let jobs: Job[] = [];
    let total = 0;

    if (query.status) {
      // Si se especifica un estado, obtener solo esos jobs
      const statusMap: Record<JobStatus, any> = {
        [JobStatus.WAITING]: 'waiting',
        [JobStatus.ACTIVE]: 'active',
        [JobStatus.COMPLETED]: 'completed',
        [JobStatus.FAILED]: 'failed',
        [JobStatus.DELAYED]: 'delayed',
        [JobStatus.PAUSED]: 'paused',
      };

      const bullStatus = statusMap[query.status];
      jobs = await queue.getJobs([bullStatus as BullJobStatus], start, end);
      const counts = await queue.getJobCounts();
      total = (counts as unknown as Record<string, number>)[bullStatus] || 0;
    } else {
      // Si no se especifica estado, obtener todos
      const types: BullJobStatus[] = [
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused',
      ];
      jobs = await queue.getJobs(types, start, end);
      const counts = await queue.getJobCounts();
      total =
        (counts.waiting || 0) +
        (counts.active || 0) +
        (counts.completed || 0) +
        (counts.failed || 0) +
        (counts.delayed || 0) +
        ((counts as any).paused || 0);
    }

    // Filtrar por nombre si se especifica
    if (query.jobName) {
      const sanitizedName = this.sanitizer.sanitizeString(query.jobName);
      jobs = jobs.filter((job) => job.name === sanitizedName);
      total = jobs.length;
    }

    // Mapear jobs a IJobDetailResponse
    const jobsDetails: IJobDetailResponse[] = await Promise.all(
      jobs.map(async (job) => {
        const state = await job.getState();
        const progress = await job.progress();

        return {
          queueName,
          id: job.id,
          name: job.name,
          data: job.data,
          opts: job.opts,
          timestamp: job.timestamp,
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason,
          stacktrace: job.stacktrace,
          returnvalue: job.returnvalue,
          finishedOn: job.finishedOn,
          processedOn: job.processedOn,
          state,
          progress: progress || 0,
          delay: job.opts.delay,
          priority: job.opts.priority,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      jobs: jobsDetails,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Eliminar un job
   * @param queueName Nombre de la cola
   * @param jobId ID del job
   * @returns IRemoveJobResponse
   */
  async removeJob(queueName: string, jobId: string | number): Promise<IRemoveJobResponse> {
    const queue = this.getQueue(queueName);

    const job = await queue.getJob(jobId);
    if (!job) {
      this.handleError.notFound('Job', jobId.toString());
    }

    await job.remove();

    this.logger.log(`🗑️ Job eliminado: ${jobId} de ${queueName}`);

    return {
      jobId,
      queueName,
      removed: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reintentar un job fallido
   * @param queueName Nombre de la cola
   * @param jobId ID del job
   * @returns IRetryJobResponse
   */
  async retryJob(queueName: string, jobId: string | number): Promise<IRetryJobResponse> {
    const queue = this.getQueue(queueName);

    const job = await queue.getJob(jobId);
    if (!job) {
      this.handleError.notFound('Job', jobId.toString());
    }

    const state = await job.getState();
    if (state !== 'failed') {
      this.handleError.badRequest(
        `Job ${jobId} no está en estado fallido (estado actual: ${state})`,
      );
    }

    await job.retry();

    this.logger.log(`🔄 Job reintentado: ${jobId} en ${queueName}`);

    return {
      jobId,
      queueName,
      status: 'retrying',
      retriedAt: new Date().toISOString(),
      newAttempt: job.attemptsMade + 1,
    };
  }

  /**
   * Limpiar jobs de una cola
   * @param queueName Nombre de la cola
   * @param dto Opciones de limpieza
   * @returns ICleanJobsResponse
   */
  async cleanJobs(queueName: string, dto: CleanJobsDto): Promise<ICleanJobsResponse> {
    const queue = this.getQueue(queueName);

    const status = dto.status || 'completed';
    const grace = dto.grace;
    const limit = dto.limit;

    // Bull clean method: clean(grace, status, limit)
    // Cast seguro: el DTO ya valida que status sea un JobStatusClean válido
    const cleaned = await queue.clean(grace, status as JobStatusClean, limit);

    this.logger.log(`🧹 Limpieza de ${queueName}: ${cleaned.length} jobs ${status} eliminados`);

    return {
      queueName,
      status,
      cleaned: cleaned.length,
      grace,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Pausar una cola
   * @param queueName Nombre de la cola
   * @returns IPauseQueueResponse
   */
  async pauseQueue(queueName: string): Promise<IPauseQueueResponse> {
    const queue = this.getQueue(queueName);

    await queue.pause();

    this.logger.warn(`⏸️ Cola pausada: ${queueName}`);

    return {
      queueName,
      action: 'paused',
      timestamp: new Date().toISOString(),
      isPaused: await queue.isPaused(),
    };
  }

  /**
   * Reanudar una cola pausada
   * @param queueName Nombre de la cola
   * @returns IPauseQueueResponse
   */
  async resumeQueue(queueName: string): Promise<IPauseQueueResponse> {
    const queue = this.getQueue(queueName);

    await queue.resume();

    this.logger.log(`▶️ Cola reanudada: ${queueName}`);

    return {
      queueName,
      action: 'resumed',
      timestamp: new Date().toISOString(),
      isPaused: await queue.isPaused(),
    };
  }

  /**
   * Vaciar una cola (eliminar todos los jobs)
   * @param queueName Nombre de la cola
   * @returns { emptied: boolean }
   */
  async emptyQueue(queueName: string): Promise<{ queueName: string; emptied: boolean }> {
    const queue = this.getQueue(queueName);

    await queue.empty();

    this.logger.warn(`🗑️ Cola vaciada: ${queueName}`);

    return {
      queueName,
      emptied: true,
    };
  }

  /**
   * Health check de una cola
   * @param queueName Nombre de la cola
   * @returns IQueueHealthResponse
   */
  async checkHealth(queueName: string): Promise<IQueueHealthResponse> {
    const queue = this.getQueue(queueName);

    let isHealthy = true;
    let redisConnected = true;

    try {
      // Verificar conexión a Redis haciendo ping
      await queue.client.ping();
      redisConnected = true;
    } catch {
      redisConnected = false;
      isHealthy = false;
    }

    const stats = await this.getQueueStats(queueName);

    // Considerar unhealthy si hay muchos jobs fallidos
    if (stats.failed > 100) {
      isHealthy = false;
    }

    // Considerar unhealthy si hay jobs activos estancados
    if (stats.active > 50) {
      isHealthy = false;
    }

    const redisOptions = queue.client.options as any;

    return {
      queueName,
      isHealthy,
      redis: {
        connected: redisConnected,
        host: redisOptions.host || 'localhost',
        port: redisOptions.port || 6379,
      },
      stats,
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * Obtener métricas avanzadas de una cola
   * @param queueName Nombre de la cola
   * @returns IQueueMetrics
   */
  async getMetrics(queueName: string): Promise<IQueueMetrics> {
    const queue = this.getQueue(queueName);

    // Obtener jobs completados recientes (Bull 4.x usa getJobs en lugar de getCompleted)
    const completedJobs: Job<unknown>[] = await queue.getJobs(['completed'], 0, 99);

    // Calcular métricas de throughput
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    const jobsLastHour = completedJobs.filter(
      (job: Job<unknown>) => job.finishedOn && job.finishedOn > oneHourAgo,
    ).length;
    const jobsLastDay = completedJobs.filter(
      (job: Job<unknown>) => job.finishedOn && job.finishedOn > oneDayAgo,
    ).length;

    // Calcular tiempos de procesamiento
    const processingTimes: number[] = completedJobs
      .filter((job: Job<unknown>) => job.finishedOn && job.processedOn)
      .map((job: Job<unknown>) => job.finishedOn! - job.processedOn!);

    const averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((a: number, b: number) => a + b, 0) / processingTimes.length
        : 0;

    const sortedTimes = [...processingTimes].sort((a: number, b: number) => a - b);
    const medianProcessingTime =
      sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length / 2)] : 0;

    const slowestJob = completedJobs.reduce(
      (slowest: { id: string | number; duration: number }, job: Job<unknown>) => {
        if (job.finishedOn && job.processedOn) {
          const duration = job.finishedOn - job.processedOn;
          if (duration > slowest.duration) {
            return { id: job.id, duration };
          }
        }
        return slowest;
      },
      { id: 0, duration: 0 },
    );

    const fastestJob = completedJobs.reduce(
      (fastest: { id: string | number; duration: number }, job: Job<unknown>) => {
        if (job.finishedOn && job.processedOn) {
          const duration = job.finishedOn - job.processedOn;
          if (duration < fastest.duration || fastest.duration === Infinity) {
            return { id: job.id, duration };
          }
        }
        return fastest;
      },
      { id: 0, duration: Infinity },
    );

    // Calcular tasas de confiabilidad
    const stats = await this.getQueueStats(queueName);
    const totalProcessed = stats.completed + stats.failed;
    const successRate = totalProcessed > 0 ? (stats.completed / totalProcessed) * 100 : 100;
    const failureRate = totalProcessed > 0 ? (stats.failed / totalProcessed) * 100 : 0;
    const retryRate = 0; // TODO: Calcular basado en attemptsMade

    return {
      queueName,
      throughput: {
        lastHour: jobsLastHour,
        lastDay: jobsLastDay,
        average: jobsLastDay / 24, // Promedio por hora
      },
      performance: {
        averageProcessingTime,
        medianProcessingTime,
        slowestJob: {
          id: slowestJob.id,
          duration: slowestJob.duration,
        },
        fastestJob: {
          id: fastestJob.id === 0 ? 0 : fastestJob.id,
          duration: fastestJob.duration === Infinity ? 0 : fastestJob.duration,
        },
      },
      reliability: {
        successRate,
        failureRate,
        retryRate,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Sanitizar datos del job recursivamente
   * @param data Datos a sanitizar
   * @returns Datos sanitizados
   */
  private sanitizeJobData(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.sanitizer.sanitizeString(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeJobData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          sanitized[key] = this.sanitizeJobData((data as Record<string, unknown>)[key]);
        }
      }
      return sanitized;
    }

    return data;
  }
}
