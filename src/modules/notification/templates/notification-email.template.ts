/**
 * @fileoverview Template genérico de email para notificaciones
 * @module modules/notification/templates
 */

import { BaseEmailTemplate, IBaseTemplateData } from './base.template';

/**
 * Tipo de notificación
 */
export enum NotificationEmailType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Interface para datos del template de notificación genérica
 */
export interface INotificationEmailData extends IBaseTemplateData {
  /** Nombre del usuario */
  userName?: string;
  /** Título de la notificación */
  title: string;
  /** Mensaje principal */
  message: string;
  /** Tipo de notificación */
  type?: NotificationEmailType;
  /** URL de acción (opcional) */
  actionUrl?: string;
  /** Texto del botón de acción */
  actionText?: string;
  /** Lista de items adicionales */
  items?: string[];
  /** Información adicional (footer del contenido) */
  additionalInfo?: string;
  /** Mostrar timestamp */
  showTimestamp?: boolean;
}

/**
 * Template genérico de email para notificaciones
 *
 * Características:
 * - Flexible para cualquier tipo de notificación
 * - Soporte para diferentes tipos (info, success, warning, error)
 * - Botón de acción opcional
 * - Lista de items
 * - Personalización completa del contenido
 */
export class NotificationEmailTemplate extends BaseEmailTemplate {
  /**
   * Generar HTML del email de notificación
   *
   * @param data - Datos del template
   * @returns HTML del email
   */
  static generate(data: INotificationEmailData): string {
    const type = data.type || NotificationEmailType.INFO;
    const emoji = this.getTypeEmoji(type);
    const boxClass = this.getTypeBoxClass(type);

    const content = `
      <h1>${data.title} ${emoji}</h1>
      
      ${
        data.userName
          ? `
      <p>Hola ${data.userName},</p>
      `
          : ''
      }
      
      <div class="${boxClass}">
        <p style="margin: 0;">${data.message}</p>
      </div>
      
      ${
        data.items && data.items.length > 0
          ? `
      <ul style="margin-left: 20px; margin-top: 20px; margin-bottom: 20px;">
        ${data.items.map((item) => `<li style="margin-bottom: 10px;">${item}</li>`).join('')}
      </ul>
      `
          : ''
      }
      
      ${
        data.actionUrl && data.actionText
          ? `
      <div class="text-center">
        ${this.createButton(data.actionText, data.actionUrl)}
      </div>
      `
          : ''
      }
      
      ${
        data.additionalInfo
          ? `
      ${this.createDivider()}
      
      <p>${data.additionalInfo}</p>
      `
          : ''
      }
      
      ${
        data.showTimestamp
          ? `
      ${this.createDivider()}
      
      <p class="text-muted text-center">
        ${new Date().toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'short',
        })}
      </p>
      `
          : ''
      }
    `;

    return this.generateHtml(content, data);
  }

  /**
   * Generar versión de texto plano
   *
   * @param data - Datos del template
   * @returns Texto plano
   */
  static generateText(data: INotificationEmailData): string {
    const type = data.type || NotificationEmailType.INFO;
    const emoji = this.getTypeEmoji(type);

    let text = `${data.title} ${emoji}\n\n`;

    if (data.userName) {
      text += `Hola ${data.userName},\n\n`;
    }

    text += `${data.message}\n\n`;

    if (data.items && data.items.length > 0) {
      data.items.forEach((item) => {
        text += `- ${item}\n`;
      });
      text += '\n';
    }

    if (data.actionUrl && data.actionText) {
      text += `${data.actionText}: ${data.actionUrl}\n\n`;
    }

    if (data.additionalInfo) {
      text += `${data.additionalInfo}\n\n`;
    }

    if (data.showTimestamp) {
      text += `---\n`;
      text += `${new Date().toLocaleString('es-ES')}\n\n`;
    }

    text += `---\n`;
    text += `© ${new Date().getFullYear()} ${data.appName || this.DEFAULT_CONFIG.appName}. Todos los derechos reservados.\n`;

    return text;
  }

  /**
   * Obtener emoji según el tipo de notificación
   */
  private static getTypeEmoji(type: NotificationEmailType): string {
    const emojiMap: Record<NotificationEmailType, string> = {
      [NotificationEmailType.INFO]: 'ℹ️',
      [NotificationEmailType.SUCCESS]: '✅',
      [NotificationEmailType.WARNING]: '⚠️',
      [NotificationEmailType.ERROR]: '❌',
    };

    return emojiMap[type] || emojiMap[NotificationEmailType.INFO];
  }

  /**
   * Obtener clase CSS según el tipo de notificación
   */
  private static getTypeBoxClass(type: NotificationEmailType): string {
    const classMap: Record<NotificationEmailType, string> = {
      [NotificationEmailType.INFO]: 'info-box',
      [NotificationEmailType.SUCCESS]: 'info-box',
      [NotificationEmailType.WARNING]: 'warning-box',
      [NotificationEmailType.ERROR]: 'warning-box',
    };

    return classMap[type] || classMap[NotificationEmailType.INFO];
  }
}
