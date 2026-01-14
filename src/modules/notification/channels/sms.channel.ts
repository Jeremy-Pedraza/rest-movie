/**
 * @fileoverview Canal de SMS usando Twilio
 * @module modules/notification/channels
 *
 * Implementa envío de SMS via Twilio con:
 * - SMS transaccionales
 * - SMS promocionales
 * - SMS de alertas
 * - Tracking de entrega
 * - Rate limiting
 *
 * Modo stub disponible si Twilio no está configurado (development)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '../dto/send-notification.dto';
import { INotificationOptions, ISmsResponse, NotificationStatus } from '../interfaces';
import { NotificationChannelAbstract } from './notification-channel.abstract';

/**
 * Canal de SMS usando Twilio
 *
 * Configuración requerida en .env (opcional):
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 *
 * Si no está configurado, usa modo stub para development
 *
 * @injectable
 */
@Injectable()
export class SmsChannel extends NotificationChannelAbstract {
  /**
   * Nombre del canal
   */
  readonly name = NotificationChannel.SMS;

  /**
   * Cliente de Twilio (lazy loaded)
   */
  private twilioClient: any = null;

  /**
   * Flag para modo stub (cuando Twilio no está configurado)
   */
  private stubMode = false;

  /**
   * Constructor
   */
  constructor(configService: ConfigService) {
    super('SMS', configService);
  }

  /**
   * Inicializar cliente de Twilio
   * Se llama automáticamente al primer envío
   */
  private async initializeTwilioClient(): Promise<void> {
    if (this.twilioClient || this.stubMode) {
      return;
    }

    try {
      const accountSid = this.getConfig<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.getConfig<string>('TWILIO_AUTH_TOKEN');

      // Si no hay credenciales, usar modo stub
      if (!accountSid || !authToken) {
        this.logger.warn('Twilio credentials not configured. Using stub mode.');
        this.stubMode = true;
        return;
      }

      // Importar Twilio dinámicamente
      const twilio = await import('twilio');
      this.twilioClient = twilio.default(accountSid, authToken);

      this.logger.log('Twilio client initialized successfully');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Twilio client. Using stub mode.',
        (error as Error).stack,
      );
      this.stubMode = true;
    }
  }

  /**
   * Enviar SMS
   *
   * @param options - Opciones de notificación
   * @returns Respuesta del envío
   */
  async send(options: INotificationOptions): Promise<ISmsResponse> {
    try {
      // Validar opciones
      await this.validate(options);

      // Inicializar cliente si no existe
      await this.initializeTwilioClient();

      const recipients = this.normalizeRecipients(options.recipient);
      this.logSendStart(recipients, { type: options.data?.sms?.type });

      // Si estamos en modo stub, retornar respuesta simulada
      if (this.stubMode) {
        return this.sendStub(options);
      }

      // Enviar SMS real via Twilio
      return await this.sendTwilio(options);
    } catch (error) {
      this.logSendError(error, options.recipient);
      return this.createErrorResponse(error, options.recipient) as ISmsResponse;
    }
  }

  /**
   * Enviar SMS via Twilio
   */
  private async sendTwilio(options: INotificationOptions): Promise<ISmsResponse> {
    const recipients = this.normalizeRecipients(options.recipient);
    const from = this.getFrom(options);
    const message = options.message;

    // Enviar a múltiples destinatarios
    const results: Array<
      PromiseSettledResult<{
        sid: string;
        numSegments?: number;
        price?: string;
        status?: string;
      }>
    > = await Promise.allSettled(
      recipients.map(async (to) => {
        const result = await this.twilioClient.messages.create({
          body: message,
          from,
          to,
        });
        return {
          sid: String(result.sid || ''),
          numSegments: result.numSegments,
          price: result.price ? String(result.price) : undefined,
          status: result.status ? String(result.status) : undefined,
        };
      }),
    );

    // Procesar resultados
    const successful: string[] = [];
    const failed: string[] = [];
    let lastMessageId = '';
    let totalSegments = 0;
    let totalPrice = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(recipients[index]);
        lastMessageId = result.value.sid;
        totalSegments += result.value.numSegments || 1;
        if (result.value.price) {
          totalPrice += parseFloat(result.value.price);
        }
      } else {
        failed.push(recipients[index]);
        const errorMessage =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        this.logger.error(`Failed to send SMS to ${recipients[index]}: ${errorMessage}`);
      }
    });

    const success = successful.length > 0;
    const status = success ? NotificationStatus.SENT : NotificationStatus.FAILED;

    this.logSendSuccess(lastMessageId, successful);

    return {
      success,
      messageId: lastMessageId,
      smsId: lastMessageId,
      channel: this.name,
      status,
      recipient: recipients,
      sentAt: new Date(),
      segments: totalSegments,
      price:
        totalPrice > 0
          ? {
              amount: totalPrice,
              currency: 'USD',
            }
          : undefined,
      from,
      deliveryStatus: 'sent',
      metadata: {
        successful,
        failed,
        totalRecipients: recipients.length,
      },
    };
  }

  /**
   * Enviar SMS stub (para development sin Twilio)
   */
  private sendStub(options: INotificationOptions): ISmsResponse {
    const recipients = this.normalizeRecipients(options.recipient);
    const stubMessageId = `stub_sms_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    this.logger.warn(`[STUB MODE] SMS would be sent to: ${recipients.join(', ')}`);
    this.logger.warn(`[STUB MODE] Message: ${options.message}`);

    return {
      success: true,
      messageId: stubMessageId,
      smsId: stubMessageId,
      channel: this.name,
      status: NotificationStatus.SENT,
      recipient: recipients,
      sentAt: new Date(),
      segments: 1,
      deliveryStatus: 'sent',
      metadata: {
        stubMode: true,
        message: options.message,
      },
    };
  }

  /**
   * Validar opciones de SMS
   *
   * @param options - Opciones a validar
   * @returns true si son válidas
   * @throws Error si son inválidas
   */
  validate(options: INotificationOptions): Promise<boolean> {
    try {
      // Validar destinatarios
      this.validateRecipients(options.recipient);

      // Validar formato E.164 (básico)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      const recipients = this.normalizeRecipients(options.recipient);

      for (const phone of recipients) {
        if (!e164Regex.test(phone)) {
          return Promise.reject(
            new Error(
              `Invalid phone number format: ${phone}. Must be in E.164 format (e.g., +573001234567)`,
            ),
          );
        }
      }

      // Validar mensaje
      if (!options.message || options.message.trim() === '') {
        return Promise.reject(new Error('SMS message is required'));
      }

      // Validar longitud (máximo 1600 caracteres = 10 SMS concatenados)
      if (options.message.length > 1600) {
        return Promise.reject(new Error('SMS message exceeds maximum length of 1600 characters'));
      }

      return Promise.resolve(true);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      return Promise.reject(errorObj);
    }
  }

  /**
   * Verificar si el canal está disponible
   *
   * @returns true si está disponible
   */
  async isAvailable(): Promise<boolean> {
    // Verificar si el canal está habilitado
    const enabled = this.getConfig<boolean>('NOTIFICATION_SMS_ENABLED', false);
    if (!enabled) {
      this.logger.warn('SMS notifications are disabled');
      return false;
    }

    try {
      // Inicializar cliente
      await this.initializeTwilioClient();

      // Si estamos en modo stub, considerar disponible
      if (this.stubMode) {
        this.logger.log('SMS channel is available (stub mode)');
        return true;
      }

      // Verificar configuración de Twilio
      const hasAccountSid = this.hasConfig('TWILIO_ACCOUNT_SID');
      const hasAuthToken = this.hasConfig('TWILIO_AUTH_TOKEN');
      const hasPhoneNumber = this.hasConfig('TWILIO_PHONE_NUMBER');

      const available = hasAccountSid && hasAuthToken && hasPhoneNumber;

      if (available) {
        this.logger.log('SMS channel is available (Twilio configured)');
      } else {
        this.logger.warn('SMS channel is not fully configured');
      }

      return available;
    } catch (error) {
      this.logger.error('SMS channel is not available', (error as Error).message);
      return false;
    }
  }

  /**
   * Obtener número remitente
   */
  private getFrom(options: INotificationOptions): string {
    const fromData = options.data?.sms?.from;
    return typeof fromData === 'string'
      ? fromData
      : this.getRequiredConfig<string>('TWILIO_PHONE_NUMBER');
  }

  /**
   * Obtener estado de un SMS (opcional - requiere Twilio configurado)
   *
   * @param messageId - SID del mensaje de Twilio
   * @returns Estado de la notificación
   */
  async getStatus(messageId: string): Promise<NotificationStatus> {
    if (this.stubMode || !this.twilioClient) {
      return NotificationStatus.SENT;
    }

    try {
      const message = await this.twilioClient.messages(messageId).fetch();

      const statusMap: Record<string, NotificationStatus> = {
        queued: NotificationStatus.QUEUED,
        sending: NotificationStatus.SENDING,
        sent: NotificationStatus.SENT,
        delivered: NotificationStatus.DELIVERED,
        failed: NotificationStatus.FAILED,
        undelivered: NotificationStatus.FAILED,
      };

      const messageStatus = message.status ? String(message.status) : 'sent';
      return statusMap[messageStatus] || NotificationStatus.SENT;
    } catch (error) {
      this.logger.error(`Failed to get SMS status for ${messageId}`, (error as Error).message);
      return NotificationStatus.SENT;
    }
  }
}
