/**
 * @fileoverview Service para gestión de notificaciones multi-canal
 * @module modules/notification
 *
 * ⚠️ REGLAS:
 * - SIEMPRE inyectar SanitizerService y HandleErrorService
 * - SIEMPRE sanitizar inputs
 * - SIEMPRE usar handleError para excepciones
 * - Integrar EmailChannel, SmsChannel, PushChannel
 */

import { Injectable, Logger } from '@nestjs/common';

// Shared Services (OBLIGATORIOS)
import { SanitizerService, HandleErrorService } from '@shared/common';

// Local imports - Channels
import { EmailChannel, SmsChannel, PushChannel } from './channels';

// Local imports - DTOs
import {
  SendNotificationDto,
  SendEmailDto,
  SendSmsDto,
  SendPushDto,
  NotificationChannel,
} from './dto';

// Local imports - Interfaces
import {
  INotificationResponse,
  IEmailResponse,
  ISmsResponse,
  IPushResponse,
  IMultiChannelResponse,
  INotificationOptions,
} from './interfaces';

// Local imports - Templates
import {
  WelcomeEmailTemplate,
  ResetPasswordEmailTemplate,
  VerifyEmailTemplate,
  NotificationEmailTemplate,
  IWelcomeEmailData,
  IResetPasswordEmailData,
  IVerifyEmailData,
  INotificationEmailData,
} from './templates';

/**
 * Service para gestión de notificaciones multi-canal
 *
 * Características:
 * - Envío por email, SMS y push notifications
 * - Envío multi-canal
 * - Aplicación de templates
 * - Validación de canales disponibles
 * - Sanitización de inputs
 *
 * @injectable
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly smsChannel: SmsChannel,
    private readonly pushChannel: PushChannel,
    private readonly sanitizer: SanitizerService, // ✅ OBLIGATORIO
    private readonly handleError: HandleErrorService, // ✅ OBLIGATORIO
  ) {}

  // ============================================
  // ENVÍO POR CANAL INDIVIDUAL
  // ============================================

  /**
   * Enviar notificación por email
   *
   * @param dto - Datos del email
   * @returns Respuesta del envío
   */
  async sendEmail(dto: SendEmailDto): Promise<IEmailResponse> {
    try {
      // Sanitizar inputs
      const sanitizedTo = dto.to.map((email) => this.sanitizer.sanitizeEmail(email));
      const sanitizedSubject = this.sanitizer.sanitizeText(dto.subject);

      // Preparar opciones
      const options: INotificationOptions = {
        channel: NotificationChannel.EMAIL,
        recipient: sanitizedTo,
        subject: sanitizedSubject,
        message: dto.text || dto.html || '',
        data: {
          email: {
            text: dto.text,
            html: dto.html,
            cc: dto.cc,
            bcc: dto.bcc,
            replyTo: dto.replyTo,
            attachments: dto.attachments,
            headers: dto.headers,
          },
        },
        priority: dto.priority,
      };

      // Enviar
      const response = await this.emailChannel.send(options);

      this.logger.log(`Email sent successfully to ${sanitizedTo.length} recipient(s)`);

      return response as IEmailResponse;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      this.handleError.internalServerError(
        'Error al enviar email',
        'EMAIL_SEND_ERROR',
      );
    }
  }

  /**
   * Enviar notificación por SMS
   *
   * @param dto - Datos del SMS
   * @returns Respuesta del envío
   */
  async sendSms(dto: SendSmsDto): Promise<ISmsResponse> {
    try {
      // Sanitizar inputs
      const sanitizedMessage = this.sanitizer.sanitizeText(dto.message);

      // Preparar opciones
      const options: INotificationOptions = {
        channel: NotificationChannel.SMS,
        recipient: dto.to,
        subject: 'SMS',
        message: sanitizedMessage,
        data: {
          sms: {
            type: dto.type,
            from: dto.from,
            campaignId: dto.campaignId,
            callbackUrl: dto.callbackUrl,
            validityPeriod: dto.validityPeriod,
          },
        },
      };

      // Enviar
      const response = await this.smsChannel.send(options);

      this.logger.log(`SMS sent successfully to ${dto.to.length} recipient(s)`);

      return response as ISmsResponse;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      this.handleError.internalServerError('Error al enviar SMS', 'SMS_SEND_ERROR');
    }
  }

  /**
   * Enviar push notification
   *
   * @param dto - Datos del push
   * @returns Respuesta del envío
   */
  async sendPush(dto: SendPushDto): Promise<IPushResponse> {
    try {
      // Sanitizar inputs
      const sanitizedTitle = this.sanitizer.sanitizeText(dto.title);
      const sanitizedBody = this.sanitizer.sanitizeText(dto.body);

      // Preparar opciones
      const options: INotificationOptions = {
        channel: NotificationChannel.PUSH,
        recipient: dto.tokens,
        subject: sanitizedTitle,
        message: sanitizedBody,
        data: {
          push: {
            title: sanitizedTitle,
            body: sanitizedBody,
            imageUrl: dto.imageUrl,
            iconUrl: dto.iconUrl,
            clickAction: dto.clickAction,
            sound: dto.sound,
            badge: dto.badge,
            tag: dto.tag,
            color: dto.color,
            channelId: dto.channelId,
            timeToLive: dto.timeToLive,
            showInForeground: dto.showInForeground,
            platform: dto.platform,
          },
          ...dto.data,
        },
        priority: dto.priority,
      };

      // Enviar
      const response = await this.pushChannel.send(options);

      this.logger.log(`Push notification sent to ${dto.tokens.length} token(s)`);

      return response as IPushResponse;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      this.handleError.internalServerError(
        'Error al enviar push notification',
        'PUSH_SEND_ERROR',
      );
    }
  }

  // ============================================
  // ENVÍO MULTI-CANAL
  // ============================================

  /**
   * Enviar notificación por múltiples canales
   *
   * @param dto - Datos de la notificación multi-canal
   * @returns Respuestas por canal
   */
  async sendMultiChannel(dto: SendNotificationDto): Promise<IMultiChannelResponse> {
    try {
      const responses: IMultiChannelResponse = {
        success: false,
        responses: {},
        successfulChannels: [],
        failedChannels: [],
        sentAt: new Date(),
      };

      // Enviar por cada canal solicitado
      const promises = dto.channels.map(async (channel) => {
        try {
          let response: INotificationResponse;

          switch (channel) {
            case NotificationChannel.EMAIL:
              response = await this.sendEmailMulti(dto);
              break;
            case NotificationChannel.SMS:
              response = await this.sendSmsMulti(dto);
              break;
            case NotificationChannel.PUSH:
              response = await this.sendPushMulti(dto);
              break;
            default:
              this.logger.warn(`Unknown channel: ${channel}`);
              return;
          }

          responses.responses[channel] = response;

          if (response.success) {
            responses.successfulChannels.push(channel);
          } else {
            responses.failedChannels.push(channel);
          }
        } catch (error) {
          this.logger.error(`Failed to send via ${channel}: ${error.message}`);
          responses.failedChannels.push(channel);
        }
      });

      await Promise.all(promises);

      // Considerar éxito si al menos un canal fue exitoso
      responses.success = responses.successfulChannels.length > 0;

      this.logger.log(
        `Multi-channel notification sent. Success: ${responses.successfulChannels.length}, Failed: ${responses.failedChannels.length}`,
      );

      return responses;
    } catch (error) {
      this.logger.error(`Failed multi-channel send: ${error.message}`, error.stack);
      this.handleError.internalServerError(
        'Error al enviar notificación multi-canal',
        'MULTI_CHANNEL_ERROR',
      );
    }
  }

  /**
   * Helper: Enviar email desde SendNotificationDto
   */
  private async sendEmailMulti(dto: SendNotificationDto): Promise<IEmailResponse> {
    const emailRecipients = dto.recipients
      .filter((r) => r.email)
      .map((r) => r.email as string);

    if (emailRecipients.length === 0) {
      throw new Error('No email recipients found');
    }

    return await this.sendEmail({
      to: emailRecipients,
      subject: dto.subject,
      text: dto.message,
      html: dto.data?.html,
    });
  }

  /**
   * Helper: Enviar SMS desde SendNotificationDto
   */
  private async sendSmsMulti(dto: SendNotificationDto): Promise<ISmsResponse> {
    const phoneRecipients = dto.recipients
      .filter((r) => r.phone)
      .map((r) => r.phone as string);

    if (phoneRecipients.length === 0) {
      throw new Error('No phone recipients found');
    }

    return await this.sendSms({
      to: phoneRecipients,
      message: dto.message,
    });
  }

  /**
   * Helper: Enviar push desde SendNotificationDto
   */
  private async sendPushMulti(dto: SendNotificationDto): Promise<IPushResponse> {
    const pushTokens = dto.recipients
      .filter((r) => r.pushToken)
      .map((r) => r.pushToken as string);

    if (pushTokens.length === 0) {
      throw new Error('No push tokens found');
    }

    return await this.sendPush({
      tokens: pushTokens,
      title: dto.subject,
      body: dto.message,
    });
  }

  // ============================================
  // ENVÍO CON TEMPLATES
  // ============================================

  /**
   * Enviar email de bienvenida
   *
   * @param to - Email destinatario
   * @param data - Datos del template
   * @returns Respuesta del envío
   */
  async sendWelcomeEmail(to: string, data: IWelcomeEmailData): Promise<IEmailResponse> {
    const html = WelcomeEmailTemplate.generate(data);
    const text = WelcomeEmailTemplate.generateText(data);

    return await this.sendEmail({
      to: [to],
      subject: `Bienvenido a ${data.appName || 'nuestra plataforma'}`,
      html,
      text,
    });
  }

  /**
   * Enviar email de reset de contraseña
   *
   * @param to - Email destinatario
   * @param data - Datos del template
   * @returns Respuesta del envío
   */
  async sendResetPasswordEmail(
    to: string,
    data: IResetPasswordEmailData,
  ): Promise<IEmailResponse> {
    const html = ResetPasswordEmailTemplate.generate(data);
    const text = ResetPasswordEmailTemplate.generateText(data);

    return await this.sendEmail({
      to: [to],
      subject: 'Restablece tu contraseña',
      html,
      text,
    });
  }

  /**
   * Enviar email de verificación
   *
   * @param to - Email destinatario
   * @param data - Datos del template
   * @returns Respuesta del envío
   */
  async sendVerifyEmail(to: string, data: IVerifyEmailData): Promise<IEmailResponse> {
    const html = VerifyEmailTemplate.generate(data);
    const text = VerifyEmailTemplate.generateText(data);

    return await this.sendEmail({
      to: [to],
      subject: 'Verifica tu dirección de email',
      html,
      text,
    });
  }

  /**
   * Enviar notificación genérica
   *
   * @param to - Email destinatario
   * @param data - Datos del template
   * @returns Respuesta del envío
   */
  async sendNotificationEmail(
    to: string,
    data: INotificationEmailData,
  ): Promise<IEmailResponse> {
    const html = NotificationEmailTemplate.generate(data);
    const text = NotificationEmailTemplate.generateText(data);

    return await this.sendEmail({
      to: [to],
      subject: data.title,
      html,
      text,
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtener estado de canales disponibles
   *
   * @returns Estado de cada canal
   */
  async getChannelsStatus(): Promise<Record<string, boolean>> {
    const [emailAvailable, smsAvailable, pushAvailable] = await Promise.all([
      this.emailChannel.isAvailable(),
      this.smsChannel.isAvailable(),
      this.pushChannel.isAvailable(),
    ]);

    return {
      [NotificationChannel.EMAIL]: emailAvailable,
      [NotificationChannel.SMS]: smsAvailable,
      [NotificationChannel.PUSH]: pushAvailable,
    };
  }

  /**
   * Verificar si un canal específico está disponible
   *
   * @param channel - Canal a verificar
   * @returns true si está disponible
   */
  async isChannelAvailable(channel: NotificationChannel): Promise<boolean> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return await this.emailChannel.isAvailable();
      case NotificationChannel.SMS:
        return await this.smsChannel.isAvailable();
      case NotificationChannel.PUSH:
        return await this.pushChannel.isAvailable();
      default:
        return false;
    }
  }
}
