/**
 * @fileoverview Interface para respuestas de notificación
 * @module modules/notification/interfaces
 */

import {
  NotificationChannel,
  NotificationPriority,
} from '../dto/send-notification.dto';
import { NotificationStatus } from './notification-channel.interface';

/**
 * Respuesta base de una notificación enviada
 */
export interface INotificationResponse {
  /** Éxito del envío */
  success: boolean;

  /** ID del mensaje generado por el proveedor */
  messageId?: string;

  /** Canal utilizado */
  channel: NotificationChannel;

  /** Estado del envío */
  status: NotificationStatus;

  /** Destinatario(s) */
  recipient: string | string[];

  /** Timestamp del envío */
  sentAt: Date;

  /** Mensaje de error (si falló) */
  error?: string;

  /** Código de error */
  errorCode?: string;

  /** Detalles adicionales del proveedor */
  providerResponse?: Record<string, any>;

  /** Metadata adicional */
  metadata?: Record<string, any>;
}

/**
 * Respuesta específica de Email
 */
export interface IEmailResponse extends INotificationResponse {
  channel: NotificationChannel.EMAIL;

  /** ID del mensaje de email */
  emailId?: string;

  /** IDs aceptados por el servidor SMTP */
  accepted?: string[];

  /** IDs rechazados por el servidor SMTP */
  rejected?: string[];

  /** Respuesta del servidor SMTP */
  smtpResponse?: string;

  /** Tamaño del mensaje en bytes */
  messageSize?: number;
}

/**
 * Respuesta específica de SMS
 */
export interface ISmsResponse extends INotificationResponse {
  channel: NotificationChannel.SMS;

  /** ID del SMS en el proveedor (Twilio, etc.) */
  smsId?: string;

  /** Segmentos del SMS (si es multi-parte) */
  segments?: number;

  /** Precio del envío */
  price?: {
    amount: number;
    currency: string;
  };

  /** Número desde el que se envió */
  from?: string;

  /** Estado de entrega */
  deliveryStatus?: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
}

/**
 * Respuesta específica de Push Notification
 */
export interface IPushResponse extends INotificationResponse {
  channel: NotificationChannel.PUSH;

  /** ID de la notificación push */
  pushId?: string;

  /** IDs de los tokens exitosos */
  successfulTokens?: string[];

  /** IDs de los tokens fallidos */
  failedTokens?: string[];

  /** Tokens inválidos que deben ser eliminados */
  invalidTokens?: string[];

  /** Resultados individuales por token */
  results?: Array<{
    token: string;
    success: boolean;
    error?: string;
    messageId?: string;
  }>;

  /** Estadísticas del envío */
  stats?: {
    total: number;
    success: number;
    failure: number;
  };
}

/**
 * Respuesta de envío multi-canal
 */
export interface IMultiChannelResponse {
  /** Éxito general (true si al menos un canal tuvo éxito) */
  success: boolean;

  /** Respuestas por canal */
  responses: {
    [key in NotificationChannel]?: INotificationResponse;
  };

  /** Canales exitosos */
  successfulChannels: NotificationChannel[];

  /** Canales fallidos */
  failedChannels: NotificationChannel[];

  /** Timestamp del envío */
  sentAt: Date;

  /** Metadata adicional */
  metadata?: Record<string, any>;
}

/**
 * Respuesta de notificación programada
 */
export interface IScheduledNotificationResponse {
  /** ID de la notificación programada */
  scheduleId: string;

  /** Canales programados */
  channels: NotificationChannel[];

  /** Fecha programada */
  scheduledFor: Date;

  /** Estado de la programación */
  status: 'scheduled' | 'cancelled' | 'sent';

  /** ID del job en la cola */
  jobId?: string;

  /** Metadata adicional */
  metadata?: Record<string, any>;
}

/**
 * Respuesta de notificación por template
 */
export interface ITemplateNotificationResponse extends INotificationResponse {
  /** Nombre del template usado */
  templateName: string;

  /** Datos del template */
  templateData: Record<string, any>;

  /** Versión del template */
  templateVersion?: string;
}

/**
 * Estadísticas de envío de notificaciones
 */
export interface INotificationStats {
  /** Total de notificaciones */
  total: number;

  /** Enviadas exitosamente */
  sent: number;

  /** Fallidas */
  failed: number;

  /** Pendientes */
  pending: number;

  /** Tasa de éxito (0-1) */
  successRate: number;

  /** Estadísticas por canal */
  byChannel: {
    [key in NotificationChannel]?: {
      total: number;
      sent: number;
      failed: number;
      successRate: number;
    };
  };

  /** Estadísticas por prioridad */
  byPriority: {
    [key in NotificationPriority]?: {
      total: number;
      sent: number;
      failed: number;
    };
  };

  /** Período de las estadísticas */
  period: {
    from: Date;
    to: Date;
  };
}
