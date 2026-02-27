/**
 * @fileoverview Productor de jobs de notificaciones (Bull)
 * @module modules/notification/producers
 *
 * Crea y encola jobs de notificaciones para procesamiento asíncrono
 */

import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { JobOptions, Queue } from 'bull';
import { LoggerService, LogContext } from '@modules/logger';

// DTOs
import { SendEmailDto, SendNotificationDto, SendPushDto, SendSmsDto } from '../dto';

// Templates
import {
  INotificationEmailData,
  IResetPasswordEmailData,
  IVerifyEmailData,
  IWelcomeEmailData,
} from '../templates';

// Processor types
import {
  IBatchJobData,
  IEmailJobData,
  IMultiChannelJobData,
  INotificationEmailJobData,
  IPushJobData,
  IResetPasswordEmailJobData,
  ISmsJobData,
  IVerifyEmailJobData,
  IWelcomeEmailJobData,
  NotificationJobType,
} from '../processors/notification.processor';

/**
 * Opciones de configuración para jobs
 */
export interface INotificationJobOptions extends JobOptions {
  /** Prioridad del job (1-10, mayor = más prioritario) */
  priority?: number;
  /** Delay en ms antes de procesar */
  delay?: number;
  /** Intentos máximos */
  attempts?: number;
  /** Backoff entre reintentos */
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  /** Remover job al completar */
  removeOnComplete?: boolean | number;
  /** Remover job al fallar */
  removeOnFail?: boolean | number;
}

/**
 * Productor de jobs de notificaciones
 *
 * Características:
 * - Creación de jobs asíncronos
 * - Configuración de retry
 * - Priorización de jobs
 * - Delay/scheduling de jobs
 */
@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  /**
   * Opciones por defecto para jobs
   */
  private readonly defaultJobOptions: INotificationJobOptions = {
    attempts: 3, // 3 intentos
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s
    },
    removeOnComplete: 100, // Mantener últimos 100 completados
    removeOnFail: false, // No remover fallidos (para debugging)
  };

  constructor(
    @InjectQueue('notifications')
    private readonly notificationQueue: Queue,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  // ============================================
  // JOBS INDIVIDUALES
  // ============================================

  /**
   * Encolar job de envío de email
   *
   * @param dto - Datos del email
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueEmail(dto: SendEmailDto, options?: INotificationJobOptions): Promise<string> {
    const jobData: IEmailJobData = {
      type: NotificationJobType.SEND_EMAIL,
      data: dto,
    };

    const job = await this.notificationQueue.add(NotificationJobType.SEND_EMAIL, jobData, {
      ...this.defaultJobOptions,
      ...options,
    });

    this.logger.log(`Email job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  /**
   * Encolar job de envío de SMS
   *
   * @param dto - Datos del SMS
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueSms(dto: SendSmsDto, options?: INotificationJobOptions): Promise<string> {
    const jobData: ISmsJobData = {
      type: NotificationJobType.SEND_SMS,
      data: dto,
    };

    const job = await this.notificationQueue.add(NotificationJobType.SEND_SMS, jobData, {
      ...this.defaultJobOptions,
      ...options,
    });

    this.logger.log(`SMS job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  /**
   * Encolar job de envío de push notification
   *
   * @param dto - Datos del push
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queuePush(dto: SendPushDto, options?: INotificationJobOptions): Promise<string> {
    const jobData: IPushJobData = {
      type: NotificationJobType.SEND_PUSH,
      data: dto,
    };

    const job = await this.notificationQueue.add(NotificationJobType.SEND_PUSH, jobData, {
      ...this.defaultJobOptions,
      ...options,
    });

    this.logger.log(`Push job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  /**
   * Encolar job de envío multi-canal
   *
   * @param dto - Datos multi-canal
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueMultiChannel(
    dto: SendNotificationDto,
    options?: INotificationJobOptions,
  ): Promise<string> {
    const jobData: IMultiChannelJobData = {
      type: NotificationJobType.SEND_MULTI,
      data: dto,
    };

    const job = await this.notificationQueue.add(NotificationJobType.SEND_MULTI, jobData, {
      ...this.defaultJobOptions,
      ...options,
    });

    this.logger.log(`Multi-channel job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  // ============================================
  // JOBS DE BATCH
  // ============================================

  /**
   * Encolar job de envío en batch
   *
   * @param data - Datos del batch
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueBatch(
    data: {
      emails?: SendEmailDto[];
      sms?: SendSmsDto[];
      push?: SendPushDto[];
    },
    options?: INotificationJobOptions,
  ): Promise<string> {
    const jobData: IBatchJobData = {
      type: NotificationJobType.SEND_BATCH,
      data,
    };

    const totalItems =
      (data.emails?.length || 0) + (data.sms?.length || 0) + (data.push?.length || 0);

    const job = await this.notificationQueue.add(NotificationJobType.SEND_BATCH, jobData, {
      ...this.defaultJobOptions,
      ...options,
    });

    this.logger.log(`Batch job queued with ID: ${job.id}, items: ${totalItems}`);

    return job.id.toString();
  }

  // ============================================
  // JOBS DE TEMPLATES
  // ============================================

  /**
   * Encolar job de email de bienvenida
   *
   * @param to - Email destinatario
   * @param templateData - Datos del template
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueWelcomeEmail(
    to: string,
    templateData: IWelcomeEmailData,
    options?: INotificationJobOptions,
  ): Promise<string> {
    const jobData: IWelcomeEmailJobData = {
      type: NotificationJobType.SEND_WELCOME_EMAIL,
      data: {
        to,
        templateData,
      },
    };

    const job = await this.notificationQueue.add(NotificationJobType.SEND_WELCOME_EMAIL, jobData, {
      ...this.defaultJobOptions,
      priority: 5, // Mayor prioridad para welcome emails
      ...options,
    });

    this.logger.log(`Welcome email job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  /**
   * Encolar job de email de reset de contraseña
   *
   * @param to - Email destinatario
   * @param templateData - Datos del template
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueResetPasswordEmail(
    to: string,
    templateData: IResetPasswordEmailData,
    options?: INotificationJobOptions,
  ): Promise<string> {
    const jobData: IResetPasswordEmailJobData = {
      type: NotificationJobType.SEND_RESET_PASSWORD_EMAIL,
      data: {
        to,
        templateData,
      },
    };

    const job = await this.notificationQueue.add(
      NotificationJobType.SEND_RESET_PASSWORD_EMAIL,
      jobData,
      {
        ...this.defaultJobOptions,
        priority: 10, // Máxima prioridad para reset de contraseña
        ...options,
      },
    );

    this.logger.log(`Reset password email job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  /**
   * Encolar job de email de verificación
   *
   * @param to - Email destinatario
   * @param templateData - Datos del template
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueVerifyEmail(
    to: string,
    templateData: IVerifyEmailData,
    options?: INotificationJobOptions,
  ): Promise<string> {
    const jobData: IVerifyEmailJobData = {
      type: NotificationJobType.SEND_VERIFY_EMAIL,
      data: {
        to,
        templateData,
      },
    };

    const job = await this.notificationQueue.add(NotificationJobType.SEND_VERIFY_EMAIL, jobData, {
      ...this.defaultJobOptions,
      priority: 8, // Alta prioridad para verificación
      ...options,
    });

    this.logger.log(`Verify email job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  /**
   * Encolar job de email de notificación genérica
   *
   * @param to - Email destinatario
   * @param templateData - Datos del template
   * @param options - Opciones del job
   * @returns ID del job
   */
  async queueNotificationEmail(
    to: string,
    templateData: INotificationEmailData,
    options?: INotificationJobOptions,
  ): Promise<string> {
    const jobData: INotificationEmailJobData = {
      type: NotificationJobType.SEND_NOTIFICATION_EMAIL,
      data: {
        to,
        templateData,
      },
    };

    const job = await this.notificationQueue.add(
      NotificationJobType.SEND_NOTIFICATION_EMAIL,
      jobData,
      {
        ...this.defaultJobOptions,
        ...options,
      },
    );

    this.logger.log(`Notification email job queued with ID: ${job.id}`);

    return job.id.toString();
  }

  // ============================================
  // UTILIDADES DE QUEUE
  // ============================================

  /**
   * Obtener estadísticas de la cola
   *
   * @returns Estadísticas
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.notificationQueue.getWaitingCount(),
      this.notificationQueue.getActiveCount(),
      this.notificationQueue.getCompletedCount(),
      this.notificationQueue.getFailedCount(),
      this.notificationQueue.getDelayedCount(),
      this.notificationQueue.getPausedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  /**
   * Limpiar jobs completados
   *
   * @param grace - Tiempo de gracia en ms (default: 1 hora)
   * @returns Número de jobs eliminados
   */
  async cleanCompletedJobs(grace: number = 3600000): Promise<number> {
    const jobs = await this.notificationQueue.clean(grace, 'completed');
    this.logger.log(`Cleaned ${jobs.length} completed jobs`);
    return jobs.length;
  }

  /**
   * Limpiar jobs fallidos
   *
   * @param grace - Tiempo de gracia en ms (default: 24 horas)
   * @returns Número de jobs eliminados
   */
  async cleanFailedJobs(grace: number = 86400000): Promise<number> {
    const jobs = await this.notificationQueue.clean(grace, 'failed');
    this.logger.log(`Cleaned ${jobs.length} failed jobs`);
    return jobs.length;
  }

  /**
   * Pausar la cola
   */
  async pauseQueue(): Promise<void> {
    await this.notificationQueue.pause();
    this.logWarn('Notification queue paused');
  }

  /**
   * Reanudar la cola
   */
  async resumeQueue(): Promise<void> {
    await this.notificationQueue.resume();
    this.logger.log('Notification queue resumed');
  }

  /**
   * Vaciar la cola (PELIGROSO)
   */
  async emptyQueue(): Promise<void> {
    await this.notificationQueue.empty();
    this.logWarn('Notification queue emptied');
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
