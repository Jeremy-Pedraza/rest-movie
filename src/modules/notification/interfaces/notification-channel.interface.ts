/**
 * @fileoverview Interface base para canales de notificación
 * @module modules/notification/interfaces
 */

import {
  NotificationChannel,
  NotificationPriority,
} from '../dto/send-notification.dto';

/**
 * Estado de entrega de una notificación
 */
export enum NotificationStatus {
  PENDING = 'pending', // Pendiente de envío
  QUEUED = 'queued', // En cola
  SENDING = 'sending', // Enviando
  SENT = 'sent', // Enviado exitosamente
  DELIVERED = 'delivered', // Entregado al destinatario
  FAILED = 'failed', // Falló el envío
  BOUNCED = 'bounced', // Rebotado
  REJECTED = 'rejected', // Rechazado por el destinatario/proveedor
  CANCELLED = 'cancelled', // Cancelado
}

/**
 * Opciones base para envío de notificaciones
 */
export interface INotificationOptions {
  /** Canal de notificación */
  channel: NotificationChannel;

  /** Destinatario(s) */
  recipient: string | string[];

  /** Asunto o título */
  subject: string;

  /** Contenido del mensaje */
  message: string;

  /** Prioridad */
  priority?: NotificationPriority;

  /** Datos adicionales */
  data?: Record<string, any>;

  /** Template a usar */
  template?: string;

  /** Datos del template */
  templateData?: Record<string, any>;

  /** Enviar de forma asíncrona */
  async?: boolean;

  /** Programar envío */
  scheduledAt?: Date | string;

  /** Metadata adicional */
  metadata?: Record<string, any>;
}

/**
 * Interface abstracta para canales de notificación
 * Todos los canales (Email, SMS, Push) deben implementar esta interface
 */
export interface INotificationChannel {
  /**
   * Nombre del canal
   */
  readonly name: NotificationChannel;

  /**
   * Validar que las opciones sean correctas para este canal
   * @param options - Opciones de notificación
   * @returns true si las opciones son válidas
   * @throws Error si las opciones son inválidas
   */
  validate(options: INotificationOptions): Promise<boolean>;

  /**
   * Enviar notificación por este canal
   * @param options - Opciones de notificación
   * @returns Respuesta del envío
   */
  send(options: INotificationOptions): Promise<INotificationResponse>;

  /**
   * Verificar el estado de una notificación enviada
   * @param messageId - ID del mensaje
   * @returns Estado de la notificación
   */
  getStatus?(messageId: string): Promise<NotificationStatus>;

  /**
   * Verificar si el canal está disponible/configurado
   * @returns true si el canal está disponible
   */
  isAvailable(): Promise<boolean>;
}
