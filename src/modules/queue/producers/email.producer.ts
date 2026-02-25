import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { JobStatus as BullJobStatus, Job, Queue } from 'bull';
import { LoggerService, LogContext } from '@modules/logger';
import { EmailJobDataDto, JobOptionsDto } from '../dto';
import { IJobResponse } from '../interfaces';
import {
  DEFAULT_JOB_OPTIONS,
  JOB_DELAYS,
  JOB_NAMES,
  JOB_PRIORITIES,
  QUEUE_NAMES,
} from '../queue.constants';

/**
 * @class EmailProducer
 * @description Producer para encolar jobs de email en la cola email-queue
 *
 * Proporciona métodos convenientes para:
 * - Encolar emails individuales
 * - Encolar emails en lote
 * - Encolar emails con templates
 * - Gestión de la cola (stats, clean, pause, resume)
 */
@Injectable()
export class EmailProducer {
  private readonly logger = new Logger(EmailProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Encolar email individual
   * @param data Datos del email
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueEmail(data: EmailJobDataDto, options?: Partial<JobOptionsDto>): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.emailQueue.add(JOB_NAMES.EMAIL.SEND, data, jobOptions);

    this.logger.log(
      `📧 Email encolado: ${job.id} para ${data.to} con prioridad ${jobOptions.priority}`,
    );

    return {
      jobId: job.id,
      jobName: JOB_NAMES.EMAIL.SEND,
      queueName: QUEUE_NAMES.EMAIL,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Encolar email con prioridad alta
   * @param data Datos del email
   * @returns IJobResponse
   */
  async queueEmailUrgent(data: EmailJobDataDto): Promise<IJobResponse> {
    return this.queueEmail(data, {
      priority: JOB_PRIORITIES.URGENT,
      delay: JOB_DELAYS.IMMEDIATE,
    });
  }

  /**
   * Encolar email con delay
   * @param data Datos del email
   * @param delayMs Delay en milisegundos
   * @returns IJobResponse
   */
  async queueEmailDelayed(data: EmailJobDataDto, delayMs: number): Promise<IJobResponse> {
    return this.queueEmail(data, {
      delay: delayMs,
    });
  }

  /**
   * Encolar lote de emails
   * @param emails Array de datos de emails
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueEmailBatch(
    emails: EmailJobDataDto[],
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.emailQueue.add(JOB_NAMES.EMAIL.SEND_BATCH, { emails }, jobOptions);

    this.logger.log(
      `📧 Lote de ${emails.length} emails encolado: ${job.id} con prioridad ${jobOptions.priority}`,
    );

    return {
      jobId: job.id,
      jobName: JOB_NAMES.EMAIL.SEND_BATCH,
      queueName: QUEUE_NAMES.EMAIL,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Encolar email con template
   * @param data Datos del email con template
   * @param templateName Nombre del template
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueEmailTemplate(
    data: EmailJobDataDto,
    templateName: string,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.emailQueue.add(
      JOB_NAMES.EMAIL.SEND_TEMPLATE,
      { ...data, templateName },
      jobOptions,
    );

    this.logger.log(`📧 Email con template '${templateName}' encolado: ${job.id} para ${data.to}`);

    return {
      jobId: job.id,
      jobName: JOB_NAMES.EMAIL.SEND_TEMPLATE,
      queueName: QUEUE_NAMES.EMAIL,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Obtener estadísticas de la cola
   * @returns Job counts
   */
  async getQueueStats() {
    return await this.emailQueue.getJobCounts();
  }

  /**
   * Limpiar jobs completados
   * @param grace Período de gracia en milisegundos
   * @returns Array de job IDs eliminados
   */
  async cleanCompleted(grace: number = 3600000) {
    const cleaned = await this.emailQueue.clean(grace, 'completed');
    this.logger.log(`🧹 ${cleaned.length} emails completados limpiados (grace: ${grace}ms)`);
    return cleaned;
  }

  /**
   * Limpiar jobs fallidos
   * @param grace Período de gracia en milisegundos
   * @returns Array de job IDs eliminados
   */
  async cleanFailed(grace: number = 86400000) {
    const cleaned = await this.emailQueue.clean(grace, 'failed');
    this.logger.log(`🧹 ${cleaned.length} emails fallidos limpiados (grace: ${grace}ms)`);
    return cleaned;
  }

  /**
   * Pausar la cola
   * @returns true si se pausó correctamente
   */
  async pause(): Promise<boolean> {
    await this.emailQueue.pause();
    this.logWarn(`⏸️ Cola de emails pausada`);
    return true;
  }

  /**
   * Reanudar la cola
   * @returns true si se reanudó correctamente
   */
  async resume(): Promise<boolean> {
    await this.emailQueue.resume();
    this.logger.log(`▶️ Cola de emails reanudada`);
    return true;
  }

  /**
   * Vaciar la cola (eliminar todos los jobs)
   * @returns true si se vació correctamente
   */
  async empty(): Promise<boolean> {
    await this.emailQueue.empty();
    this.logWarn(`🗑️ Cola de emails vaciada completamente`);
    return true;
  }

  /**
   * Verificar si la cola está pausada
   * @returns true si está pausada
   */
  async isPaused(): Promise<boolean> {
    return await this.emailQueue.isPaused();
  }

  /**
   * Obtener jobs por estado
   * @param status Estado de los jobs
   * @param start Índice inicial
   * @param end Índice final
   * @returns Array de jobs
   */
  async getJobs(status: BullJobStatus, start: number = 0, end: number = 10): Promise<Job[]> {
    return await this.emailQueue.getJobs([status], start, end);
  }

  /**
   * Obtener un job por ID
   * @param jobId ID del job
   * @returns Job o null
   */
  async getJob(jobId: string | number) {
    return await this.emailQueue.getJob(jobId);
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.QUEUE,
      service: EmailProducer.name,
    });
  }

  private logError(message: string): void {
    this.logger.error(message);
    void this.loggerService?.error(message, {
      context: LogContext.QUEUE,
      service: EmailProducer.name,
    });
  }
}

