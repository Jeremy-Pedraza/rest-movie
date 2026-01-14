/**
 * @fileoverview Canal de Push Notifications usando Firebase Cloud Messaging
 * @module modules/notification/channels
 *
 * Implementa envío de Push Notifications via FCM con:
 * - Android + iOS + Web
 * - Notificaciones con imagen
 * - Deep linking
 * - Badges y sonidos
 * - Agrupación (tags)
 * - TTL configurable
 *
 * Modo stub disponible si Firebase no está configurado (development)
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '../dto/send-notification.dto';
import { INotificationOptions, IPushResponse, NotificationStatus } from '../interfaces';
import { NotificationChannelAbstract } from './notification-channel.abstract';

/**
 * Canal de Push Notifications usando Firebase Cloud Messaging
 *
 * Configuración requerida en .env (opcional):
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_CLIENT_EMAIL
 *
 * Si no está configurado, usa modo stub para development
 *
 * @injectable
 */
@Injectable()
export class PushChannel extends NotificationChannelAbstract {
  /**
   * Nombre del canal
   */
  readonly name = NotificationChannel.PUSH;

  /**
   * Firebase Admin SDK (lazy loaded)
   */
  private firebaseAdmin: any = null;

  /**
   * Flag para modo stub (cuando Firebase no está configurado)
   */
  private stubMode = false;

  /**
   * Constructor
   */
  constructor(configService: ConfigService) {
    super('Push', configService);
  }

  /**
   * Inicializar Firebase Admin SDK
   * Se llama automáticamente al primer envío
   */
  private async initializeFirebase(): Promise<void> {
    if (this.firebaseAdmin || this.stubMode) {
      return;
    }

    try {
      const projectId = this.getConfig<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.getConfig<string>('FIREBASE_PRIVATE_KEY');
      const clientEmail = this.getConfig<string>('FIREBASE_CLIENT_EMAIL');

      // Si no hay credenciales, usar modo stub
      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('Firebase credentials not configured. Using stub mode.');
        this.stubMode = true;
        return;
      }

      // Importar Firebase Admin dinámicamente
      const admin = await import('firebase-admin');

      // Inicializar Firebase
      this.firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Corregir formato de private key
          clientEmail,
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Firebase Admin SDK. Using stub mode.',
        (error as Error).stack,
      );
      this.stubMode = true;
    }
  }

  /**
   * Enviar Push Notification
   *
   * @param options - Opciones de notificación
   * @returns Respuesta del envío
   */
  async send(options: INotificationOptions): Promise<IPushResponse> {
    try {
      // Validar opciones
      await this.validate(options);

      // Inicializar Firebase si no existe
      await this.initializeFirebase();

      const tokens = this.normalizeRecipients(options.recipient);
      this.logSendStart(tokens, { title: options.subject });

      // Si estamos en modo stub, retornar respuesta simulada
      if (this.stubMode) {
        return this.sendStub(options);
      }

      // Enviar Push real via Firebase
      return await this.sendFirebase(options);
    } catch (error) {
      this.logSendError(error, options.recipient);
      return this.createErrorResponse(error, options.recipient) as IPushResponse;
    }
  }

  /**
   * Enviar Push Notification via Firebase
   */
  private async sendFirebase(options: INotificationOptions): Promise<IPushResponse> {
    const tokens = this.normalizeRecipients(options.recipient);

    // Preparar mensaje FCM
    const message = this.buildFcmMessage(options);

    // Enviar a múltiples tokens
    const response = await this.firebaseAdmin.messaging().sendEachForMulticast({
      ...message,
      tokens,
    });

    // Procesar respuestas
    const successfulTokens: string[] = [];
    const failedTokens: string[] = [];
    const invalidTokens: string[] = [];
    const results: Array<{
      token: string;
      success: boolean;
      error?: string;
      messageId?: string;
    }> = [];

    response.responses.forEach((resp: any, index: number) => {
      const token = tokens[index];

      if (resp.success) {
        successfulTokens.push(token);
        results.push({
          token,
          success: true,
          messageId: resp.messageId,
        });
      } else {
        failedTokens.push(token);

        // Detectar tokens inválidos
        const error = resp.error;
        if (
          error?.code === 'messaging/invalid-registration-token' ||
          error?.code === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(token);
        }

        const errorMessage = error?.message ? String(error.message) : 'Unknown error';
        results.push({
          token,
          success: false,
          error: errorMessage,
        });

        this.logger.error(
          `Failed to send push to token ${token.substring(0, 10)}...: ${errorMessage}`,
        );
      }
    });

    const success = successfulTokens.length > 0;
    const status = success ? NotificationStatus.SENT : NotificationStatus.FAILED;

    // Tipar correctamente messageId
    const firstMessageId = response.responses[0]?.messageId;
    const messageId = firstMessageId ? String(firstMessageId) : 'batch';

    if (success) {
      this.logSendSuccess(messageId, successfulTokens);
    }

    return {
      success,
      messageId,
      pushId: messageId,
      channel: this.name,
      status,
      recipient: tokens,
      sentAt: new Date(),
      successfulTokens,
      failedTokens,
      invalidTokens,
      results,
      stats: {
        total: tokens.length,
        success: successfulTokens.length,
        failure: failedTokens.length,
      },
      metadata: {
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    };
  }

  /**
   * Enviar Push stub (para development sin Firebase)
   */
  private sendStub(options: INotificationOptions): IPushResponse {
    const tokens = this.normalizeRecipients(options.recipient);
    const stubMessageId = `stub_push_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    this.logger.warn(`[STUB MODE] Push would be sent to ${tokens.length} tokens`);
    this.logger.warn(`[STUB MODE] Title: ${options.subject}`);
    this.logger.warn(`[STUB MODE] Body: ${options.message}`);

    return {
      success: true,
      messageId: stubMessageId,
      pushId: stubMessageId,
      channel: this.name,
      status: NotificationStatus.SENT,
      recipient: tokens,
      sentAt: new Date(),
      successfulTokens: tokens,
      failedTokens: [],
      invalidTokens: [],
      results: tokens.map((token) => ({
        token,
        success: true,
        messageId: stubMessageId,
      })),
      stats: {
        total: tokens.length,
        success: tokens.length,
        failure: 0,
      },
      metadata: {
        stubMode: true,
        title: options.subject,
        body: options.message,
      },
    };
  }

  /**
   * Construir mensaje FCM
   */
  private buildFcmMessage(options: INotificationOptions): any {
    const pushOptions = options.data?.push || {};

    const message: any = {
      notification: {
        title: options.subject,
        body: options.message,
      },
      data: options.data || {},
    };

    // Imagen
    if (pushOptions.imageUrl) {
      message.notification.imageUrl = pushOptions.imageUrl;
    }

    // Android specific
    if (pushOptions.platform === 'android' || !pushOptions.platform) {
      message.android = {
        notification: {
          icon: pushOptions.iconUrl,
          color: pushOptions.color,
          tag: pushOptions.tag,
          channelId: pushOptions.channelId || 'default',
          clickAction: pushOptions.clickAction,
        },
        ttl: pushOptions.timeToLive ? pushOptions.timeToLive * 1000 : undefined,
        priority: this.mapPriority(options.priority),
      };
    }

    // iOS specific
    if (pushOptions.platform === 'ios' || !pushOptions.platform) {
      message.apns = {
        payload: {
          aps: {
            sound: pushOptions.sound || 'default',
            badge: pushOptions.badge,
            'content-available': pushOptions.showInForeground ? 1 : 0,
          },
        },
        fcmOptions: {
          imageUrl: pushOptions.imageUrl,
        },
      };
    }

    // Web specific
    if (pushOptions.platform === 'web' || !pushOptions.platform) {
      message.webpush = {
        notification: {
          icon: pushOptions.iconUrl,
          image: pushOptions.imageUrl,
          badge: pushOptions.badge,
        },
        fcmOptions: {
          link: pushOptions.clickAction,
        },
      };
    }

    return message;
  }

  /**
   * Mapear prioridad a formato FCM
   */
  private mapPriority(priority?: string): string {
    const priorityMap: Record<string, string> = {
      low: 'normal',
      normal: 'normal',
      high: 'high',
      urgent: 'high',
    };
    return priorityMap[priority || 'normal'] || 'normal';
  }

  /**
   * Validar opciones de Push
   *
   * @param options - Opciones a validar
   * @returns true si son válidas
   * @throws Error si son inválidas
   */
  validate(options: INotificationOptions): Promise<boolean> {
    try {
      // Validar tokens
      this.validateRecipients(options.recipient);

      // Validar título
      if (!options.subject || options.subject.trim() === '') {
        return Promise.reject(new Error('Push notification title is required'));
      }

      // Validar body
      if (!options.message || options.message.trim() === '') {
        return Promise.reject(new Error('Push notification body is required'));
      }

      // Validar longitud de título (máximo 100 caracteres)
      if (options.subject.length > 100) {
        return Promise.reject(
          new Error('Push notification title exceeds maximum length of 100 characters'),
        );
      }

      // Validar longitud de body (máximo 500 caracteres)
      if (options.message.length > 500) {
        return Promise.reject(
          new Error('Push notification body exceeds maximum length of 500 characters'),
        );
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
    const enabled = this.getConfig<boolean>('NOTIFICATION_PUSH_ENABLED', false);
    if (!enabled) {
      this.logger.warn('Push notifications are disabled');
      return false;
    }

    try {
      // Inicializar Firebase
      await this.initializeFirebase();

      // Si estamos en modo stub, considerar disponible
      if (this.stubMode) {
        this.logger.log('Push channel is available (stub mode)');
        return true;
      }

      // Verificar configuración de Firebase
      const hasProjectId = this.hasConfig('FIREBASE_PROJECT_ID');
      const hasPrivateKey = this.hasConfig('FIREBASE_PRIVATE_KEY');
      const hasClientEmail = this.hasConfig('FIREBASE_CLIENT_EMAIL');

      const available = hasProjectId && hasPrivateKey && hasClientEmail;

      if (available) {
        this.logger.log('Push channel is available (Firebase configured)');
      } else {
        this.logger.warn('Push channel is not fully configured');
      }

      return available;
    } catch (error) {
      this.logger.error('Push channel is not available', (error as Error).message);
      return false;
    }
  }
}
