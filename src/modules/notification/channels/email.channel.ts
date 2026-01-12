/**
 * @fileoverview Canal de Email usando Nodemailer
 * @module modules/notification/channels
 *
 * Implementa envío de emails via SMTP con:
 * - Soporte HTML y texto plano
 * - Archivos adjuntos
 * - CC/BCC
 * - Headers personalizados
 * - Retry automático
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  INotificationOptions,
  INotificationResponse,
  IEmailResponse,
  NotificationStatus,
} from '../interfaces';
import { NotificationChannel } from '../dto/send-notification.dto';
import { NotificationChannelAbstract } from './notification-channel.abstract';

/**
 * Canal de Email usando Nodemailer
 *
 * Configuración requerida en .env:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASSWORD
 * - SMTP_FROM
 *
 * @injectable
 */
@Injectable()
export class EmailChannel extends NotificationChannelAbstract {
  /**
   * Nombre del canal
   */
  readonly name = NotificationChannel.EMAIL;

  /**
   * Transporter de Nodemailer
   */
  private transporter: Transporter | null = null;

  /**
   * Cache del estado de disponibilidad
   */
  private availabilityCache: { value: boolean; timestamp: number } | null = null;

  /**
   * TTL del cache de disponibilidad (5 minutos)
   */
  private readonly AVAILABILITY_CACHE_TTL = 5 * 60 * 1000;

  /**
   * Constructor
   */
  constructor(configService: ConfigService) {
    super('Email', configService);
  }

  /**
   * Inicializar transporter de Nodemailer
   * Se llama automáticamente al primer envío
   */
  private async initializeTransporter(): Promise<void> {
    if (this.transporter) {
      return;
    }

    try {
      const host = this.getRequiredConfig<string>('SMTP_HOST');
      const port = this.getConfig<number>('SMTP_PORT', 587);
      const secure = this.getConfig<boolean>('SMTP_SECURE', false);
      const user = this.getRequiredConfig<string>('SMTP_USER');
      const password = this.getRequiredConfig<string>('SMTP_PASSWORD');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: password,
        },
        pool: true, // Usar pool de conexiones
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000, // Enviar máximo 1 email por segundo
        rateLimit: this.getConfig<number>('EMAIL_RATE_LIMIT', 100),
      } as SMTPTransport.Options);

      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter', error.stack);
      throw error;
    }
  }

  /**
   * Enviar email
   *
   * @param options - Opciones de notificación
   * @returns Respuesta del envío
   */
  async send(options: INotificationOptions): Promise<IEmailResponse> {
    try {
      // Validar opciones
      await this.validate(options);

      // Inicializar transporter si no existe
      await this.initializeTransporter();

      const recipients = this.normalizeRecipients(options.recipient);
      this.logSendStart(recipients, { subject: options.subject });

      // Obtener configuración de email
      const from = this.getFrom(options);
      const replyTo = this.getReplyTo(options);

      // Preparar opciones de email
      const mailOptions = {
        from,
        to: recipients.join(', '),
        cc: this.getCc(options),
        bcc: this.getBcc(options),
        replyTo,
        subject: options.subject,
        text: this.getText(options),
        html: this.getHtml(options),
        attachments: this.getAttachments(options),
        headers: this.getHeaders(options),
      };

      // Enviar email
      const info = await this.transporter!.sendMail(mailOptions);

      this.logSendSuccess(info.messageId, recipients);

      // Crear respuesta
      return {
        success: true,
        messageId: info.messageId,
        emailId: info.messageId,
        channel: this.name,
        status: NotificationStatus.SENT,
        recipient: recipients,
        sentAt: new Date(),
        accepted: info.accepted as string[],
        rejected: info.rejected as string[],
        smtpResponse: info.response,
        messageSize: info.messageSize,
        metadata: {
          envelope: info.envelope,
        },
      };
    } catch (error) {
      this.logSendError(error, options.recipient);
      return this.createErrorResponse(error, options.recipient) as IEmailResponse;
    }
  }

  /**
   * Validar opciones de email
   *
   * @param options - Opciones a validar
   * @returns true si son válidas
   * @throws Error si son inválidas
   */
  async validate(options: INotificationOptions): Promise<boolean> {
    // Validar destinatarios
    this.validateRecipients(options.recipient);

    // Validar que haya al menos un contenido
    const hasText = options.data?.text || options.message;
    const hasHtml = options.data?.html;
    const hasTemplate = options.template;

    if (!hasText && !hasHtml && !hasTemplate) {
      throw new Error('Email must have at least text, html, or template content');
    }

    // Validar subject
    if (!options.subject || options.subject.trim() === '') {
      throw new Error('Email subject is required');
    }

    // Validar emails con regex básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = this.normalizeRecipients(options.recipient);

    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }

    return true;
  }

  /**
   * Verificar si el canal está disponible
   * Verifica configuración SMTP y conexión
   *
   * @returns true si está disponible
   */
  async isAvailable(): Promise<boolean> {
    // Verificar si el canal está habilitado
    const enabled = this.getConfig<boolean>('NOTIFICATION_EMAIL_ENABLED', true);
    if (!enabled) {
      this.logger.warn('Email notifications are disabled');
      return false;
    }

    // Verificar cache
    if (this.availabilityCache) {
      const now = Date.now();
      if (now - this.availabilityCache.timestamp < this.AVAILABILITY_CACHE_TTL) {
        return this.availabilityCache.value;
      }
    }

    try {
      // Verificar configuración requerida
      const requiredVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
      for (const varName of requiredVars) {
        if (!this.hasConfig(varName)) {
          this.logger.warn(`Missing required configuration: ${varName}`);
          this.cacheAvailability(false);
          return false;
        }
      }

      // Inicializar transporter
      await this.initializeTransporter();

      // Verificar conexión SMTP
      await this.transporter!.verify();

      this.logger.log('Email channel is available and verified');
      this.cacheAvailability(true);
      return true;
    } catch (error) {
      this.logger.error('Email channel is not available', error.message);
      this.cacheAvailability(false);
      return false;
    }
  }

  /**
   * Cachear estado de disponibilidad
   */
  private cacheAvailability(value: boolean): void {
    this.availabilityCache = {
      value,
      timestamp: Date.now(),
    };
  }

  /**
   * Obtener email remitente
   */
  private getFrom(options: INotificationOptions): string {
    const from = options.data?.email?.from || this.getRequiredConfig<string>('SMTP_FROM');
    const fromName = this.getConfig<string>('SMTP_FROM_NAME');

    return fromName ? `"${fromName}" <${from}>` : from;
  }

  /**
   * Obtener email de respuesta
   */
  private getReplyTo(options: INotificationOptions): string | undefined {
    return options.data?.email?.replyTo;
  }

  /**
   * Obtener CC
   */
  private getCc(options: INotificationOptions): string | undefined {
    const cc = options.data?.email?.cc;
    return cc && cc.length > 0 ? cc.join(', ') : undefined;
  }

  /**
   * Obtener BCC
   */
  private getBcc(options: INotificationOptions): string | undefined {
    const bcc = options.data?.email?.bcc;
    return bcc && bcc.length > 0 ? bcc.join(', ') : undefined;
  }

  /**
   * Obtener contenido de texto plano
   */
  private getText(options: INotificationOptions): string | undefined {
    return options.data?.email?.text || options.message;
  }

  /**
   * Obtener contenido HTML
   */
  private getHtml(options: INotificationOptions): string | undefined {
    return options.data?.email?.html;
  }

  /**
   * Obtener archivos adjuntos
   */
  private getAttachments(options: INotificationOptions): any[] | undefined {
    return options.data?.email?.attachments;
  }

  /**
   * Obtener headers personalizados
   */
  private getHeaders(options: INotificationOptions): Record<string, string> | undefined {
    return options.data?.email?.headers;
  }

  /**
   * Cerrar transporter
   * Útil para testing y cleanup
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.logger.log('Email transporter closed');
    }
  }
}
