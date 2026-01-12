/**
 * @fileoverview Template de email para reset de contraseña
 * @module modules/notification/templates
 */

import { BaseEmailTemplate, IBaseTemplateData } from './base.template';

/**
 * Interface para datos del template de reset de contraseña
 */
export interface IResetPasswordEmailData extends IBaseTemplateData {
  /** Nombre del usuario */
  userName?: string;
  /** URL de reset de contraseña */
  resetUrl: string;
  /** Tiempo de expiración del link (en horas) */
  expirationHours?: number;
  /** IP desde donde se solicitó el reset */
  requestIp?: string;
  /** User agent desde donde se solicitó */
  requestUserAgent?: string;
  /** Fecha/hora de la solicitud */
  requestedAt?: Date;
}

/**
 * Template de email para reset de contraseña
 *
 * Características:
 * - Alerta de seguridad
 * - Link de reset con expiración
 * - Información de la solicitud (IP, fecha)
 * - Instrucciones claras
 * - Advertencia si no fue el usuario
 */
export class ResetPasswordEmailTemplate extends BaseEmailTemplate {
  /**
   * Generar HTML del email de reset de contraseña
   *
   * @param data - Datos del template
   * @returns HTML del email
   */
  static generate(data: IResetPasswordEmailData): string {
    const expirationHours = data.expirationHours || 1;
    const requestedAt = data.requestedAt
      ? data.requestedAt.toLocaleString('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : new Date().toLocaleString('es-ES', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

    const content = `
      <h1>Restablece tu contraseña 🔐</h1>
      
      <p>
        Hola${data.userName ? ' ' + data.userName : ''},
      </p>
      
      <p>
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
        Si fuiste tú quien la solicitó, haz clic en el botón de abajo para crear una nueva contraseña.
      </p>
      
      <div class="text-center">
        ${this.createButton('Restablecer Contraseña', data.resetUrl)}
      </div>
      
      ${this.createInfoBox(`
        <p style="margin: 0;">
          <strong>Este link expirará en ${expirationHours} hora${expirationHours > 1 ? 's' : ''}.</strong>
          Por razones de seguridad, deberás solicitar un nuevo link si no completas el proceso a tiempo.
        </p>
      `)}
      
      ${this.createDivider()}
      
      <h2>Información de la solicitud</h2>
      
      <p>Por tu seguridad, aquí están los detalles de esta solicitud:</p>
      
      <ul style="margin-left: 20px; margin-bottom: 20px; list-style: none; padding-left: 0;">
        <li style="margin-bottom: 8px;">
          <strong>Fecha:</strong> ${requestedAt}
        </li>
        ${
          data.requestIp
            ? `
        <li style="margin-bottom: 8px;">
          <strong>Dirección IP:</strong> ${data.requestIp}
        </li>
        `
            : ''
        }
        ${
          data.requestUserAgent
            ? `
        <li style="margin-bottom: 8px;">
          <strong>Dispositivo:</strong> ${this.formatUserAgent(data.requestUserAgent)}
        </li>
        `
            : ''
        }
      </ul>
      
      ${this.createWarningBox(`
        <p style="margin: 0;">
          <strong>⚠️ ¿No solicitaste este cambio?</strong><br>
          Si no fuiste tú quien solicitó restablecer la contraseña, ignora este email.
          Tu contraseña actual permanecerá sin cambios y tu cuenta está segura.
          <br><br>
          Si crees que alguien puede estar intentando acceder a tu cuenta, 
          te recomendamos cambiar tu contraseña inmediatamente e 
          <a href="mailto:${data.supportEmail || this.DEFAULT_CONFIG.supportEmail}">contactar a nuestro equipo de soporte</a>.
        </p>
      `)}
      
      ${this.createDivider()}
      
      <p class="text-muted">
        Si el botón no funciona, copia y pega el siguiente link en tu navegador:
      </p>
      
      <p class="text-muted" style="word-break: break-all;">
        ${data.resetUrl}
      </p>
    `;

    return this.generateHtml(content, data);
  }

  /**
   * Generar versión de texto plano
   *
   * @param data - Datos del template
   * @returns Texto plano
   */
  static generateText(data: IResetPasswordEmailData): string {
    const expirationHours = data.expirationHours || 1;
    const requestedAt = data.requestedAt
      ? data.requestedAt.toLocaleString('es-ES')
      : new Date().toLocaleString('es-ES');

    let text = `Restablece tu contraseña\n\n`;
    text += `Hola${data.userName ? ' ' + data.userName : ''},\n\n`;
    text += `Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.\n`;
    text += `Si fuiste tú quien la solicitó, usa el siguiente link para crear una nueva contraseña:\n\n`;
    text += `${data.resetUrl}\n\n`;
    text += `IMPORTANTE: Este link expirará en ${expirationHours} hora${expirationHours > 1 ? 's' : ''}.\n\n`;
    text += `---\n\n`;
    text += `Información de la solicitud:\n`;
    text += `- Fecha: ${requestedAt}\n`;

    if (data.requestIp) {
      text += `- Dirección IP: ${data.requestIp}\n`;
    }

    if (data.requestUserAgent) {
      text += `- Dispositivo: ${this.formatUserAgent(data.requestUserAgent)}\n`;
    }

    text += `\n`;
    text += `⚠️ ¿No solicitaste este cambio?\n\n`;
    text += `Si no fuiste tú quien solicitó restablecer la contraseña, ignora este email.\n`;
    text += `Tu contraseña actual permanecerá sin cambios y tu cuenta está segura.\n\n`;
    text += `Si crees que alguien puede estar intentando acceder a tu cuenta, contacta a soporte: ${data.supportEmail || this.DEFAULT_CONFIG.supportEmail}\n\n`;
    text += `---\n`;
    text += `© ${new Date().getFullYear()} ${data.appName || this.DEFAULT_CONFIG.appName}. Todos los derechos reservados.\n`;

    return text;
  }

  /**
   * Formatear User Agent a texto legible
   */
  private static formatUserAgent(userAgent: string): string {
    // Detectar browser
    if (userAgent.includes('Chrome')) {
      return 'Google Chrome';
    } else if (userAgent.includes('Firefox')) {
      return 'Mozilla Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    } else if (userAgent.includes('Edge')) {
      return 'Microsoft Edge';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      return 'Internet Explorer';
    }

    // Si no se puede detectar, retornar versión corta
    return userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : '');
  }
}
