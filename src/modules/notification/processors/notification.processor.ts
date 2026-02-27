/**
 * @fileoverview Procesador de jobs de notificaciones (Bull)
 * @module modules/notification/processors
 *
 * Procesa jobs de la cola de notificaciones de forma asíncrona:
 * - send-email: Enviar email
 * - send-sms: Enviar SMS
 * - send-push: Enviar push notification
 * - send-multi: Enviar multi-canal
 * - send-batch: Enviar batch de notificaciones
 */

import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject, Optional } from '@nestjs/common';
import { Job } from 'bull';
import { LoggerService, LogContext } from '@modules/logger';

// Service
import { NotificationService } from '../notification.service';

// DTOs
import { SendEmailDto, SendNotificationDto, SendPushDto, SendSmsDto } from '../dto';

// Interfaces
import { IEmailResponse, IMultiChannelResponse, IPushResponse, ISmsResponse } from '../interfaces';

// Templates
import {
  INotificationEmailData,
  IResetPasswordEmailData,
  IVerifyEmailData,
  IWelcomeEmailData,
} from '../templates';

/**
 * Tipos de jobs de notificaciones
 */
export enum NotificationJobType {
  SEND_EMAIL = 'send-email',
  SEND_SMS = 'send-sms',
  SEND_PUSH = 'send-push',
  SEND_MULTI = 'send-multi',
  SEND_BATCH = 'send-batch',
  SEND_WELCOME_EMAIL = 'send-welcome-email',
  SEND_RESET_PASSWORD_EMAIL = 'send-reset-password-email',
  SEND_VERIFY_EMAIL = 'send-verify-email',
  SEND_NOTIFICATION_EMAIL = 'send-notification-email',
}

/**
 * Data para jobs de email
 */
export interface IEmailJobData {
  type: NotificationJobType.SEND_EMAIL;
  data: SendEmailDto;
}

/**
 * Data para jobs de SMS
 */
export interface ISmsJobData {
  type: NotificationJobType.SEND_SMS;
  data: SendSmsDto;
}

/**
 * Data para jobs de push
 */
export interface IPushJobData {
  type: NotificationJobType.SEND_PUSH;
  data: SendPushDto;
}

/**
 * Data para jobs multi-canal
 */
export interface IMultiChannelJobData {
  type: NotificationJobType.SEND_MULTI;
  data: SendNotificationDto;
}

/**
 * Data para jobs de batch
 */
export interface IBatchJobData {
  type: NotificationJobType.SEND_BATCH;
  data: {
    emails?: SendEmailDto[];
    sms?: SendSmsDto[];
    push?: SendPushDto[];
  };
}

/**
 * Data para jobs de templates
 */
export interface IWelcomeEmailJobData {
  type: NotificationJobType.SEND_WELCOME_EMAIL;
  data: {
    to: string;
    templateData: IWelcomeEmailData;
  };
}

export interface IResetPasswordEmailJobData {
  type: NotificationJobType.SEND_RESET_PASSWORD_EMAIL;
  data: {
    to: string;
    templateData: IResetPasswordEmailData;
  };
}

export interface IVerifyEmailJobData {
  type: NotificationJobType.SEND_VERIFY_EMAIL;
  data: {
    to: string;
    templateData: IVerifyEmailData;
  };
}

export interface INotificationEmailJobData {
  type: NotificationJobType.SEND_NOTIFICATION_EMAIL;
  data: {
    to: string;
    templateData: INotificationEmailData;
  };
}

/**
 * Union type de todos los job data
 */
export type NotificationJobData =
  | IEmailJobData
  | ISmsJobData
  | IPushJobData
  | IMultiChannelJobData
  | IBatchJobData
  | IWelcomeEmailJobData
  | IResetPasswordEmailJobData
  | IVerifyEmailJobData
  | INotificationEmailJobData;

/**
 * Procesador de jobs de notificaciones
 *
 * Características:
 * - Retry automático (configurado en Bull)
 * - Logging detallado
 * - Rate limiting (manejado por canales)
 * - Dead letter queue (configurado en Bull)
 */
@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  /**
   * Type predicate para filtrar valores null
   * Se declara sin contexto de `this` para poder ser usado como callback
   */
  private isNotNull<T>(this: void, value: T | null): value is T {
    return value !== null;
  }

  // ============================================
  // PROCESADORES DE JOBS INDIVIDUALES
  // ============================================

  /**
   * Procesar job de envío de email
   */
  @Process(NotificationJobType.SEND_EMAIL)
  async processEmail(job: Job<IEmailJobData>): Promise<IEmailResponse> {
    this.logger.log(`Processing email job ${job.id}`);

    try {
      const result = await this.notificationService.sendEmail(job.data.data);

      this.logger.log(`Email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logError(`Email job ${job.id} failed: ${error.message}`, error.stack);
      throw error; // Bull reintentará automáticamente
    }
  }

  /**
   * Procesar job de envío de SMS
   */
  @Process(NotificationJobType.SEND_SMS)
  async processSms(job: Job<ISmsJobData>): Promise<ISmsResponse> {
    this.logger.log(`Processing SMS job ${job.id}`);

    try {
      const result = await this.notificationService.sendSms(job.data.data);

      this.logger.log(`SMS job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logError(`SMS job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de envío de push notification
   */
  @Process(NotificationJobType.SEND_PUSH)
  async processPush(job: Job<IPushJobData>): Promise<IPushResponse> {
    this.logger.log(`Processing push job ${job.id}`);

    try {
      const result = await this.notificationService.sendPush(job.data.data);

      this.logger.log(`Push job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logError(`Push job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de envío multi-canal
   */
  @Process(NotificationJobType.SEND_MULTI)
  async processMultiChannel(job: Job<IMultiChannelJobData>): Promise<IMultiChannelResponse> {
    this.logger.log(`Processing multi-channel job ${job.id}`);

    try {
      const result = await this.notificationService.sendMultiChannel(job.data.data);

      this.logger.log(
        `Multi-channel job ${job.id} completed. Success: ${result.successfulChannels.length}, Failed: ${result.failedChannels.length}`,
      );

      return result;
    } catch (error) {
      this.logError(`Multi-channel job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de envío en batch
   */
  @Process(NotificationJobType.SEND_BATCH)
  async processBatch(job: Job<IBatchJobData>): Promise<{
    emails: IEmailResponse[];
    sms: ISmsResponse[];
    push: IPushResponse[];
  }> {
    this.logger.log(`Processing batch job ${job.id}`);

    const results = {
      emails: [] as IEmailResponse[],
      sms: [] as ISmsResponse[],
      push: [] as IPushResponse[],
    };

    try {
      // Procesar emails
      if (job.data.data.emails && job.data.data.emails.length > 0) {
        this.logger.log(`Processing ${job.data.data.emails.length} emails in batch`);

        const emailPromises = job.data.data.emails.map((emailDto) =>
          this.notificationService.sendEmail(emailDto).catch((error) => {
            this.logError(`Batch email failed: ${error.message}`);
            return null;
          }),
        );

        const emailResults = await Promise.all(emailPromises);
        results.emails = emailResults.filter(this.isNotNull);
      }

      // Procesar SMS
      if (job.data.data.sms && job.data.data.sms.length > 0) {
        this.logger.log(`Processing ${job.data.data.sms.length} SMS in batch`);

        const smsPromises = job.data.data.sms.map((smsDto) =>
          this.notificationService.sendSms(smsDto).catch((error) => {
            this.logError(`Batch SMS failed: ${error.message}`);
            return null;
          }),
        );

        const smsResults = await Promise.all(smsPromises);
        results.sms = smsResults.filter(this.isNotNull);
      }

      // Procesar push
      if (job.data.data.push && job.data.data.push.length > 0) {
        this.logger.log(`Processing ${job.data.data.push.length} push in batch`);

        const pushPromises = job.data.data.push.map((pushDto) =>
          this.notificationService.sendPush(pushDto).catch((error) => {
            this.logError(`Batch push failed: ${error.message}`);
            return null;
          }),
        );

        const pushResults = await Promise.all(pushPromises);
        results.push = pushResults.filter(this.isNotNull);
      }

      this.logger.log(
        `Batch job ${job.id} completed. Emails: ${results.emails.length}, SMS: ${results.sms.length}, Push: ${results.push.length}`,
      );

      return results;
    } catch (error) {
      this.logError(`Batch job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ============================================
  // PROCESADORES DE TEMPLATES
  // ============================================

  /**
   * Procesar job de email de bienvenida
   */
  @Process(NotificationJobType.SEND_WELCOME_EMAIL)
  async processWelcomeEmail(job: Job<IWelcomeEmailJobData>): Promise<IEmailResponse> {
    this.logger.log(`Processing welcome email job ${job.id}`);

    try {
      const result = await this.notificationService.sendWelcomeEmail(
        job.data.data.to,
        job.data.data.templateData,
      );

      this.logger.log(`Welcome email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logError(`Welcome email job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de email de reset de contraseña
   */
  @Process(NotificationJobType.SEND_RESET_PASSWORD_EMAIL)
  async processResetPasswordEmail(job: Job<IResetPasswordEmailJobData>): Promise<IEmailResponse> {
    this.logger.log(`Processing reset password email job ${job.id}`);

    try {
      const result = await this.notificationService.sendResetPasswordEmail(
        job.data.data.to,
        job.data.data.templateData,
      );

      this.logger.log(`Reset password email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logError(`Reset password email job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de email de verificación
   */
  @Process(NotificationJobType.SEND_VERIFY_EMAIL)
  async processVerifyEmail(job: Job<IVerifyEmailJobData>): Promise<IEmailResponse> {
    this.logger.log(`Processing verify email job ${job.id}`);

    try {
      const result = await this.notificationService.sendVerifyEmail(
        job.data.data.to,
        job.data.data.templateData,
      );

      this.logger.log(`Verify email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logError(`Verify email job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de email de notificación genérica
   */
  @Process(NotificationJobType.SEND_NOTIFICATION_EMAIL)
  async processNotificationEmail(job: Job<INotificationEmailJobData>): Promise<IEmailResponse> {
    this.logger.log(`Processing notification email job ${job.id}`);

    try {
      const result = await this.notificationService.sendNotificationEmail(
        job.data.data.to,
        job.data.data.templateData,
      );

      this.logger.log(`Notification email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logError(`Notification email job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.QUEUE,
      service: NotificationProcessor.name,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.QUEUE,
      service: NotificationProcessor.name,
      stack,
    });
  }
}
