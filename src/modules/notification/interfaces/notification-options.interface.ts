/**
 * @fileoverview Interface para opciones adicionales de notificación
 * @module modules/notification/interfaces
 */

import { NotificationChannel, NotificationPriority } from '../dto/send-notification.dto';

/**
 * Opciones de configuración de Email
 */
export interface IEmailOptions {
  /** Email del remitente */
  from?: string;

  /** Email de respuesta */
  replyTo?: string;

  /** Emails en copia */
  cc?: string[];

  /** Emails en copia oculta */
  bcc?: string[];

  /** Archivos adjuntos */
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;

  /** Headers personalizados */
  headers?: Record<string, string>;

  /** Contenido en HTML */
  html?: string;

  /** Contenido en texto plano */
  text?: string;
}

/**
 * Opciones de configuración de SMS
 */
export interface ISmsOptions {
  /** Número remitente */
  from?: string;

  /** ID de campaña */
  campaignId?: string;

  /** URL de callback */
  callbackUrl?: string;

  /** Tiempo de validez (segundos) */
  validityPeriod?: number;

  /** Tipo de SMS */
  type?: 'transactional' | 'promotional' | 'alert';
}

/**
 * Opciones de configuración de Push
 */
export interface IPushOptions {
  /** Título de la notificación */
  title: string;

  /** Cuerpo de la notificación */
  body: string;

  /** URL de imagen */
  imageUrl?: string;

  /** URL de icono */
  iconUrl?: string;

  /** Acción al hacer clic */
  clickAction?: string;

  /** Sonido (iOS) */
  sound?: string;

  /** Badge (iOS) */
  badge?: number;

  /** Tag de agrupación (Android) */
  tag?: string;

  /** Color del icono (Android) */
  color?: string;

  /** Canal de notificación (Android) */
  channelId?: string;

  /** Tiempo de vida (segundos) */
  timeToLive?: number;

  /** Mostrar en foreground */
  showInForeground?: boolean;

  /** Plataforma objetivo */
  platform?: 'android' | 'ios' | 'web';
}

/**
 * Opciones de retry
 */
export interface IRetryOptions {
  /** Número máximo de reintentos */
  maxAttempts?: number;

  /** Delay inicial entre reintentos (ms) */
  initialDelay?: number;

  /** Factor de multiplicación del delay */
  backoffFactor?: number;

  /** Delay máximo entre reintentos (ms) */
  maxDelay?: number;
}

/**
 * Opciones de rate limiting
 */
export interface IRateLimitOptions {
  /** Máximo de envíos por período */
  maxPerPeriod?: number;

  /** Período en segundos */
  periodSeconds?: number;

  /** Estrategia si se excede el límite */
  strategy?: 'queue' | 'reject' | 'throttle';
}

/**
 * Opciones avanzadas de notificación
 */
export interface IAdvancedNotificationOptions {
  /** Canal específico */
  channel: NotificationChannel;

  /** Opciones de email (si canal es email) */
  email?: IEmailOptions;

  /** Opciones de SMS (si canal es sms) */
  sms?: ISmsOptions;

  /** Opciones de Push (si canal es push) */
  push?: IPushOptions;

  /** Opciones de retry */
  retry?: IRetryOptions;

  /** Opciones de rate limiting */
  rateLimit?: IRateLimitOptions;

  /** Prioridad */
  priority?: NotificationPriority;

  /** Timeout del envío (ms) */
  timeout?: number;

  /** ID de tracking personalizado */
  trackingId?: string;

  /** Tags para categorización */
  tags?: string[];

  /** Metadata adicional */
  metadata?: Record<string, any>;
}
