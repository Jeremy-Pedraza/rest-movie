/**
 * @fileoverview Template de email de bienvenida
 * @module modules/notification/templates
 */

import { BaseEmailTemplate, IBaseTemplateData } from './base.template';

/**
 * Interface para datos del template de bienvenida
 */
export interface IWelcomeEmailData extends IBaseTemplateData {
  /** Nombre del usuario */
  userName: string;
  /** Email del usuario */
  userEmail?: string;
  /** URL de activación de cuenta */
  activationUrl?: string;
  /** URL del dashboard */
  dashboardUrl?: string;
  /** Información adicional */
  additionalInfo?: string;
}

/**
 * Template de email de bienvenida
 *
 * Características:
 * - Mensaje de bienvenida personalizado
 * - Link de activación de cuenta (opcional)
 * - Link al dashboard (opcional)
 * - Información adicional (opcional)
 */
export class WelcomeEmailTemplate extends BaseEmailTemplate {
  /**
   * Generar HTML del email de bienvenida
   *
   * @param data - Datos del template
   * @returns HTML del email
   */
  static generate(data: IWelcomeEmailData): string {
    const content = `
      <h1>¡Bienvenido${data.userName ? ', ' + data.userName : ''}! 🎉</h1>
      
      <p>
        Nos alegra mucho tenerte con nosotros. Tu cuenta ha sido creada exitosamente
        y ya estás listo para comenzar a disfrutar de todos nuestros servicios.
      </p>
      
      ${
        data.userEmail
          ? `
      <p>
        Tu email de acceso es: <strong>${data.userEmail}</strong>
      </p>
      `
          : ''
      }
      
      ${
        data.activationUrl
          ? `
      <div class="text-center">
        ${this.createButton('Activar Cuenta', data.activationUrl)}
      </div>
      
      ${this.createInfoBox(`
        <p style="margin: 0;">
          <strong>Importante:</strong> Por favor activa tu cuenta haciendo clic en el botón de arriba.
          Este link expirará en 24 horas.
        </p>
      `)}
      `
          : ''
      }
      
      ${this.createDivider()}
      
      <h2>¿Qué puedes hacer ahora?</h2>
      
      <p>Aquí hay algunas cosas que puedes hacer para comenzar:</p>
      
      <ul style="margin-left: 20px; margin-bottom: 20px;">
        <li style="margin-bottom: 10px;">Completa tu perfil con tu información personal</li>
        <li style="margin-bottom: 10px;">Explora las funcionalidades disponibles</li>
        <li style="margin-bottom: 10px;">Configura tus preferencias de notificaciones</li>
        <li style="margin-bottom: 10px;">Invita a tus amigos o colegas</li>
      </ul>
      
      ${
        data.dashboardUrl
          ? `
      <div class="text-center">
        ${this.createButton('Ir al Dashboard', data.dashboardUrl)}
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
      
      ${this.createDivider()}
      
      <p>
        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
        Estamos aquí para ayudarte.
      </p>
      
      <p class="text-muted">
        ¡Gracias por unirte a nosotros!
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
  static generateText(data: IWelcomeEmailData): string {
    let text = `¡Bienvenido${data.userName ? ', ' + data.userName : ''}!\n\n`;

    text += `Nos alegra mucho tenerte con nosotros. Tu cuenta ha sido creada exitosamente y ya estás listo para comenzar a disfrutar de todos nuestros servicios.\n\n`;

    if (data.userEmail) {
      text += `Tu email de acceso es: ${data.userEmail}\n\n`;
    }

    if (data.activationUrl) {
      text += `IMPORTANTE: Por favor activa tu cuenta haciendo clic en el siguiente link:\n${data.activationUrl}\n\n`;
      text += `Este link expirará en 24 horas.\n\n`;
    }

    text += `¿Qué puedes hacer ahora?\n\n`;
    text += `- Completa tu perfil con tu información personal\n`;
    text += `- Explora las funcionalidades disponibles\n`;
    text += `- Configura tus preferencias de notificaciones\n`;
    text += `- Invita a tus amigos o colegas\n\n`;

    if (data.dashboardUrl) {
      text += `Ir al Dashboard: ${data.dashboardUrl}\n\n`;
    }

    if (data.additionalInfo) {
      text += `${data.additionalInfo}\n\n`;
    }

    text += `Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.\n\n`;
    text += `¡Gracias por unirte a nosotros!\n\n`;
    text += `---\n`;
    text += `© ${new Date().getFullYear()} ${data.appName || this.DEFAULT_CONFIG.appName}. Todos los derechos reservados.\n`;
    text += `Soporte: ${data.supportEmail || this.DEFAULT_CONFIG.supportEmail}`;

    return text;
  }
}
