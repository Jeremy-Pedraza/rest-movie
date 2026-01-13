import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job, JobStatus as BullJobStatus } from 'bull';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  DEFAULT_JOB_OPTIONS,
  JOB_PRIORITIES,
  JOB_DELAYS,
} from '../queue.constants';
import { ReportJobDataDto, JobOptionsDto } from '../dto';
import { IJobResponse } from '../interfaces';

/**
 * @class ReportProducer
 * @description Producer para encolar jobs de reportes en la cola report-queue
 *
 * Proporciona métodos convenientes para:
 * - Encolar generación de reportes
 * - Programar reportes recurrentes
 * - Exportar reportes a diferentes formatos
 * - Gestión de la cola (stats, clean, pause, resume)
 */
@Injectable()
export class ReportProducer {
  private readonly logger = new Logger(ReportProducer.name);

  constructor(@InjectQueue(QUEUE_NAMES.REPORT) private readonly reportQueue: Queue) {}

  /**
   * Encolar generación de reporte
   * @param data Datos del reporte
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueReport(
    data: ReportJobDataDto,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      priority: JOB_PRIORITIES.NORMAL,
      timeout: 300000, // 5 minutos para reportes
      ...options,
    };

    const job = await this.reportQueue.add(JOB_NAMES.REPORT.GENERATE, data, jobOptions);

    this.logger.log(
      `📊 Reporte encolado: ${job.id} tipo '${data.reportType}' para usuario ${data.userId}`,
    );

    return {
      jobId: job.id,
      jobName: JOB_NAMES.REPORT.GENERATE,
      queueName: QUEUE_NAMES.REPORT,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Encolar reporte con prioridad alta (urgente)
   * @param data Datos del reporte
   * @returns IJobResponse
   */
  async queueReportUrgent(data: ReportJobDataDto): Promise<IJobResponse> {
    return this.queueReport(data, {
      priority: JOB_PRIORITIES.URGENT,
      delay: JOB_DELAYS.IMMEDIATE,
    });
  }

  /**
   * Encolar reporte con delay
   * @param data Datos del reporte
   * @param delayMs Delay en milisegundos
   * @returns IJobResponse
   */
  async queueReportDelayed(data: ReportJobDataDto, delayMs: number): Promise<IJobResponse> {
    return this.queueReport(data, {
      delay: delayMs,
    });
  }

  /**
   * Programar reporte recurrente
   * @param data Datos del reporte
   * @param schedule Configuración de schedule (cron, frequency)
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async scheduleReport(
    data: ReportJobDataDto,
    schedule: { frequency: string; cron?: string },
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      priority: JOB_PRIORITIES.NORMAL,
      ...options,
    };

    const job = await this.reportQueue.add(
      JOB_NAMES.REPORT.SCHEDULE,
      { ...data, schedule: schedule.cron, frequency: schedule.frequency },
      jobOptions,
    );

    this.logger.log(
      `📊 Reporte programado: ${job.id} tipo '${data.reportType}' con frecuencia ${schedule.frequency}`,
    );

    return {
      jobId: job.id,
      jobName: JOB_NAMES.REPORT.SCHEDULE,
      queueName: QUEUE_NAMES.REPORT,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Exportar reporte a formato específico
   * @param reportId ID del reporte
   * @param format Formato de exportación (pdf, excel, csv)
   * @param userId ID del usuario
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async exportReport(
    reportId: string,
    format: string,
    userId: string,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      priority: JOB_PRIORITIES.NORMAL,
      timeout: 180000, // 3 minutos para exportación
      ...options,
    };

    const job = await this.reportQueue.add(
      JOB_NAMES.REPORT.EXPORT,
      { reportId, format, userId },
      jobOptions,
    );

    this.logger.log(`📊 Exportación encolada: ${job.id} reporte ${reportId} a formato ${format}`);

    return {
      jobId: job.id,
      jobName: JOB_NAMES.REPORT.EXPORT,
      queueName: QUEUE_NAMES.REPORT,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Generar reporte mensual de ventas
   * @param userId ID del usuario
   * @param year Año
   * @param month Mes
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueMonthlySalesReport(
    userId: string,
    year: number,
    month: number,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    return this.queueReport(
      {
        reportType: 'monthly_sales',
        userId,
        parameters: { year, month },
        format: 'pdf',
      },
      { priority: JOB_PRIORITIES.NORMAL, ...options },
    );
  }

  /**
   * Generar reporte de usuarios
   * @param userId ID del usuario solicitante
   * @param startDate Fecha inicio
   * @param endDate Fecha fin
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueUsersReport(
    userId: string,
    startDate: string,
    endDate: string,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    return this.queueReport(
      {
        reportType: 'users_report',
        userId,
        parameters: { startDate, endDate },
        format: 'excel',
      },
      { priority: JOB_PRIORITIES.NORMAL, ...options },
    );
  }

  /**
   * Generar reporte de actividad
   * @param userId ID del usuario solicitante
   * @param period Período (day, week, month)
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueActivityReport(
    userId: string,
    period: string,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    return this.queueReport(
      {
        reportType: 'activity_report',
        userId,
        parameters: { period },
        format: 'pdf',
      },
      { priority: JOB_PRIORITIES.LOW, ...options },
    );
  }

  /**
   * Obtener estadísticas de la cola
   * @returns Job counts
   */
  async getQueueStats() {
    return await this.reportQueue.getJobCounts();
  }

  /**
   * Limpiar jobs completados
   * @param grace Período de gracia en milisegundos
   * @returns Array de job IDs eliminados
   */
  async cleanCompleted(grace: number = 3600000) {
    const cleaned = await this.reportQueue.clean(grace, 'completed');
    this.logger.log(`🧹 ${cleaned.length} reportes completados limpiados (grace: ${grace}ms)`);
    return cleaned;
  }

  /**
   * Limpiar jobs fallidos
   * @param grace Período de gracia en milisegundos
   * @returns Array de job IDs eliminados
   */
  async cleanFailed(grace: number = 86400000) {
    const cleaned = await this.reportQueue.clean(grace, 'failed');
    this.logger.log(`🧹 ${cleaned.length} reportes fallidos limpiados (grace: ${grace}ms)`);
    return cleaned;
  }

  /**
   * Pausar la cola
   * @returns true si se pausó correctamente
   */
  async pause(): Promise<boolean> {
    await this.reportQueue.pause();
    this.logger.warn(`⏸️ Cola de reportes pausada`);
    return true;
  }

  /**
   * Reanudar la cola
   * @returns true si se reanudó correctamente
   */
  async resume(): Promise<boolean> {
    await this.reportQueue.resume();
    this.logger.log(`▶️ Cola de reportes reanudada`);
    return true;
  }

  /**
   * Vaciar la cola (eliminar todos los jobs)
   * @returns true si se vació correctamente
   */
  async empty(): Promise<boolean> {
    await this.reportQueue.empty();
    this.logger.warn(`🗑️ Cola de reportes vaciada completamente`);
    return true;
  }

  /**
   * Verificar si la cola está pausada
   * @returns true si está pausada
   */
  async isPaused(): Promise<boolean> {
    return await this.reportQueue.isPaused();
  }

  /**
   * Obtener jobs por estado
   * @param status Estado de los jobs
   * @param start Índice inicial
   * @param end Índice final
   * @returns Array de jobs
   */
  async getJobs(status: BullJobStatus, start: number = 0, end: number = 10): Promise<Job[]> {
    return await this.reportQueue.getJobs([status], start, end);
  }

  /**
   * Obtener un job por ID
   * @param jobId ID del job
   * @returns Job o null
   */
  async getJob(jobId: string | number) {
    return await this.reportQueue.getJob(jobId);
  }
}
