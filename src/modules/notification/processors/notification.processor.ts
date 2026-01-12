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

import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

// Service
import { NotificationService } from '../notification.service';

// DTOs
import {
  SendEmailDto,
  SendSmsDto,
  SendPushDto,
  SendNotificationDto,
} from '../dto';

// Interfaces
import {
  IEmailResponse,
  ISmsResponse,
  IPushResponse,
  IMultiChannelResponse,
} from '../interfaces';

// Templates
import {
  IWelcomeEmailData,
  IResetPasswordEmailData,
  IVerifyEmailData,
  INotificationEmailData,
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

  constructor(private readonly notificationService: NotificationService) {}

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
      this.logger.error(`Email job ${job.id} failed: ${error.message}`, error.stack);
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
      this.logger.error(`SMS job ${job.id} failed: ${error.message}`, error.stack);
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
      this.logger.error(`Push job ${job.id} failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de envío multi-canal
   */
  @Process(NotificationJobType.SEND_MULTI)
  async processMultiChannel(
    job: Job<IMultiChannelJobData>,
  ): Promise<IMultiChannelResponse> {
    this.logger.log(`Processing multi-channel job ${job.id}`);

    try {
      const result = await this.notificationService.sendMultiChannel(job.data.data);

      this.logger.log(
        `Multi-channel job ${job.id} completed. Success: ${result.successfulChannels.length}, Failed: ${result.failedChannels.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Multi-channel job ${job.id} failed: ${error.message}`,
        error.stack,
      );
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
            this.logger.error(`Batch email failed: ${error.message}`);
            return null;
          }),
        );

        const emailResults = await Promise.all(emailPromises);
        results.emails = emailResults.filter((r) => r !== null) as IEmailResponse[];
      }

      // Procesar SMS
      if (job.data.data.sms && job.data.data.sms.length > 0) {
        this.logger.log(`Processing ${job.data.data.sms.length} SMS in batch`);

        const smsPromises = job.data.data.sms.map((smsDto) =>
          this.notificationService.sendSms(smsDto).catch((error) => {
            this.logger.error(`Batch SMS failed: ${error.message}`);
            return null;
          }),
        );

        const smsResults = await Promise.all(smsPromises);
        results.sms = smsResults.filter((r) => r !== null) as ISmsResponse[];
      }

      // Procesar push
      if (job.data.data.push && job.data.data.push.length > 0) {
        this.logger.log(`Processing ${job.data.data.push.length} push in batch`);

        const pushPromises = job.data.data.push.map((pushDto) =>
          this.notificationService.sendPush(pushDto).catch((error) => {
            this.logger.error(`Batch push failed: ${error.message}`);
            return null;
          }),
        );

        const pushResults = await Promise.all(pushPromises);
        results.push = pushResults.filter((r) => r !== null) as IPushResponse[];
      }

      this.logger.log(
        `Batch job ${job.id} completed. Emails: ${results.emails.length}, SMS: ${results.sms.length}, Push: ${results.push.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(`Batch job ${job.id} failed: ${error.message}`, error.stack);
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
  async processWelcomeEmail(
    job: Job<IWelcomeEmailJobData>,
  ): Promise<IEmailResponse> {
    this.logger.log(`Processing welcome email job ${job.id}`);

    try {
      const result = await this.notificationService.sendWelcomeEmail(
        job.data.data.to,
        job.data.data.templateData,
      );

      this.logger.log(`Welcome email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logger.error(
        `Welcome email job ${job.id} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Procesar job de email de reset de contraseña
   */
  @Process(NotificationJobType.SEND_RESET_PASSWORD_EMAIL)
  async processResetPasswordEmail(
    job: Job<IResetPasswordEmailJobData>,
  ): Promise<IEmailResponse> {
    this.logger.log(`Processing reset password email job ${job.id}`);

    try {
      const result = await this.notificationService.sendResetPasswordEmail(
        job.data.data.to,
        job.data.data.templateData,
      );

      this.logger.log(`Reset password email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logger.error(
        `Reset password email job ${job.id} failed: ${error.message}`,
        error.stack,
      );
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
      this.logger.error(
        `Verify email job ${job.id} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Procesar job de email de notificación genérica
   */
  @Process(NotificationJobType.SEND_NOTIFICATION_EMAIL)
  async processNotificationEmail(
    job: Job<INotificationEmailJobData>,
  ): Promise<IEmailResponse> {
    this.logger.log(`Processing notification email job ${job.id}`);

    try {
      const result = await this.notificationService.sendNotificationEmail(
        job.data.data.to,
        job.data.data.templateData,
      );

      this.logger.log(`Notification email job ${job.id} completed successfully`);

      return result;
    } catch (error) {
      this.logger.error(
        `Notification email job ${job.id} failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
