/**
 * @fileoverview Clase abstracta base para canales de notificación
 * @module modules/notification/channels
 *
 * Todos los canales (Email, SMS, Push) deben extender esta clase e implementar:
 * - send(): Lógica específica de envío
 * - validate(): Validaciones específicas del canal
 * - isAvailable(): Verificar si el canal está configurado
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService, LogContext } from '@modules/logger';
import { NotificationChannel } from '../dto/send-notification.dto';
import {
  INotificationChannel,
  INotificationOptions,
  INotificationResponse,
  NotificationStatus,
} from '../interfaces';

/**
 * Clase abstracta base para canales de notificación
 *
 * Proporciona funcionalidad común para todos los canales:
 * - Logging consistente
 * - Acceso a configuración
 * - Métodos helper para validación
 * - Estructura base de respuestas
 *
 * @abstract
 */
export abstract class NotificationChannelAbstract implements INotificationChannel {
  /**
   * Logger específico del canal
   */
  protected readonly logger: Logger;

  /**
   * Servicio de configuración para acceder a variables de entorno
   */
  protected readonly configService: ConfigService;
  protected readonly loggerService?: LoggerService;

  /**
   * Constructor base
   * @param channelName - Nombre del canal para logging
   * @param configService - Servicio de configuración NestJS
   */
  constructor(channelName: string, configService: ConfigService, loggerService?: LoggerService) {
    this.logger = new Logger(`${channelName}Channel`);
    this.configService = configService;
    this.loggerService = loggerService;
  }

  /**
   * Nombre del canal (debe ser implementado por cada canal)
   */
  abstract readonly name: NotificationChannel;

  /**
   * Enviar notificación por el canal
   * Debe ser implementado por cada canal con su lógica específica
   *
   * @param options - Opciones de notificación
   * @returns Respuesta del envío
   */
  abstract send(options: INotificationOptions): Promise<INotificationResponse>;

  /**
   * Validar opciones específicas del canal
   * Debe ser implementado por cada canal con sus validaciones
   *
   * @param options - Opciones a validar
   * @returns true si las opciones son válidas
   * @throws Error si las opciones son inválidas
   */
  abstract validate(options: INotificationOptions): Promise<boolean>;

  /**
   * Verificar si el canal está disponible/configurado
   * Debe ser implementado por cada canal
   *
   * @returns true si el canal está disponible
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Obtener estado de una notificación (opcional)
   * Por defecto retorna 'sent' si no se implementa
   *
   * @param messageId - ID del mensaje
   * @returns Estado de la notificación
   */
  getStatus(messageId: string): Promise<NotificationStatus> {
    this.logWarn(
      `getStatus() not implemented for ${this.name} channel. MessageId: ${messageId}`,
    );
    return Promise.resolve(NotificationStatus.SENT);
  }

  /**
   * Crear respuesta de error estandarizada
   *
   * @param error - Error capturado
   * @param recipient - Destinatario(s)
   * @returns Respuesta de error
   */
  protected createErrorResponse(
    error: unknown,
    recipient: string | string[],
  ): INotificationResponse {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.logError(`Error sending notification: ${errorObj.message}`, errorObj.stack);

    return {
      success: false,
      channel: this.name,
      status: NotificationStatus.FAILED,
      recipient,
      sentAt: new Date(),
      error: errorObj.message || 'Unknown error',
      errorCode: (error as { code?: string }).code || 'NOTIFICATION_ERROR',
      metadata: {
        errorDetails: error,
      },
    };
  }

  /**
   * Crear respuesta exitosa estandarizada
   *
   * @param messageId - ID del mensaje generado
   * @param recipient - Destinatario(s)
   * @param metadata - Metadata adicional
   * @returns Respuesta exitosa
   */
  protected createSuccessResponse(
    messageId: string,
    recipient: string | string[],
    metadata?: Record<string, unknown>,
  ): INotificationResponse {
    return {
      success: true,
      messageId,
      channel: this.name,
      status: NotificationStatus.SENT,
      recipient,
      sentAt: new Date(),
      metadata,
    };
  }

  /**
   * Obtener variable de configuración
   * Helper para acceder a variables de entorno de forma tipada
   *
   * @param key - Clave de la variable
   * @param defaultValue - Valor por defecto
   * @returns Valor de la variable
   */
  protected getConfig<T = string>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue as T);
  }

  /**
   * Obtener variable de configuración requerida
   * Lanza error si la variable no existe
   *
   * @param key - Clave de la variable
   * @returns Valor de la variable
   * @throws Error si la variable no existe
   */
  protected getRequiredConfig<T = string>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined || value === null || value === '') {
      throw new Error(`Required configuration missing: ${key}. Please check your .env file.`);
    }
    return value;
  }

  /**
   * Verificar si una variable de configuración existe
   *
   * @param key - Clave de la variable
   * @returns true si existe y no está vacía
   */
  protected hasConfig(key: string): boolean {
    const value = this.configService.get(key);
    return value !== undefined && value !== null && value !== '';
  }

  /**
   * Validar array de destinatarios
   *
   * @param recipients - Array de destinatarios
   * @param minLength - Mínimo de destinatarios requeridos
   * @returns true si es válido
   * @throws Error si es inválido
   */
  protected validateRecipients(recipients: string | string[], minLength = 1): boolean {
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];

    if (recipientArray.length < minLength) {
      throw new Error(`At least ${minLength} recipient(s) required`);
    }

    if (recipientArray.some((r) => !r || r.trim() === '')) {
      throw new Error('Empty recipients are not allowed');
    }

    return true;
  }

  /**
   * Normalizar destinatarios a array
   *
   * @param recipients - Destinatario(s)
   * @returns Array de destinatarios
   */
  protected normalizeRecipients(recipients: string | string[]): string[] {
    return Array.isArray(recipients) ? recipients : [recipients];
  }

  /**
   * Log de inicio de envío
   *
   * @param recipient - Destinatario(s)
   * @param metadata - Metadata adicional
   */
  protected logSendStart(recipient: string | string[], metadata?: Record<string, unknown>): void {
    const recipientCount = Array.isArray(recipient) ? recipient.length : 1;
    this.logger.log(
      `Sending notification to ${recipientCount} recipient(s) via ${this.name}`,
      metadata,
    );
  }

  /**
   * Log de envío exitoso
   *
   * @param messageId - ID del mensaje
   * @param recipient - Destinatario(s)
   */
  protected logSendSuccess(messageId: string, recipient: string | string[]): void {
    const recipientCount = Array.isArray(recipient) ? recipient.length : 1;
    this.logger.log(
      `Notification sent successfully via ${this.name}. MessageId: ${messageId}, Recipients: ${recipientCount}`,
    );
  }

  /**
   * Log de envío fallido
   *
   * @param error - Error capturado
   * @param recipient - Destinatario(s)
   */
  protected logSendError(error: unknown, recipient: string | string[]): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const recipientCount = Array.isArray(recipient) ? recipient.length : 1;
    this.logError(
      `Failed to send notification via ${this.name}. Recipients: ${recipientCount}. Error: ${errorObj.message}`,
      errorObj.stack,
    );
  }

  protected logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.EXTERNAL,
      service: `${this.name}Channel`,
    });
  }

  protected logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : typeof details === 'string' ? details : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.EXTERNAL,
      service: `${this.name}Channel`,
      stack,
    });
  }
}

