import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { JobStatus as BullJobStatus, Job, Queue } from 'bull';
import { LoggerService, LogContext } from '@modules/logger';
import { JobOptionsDto, NotificationJobDataDto } from '../dto';
import { IJobResponse } from '../interfaces';
import {
  DEFAULT_JOB_OPTIONS,
  JOB_DELAYS,
  JOB_NAMES,
  JOB_PRIORITIES,
  QUEUE_NAMES,
} from '../queue.constants';

/**
 * @class NotificationProducer
 * @description Producer para encolar jobs de notificaciones en la cola notification-queue
 *
 * Proporciona métodos convenientes para:
 * - Encolar notificaciones individuales
 * - Encolar notificaciones multi-canal
 * - Encolar notificaciones en lote
 * - Gestión de la cola (stats, clean, pause, resume)
 */
@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Encolar notificación individual
   * @param data Datos de la notificación
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueNotification(
    data: NotificationJobDataDto,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.notificationQueue.add(JOB_NAMES.NOTIFICATION.SEND, data, jobOptions);

    this.logger.log(
      `🔔 Notificación encolada: ${job.id} tipo '${data.type}' para usuario ${data.recipientId}`,
    );

    return {
      jobId: job.id,
      jobName: JOB_NAMES.NOTIFICATION.SEND,
      queueName: QUEUE_NAMES.NOTIFICATION,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Encolar notificación con prioridad alta
   * @param data Datos de la notificación
   * @returns IJobResponse
   */
  async queueNotificationUrgent(data: NotificationJobDataDto): Promise<IJobResponse> {
    return this.queueNotification(data, {
      priority: JOB_PRIORITIES.URGENT,
      delay: JOB_DELAYS.IMMEDIATE,
    });
  }

  /**
   * Encolar notificación con delay
   * @param data Datos de la notificación
   * @param delayMs Delay en milisegundos
   * @returns IJobResponse
   */
  async queueNotificationDelayed(
    data: NotificationJobDataDto,
    delayMs: number,
  ): Promise<IJobResponse> {
    return this.queueNotification(data, {
      delay: delayMs,
    });
  }

  /**
   * Encolar notificación multi-canal
   * @param data Datos de la notificación
   * @param channels Array de canales (email, push, sms)
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueNotificationMulti(
    data: NotificationJobDataDto,
    channels: string[],
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.notificationQueue.add(
      JOB_NAMES.NOTIFICATION.SEND_MULTI,
      { ...data, channels },
      jobOptions,
    );

    this.logger.log(
      `🔔 Notificación multi-canal encolada: ${job.id} (${channels.join(', ')}) para usuario ${data.recipientId}`,
    );

    return {
      jobId: job.id,
      jobName: JOB_NAMES.NOTIFICATION.SEND_MULTI,
      queueName: QUEUE_NAMES.NOTIFICATION,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Encolar lote de notificaciones
   * @param notifications Array de datos de notificaciones
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueNotificationBatch(
    notifications: NotificationJobDataDto[],
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    const jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    const job = await this.notificationQueue.add(
      JOB_NAMES.NOTIFICATION.SEND_BATCH,
      { notifications },
      jobOptions,
    );

    this.logger.log(`🔔 Lote de ${notifications.length} notificaciones encolado: ${job.id}`);

    return {
      jobId: job.id,
      jobName: JOB_NAMES.NOTIFICATION.SEND_BATCH,
      queueName: QUEUE_NAMES.NOTIFICATION,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      priority: jobOptions.priority,
      delay: jobOptions.delay,
      attempts: jobOptions.attempts,
    };
  }

  /**
   * Encolar notificación de bienvenida
   * @param recipientId ID del usuario
   * @param userName Nombre del usuario
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueWelcomeNotification(
    recipientId: string,
    userName: string,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    return this.queueNotification(
      {
        type: 'welcome',
        recipientId,
        title: `¡Bienvenido ${userName}!`,
        message: 'Tu cuenta ha sido creada exitosamente. Comienza a explorar ahora.',
        data: { userName },
      },
      { priority: JOB_PRIORITIES.HIGH, ...options },
    );
  }

  /**
   * Encolar notificación de confirmación
   * @param recipientId ID del usuario
   * @param title Título de la notificación
   * @param message Mensaje de la notificación
   * @param options Opciones del job (opcional)
   * @returns IJobResponse
   */
  async queueConfirmationNotification(
    recipientId: string,
    title: string,
    message: string,
    options?: Partial<JobOptionsDto>,
  ): Promise<IJobResponse> {
    return this.queueNotification(
      {
        type: 'confirmation',
        recipientId,
        title,
        message,
      },
      { priority: JOB_PRIORITIES.NORMAL, ...options },
    );
  }

  /**
   * Obtener estadísticas de la cola
   * @returns Job counts
   */
  async getQueueStats() {
    return await this.notificationQueue.getJobCounts();
  }

  /**
   * Limpiar jobs completados
   * @param grace Período de gracia en milisegundos
   * @returns Array de job IDs eliminados
   */
  async cleanCompleted(grace: number = 3600000) {
    const cleaned = await this.notificationQueue.clean(grace, 'completed');
    this.logger.log(
      `🧹 ${cleaned.length} notificaciones completadas limpiadas (grace: ${grace}ms)`,
    );
    return cleaned;
  }

  /**
   * Limpiar jobs fallidos
   * @param grace Período de gracia en milisegundos
   * @returns Array de job IDs eliminados
   */
  async cleanFailed(grace: number = 86400000) {
    const cleaned = await this.notificationQueue.clean(grace, 'failed');
    this.logger.log(`🧹 ${cleaned.length} notificaciones fallidas limpiadas (grace: ${grace}ms)`);
    return cleaned;
  }

  /**
   * Pausar la cola
   * @returns true si se pausó correctamente
   */
  async pause(): Promise<boolean> {
    await this.notificationQueue.pause();
    this.logWarn(`⏸️ Cola de notificaciones pausada`);
    return true;
  }

  /**
   * Reanudar la cola
   * @returns true si se reanudó correctamente
   */
  async resume(): Promise<boolean> {
    await this.notificationQueue.resume();
    this.logger.log(`▶️ Cola de notificaciones reanudada`);
    return true;
  }

  /**
   * Vaciar la cola (eliminar todos los jobs)
   * @returns true si se vació correctamente
   */
  async empty(): Promise<boolean> {
    await this.notificationQueue.empty();
    this.logWarn(`🗑️ Cola de notificaciones vaciada completamente`);
    return true;
  }

  /**
   * Verificar si la cola está pausada
   * @returns true si está pausada
   */
  async isPaused(): Promise<boolean> {
    return await this.notificationQueue.isPaused();
  }

  /**
   * Obtener jobs por estado
   * @param status Estado de los jobs
   * @param start Índice inicial
   * @param end Índice final
   * @returns Array de jobs
   */
  async getJobs(status: BullJobStatus, start: number = 0, end: number = 10): Promise<Job[]> {
    return await this.notificationQueue.getJobs([status], start, end);
  }

  /**
   * Obtener un job por ID
   * @param jobId ID del job
   * @returns Job o null
   */
  async getJob(jobId: string | number) {
    return await this.notificationQueue.getJob(jobId);
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.QUEUE,
      service: NotificationProducer.name,
    });
  }

  private logError(message: string): void {
    this.logger.error(message);
    void this.loggerService?.error(message, {
      context: LogContext.QUEUE,
      service: NotificationProducer.name,
    });
  }
}
