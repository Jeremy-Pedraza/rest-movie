/**
 * @fileoverview Template de email para verificación de cuenta
 * @module modules/notification/templates
 */

import { BaseEmailTemplate, IBaseTemplateData } from './base.template';

/**
 * Interface para datos del template de verificación de email
 */
export interface IVerifyEmailData extends IBaseTemplateData {
  /** Nombre del usuario */
  userName?: string;
  /** Email a verificar */
  userEmail: string;
  /** URL de verificación */
  verificationUrl: string;
  /** Código de verificación (alternativa al link) */
  verificationCode?: string;
  /** Tiempo de expiración del link (en horas) */
  expirationHours?: number;
}

/**
 * Template de email para verificación de cuenta
 *
 * Características:
 * - Link de verificación
 * - Código de verificación alternativo (opcional)
 * - Tiempo de expiración claro
 * - Instrucciones paso a paso
 * - Diseño limpio y directo
 */
export class VerifyEmailTemplate extends BaseEmailTemplate {
  /**
   * Generar HTML del email de verificación
   *
   * @param data - Datos del template
   * @returns HTML del email
   */
  static generate(data: IVerifyEmailData): string {
    const expirationHours = data.expirationHours || 24;

    const content = `
      <h1>Verifica tu dirección de email ✉️</h1>
      
      <p>
        Hola${data.userName ? ' ' + data.userName : ''},
      </p>
      
      <p>
        Gracias por registrarte. Estás a solo un paso de completar tu registro.
        Por favor verifica tu dirección de email haciendo clic en el botón de abajo.
      </p>
      
      <div class="text-center">
        ${this.createButton('Verificar Email', data.verificationUrl)}
      </div>
      
      ${this.createInfoBox(`
        <p style="margin: 0;">
          Este link de verificación expirará en <strong>${expirationHours} horas</strong>.
          Asegúrate de completar la verificación antes de que expire.
        </p>
      `)}
      
      ${
        data.verificationCode
          ? `
      ${this.createDivider()}
      
      <h2>¿El link no funciona?</h2>
      
      <p>
        Si tienes problemas con el link, puedes usar el siguiente código de verificación:
      </p>
      
      <div style="background-color: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${data.colors?.primary || this.DEFAULT_CONFIG.colors.primary};">
          ${data.verificationCode}
        </p>
      </div>
      
      <p class="text-muted text-center">
        Ingresa este código en la página de verificación
      </p>
      `
          : ''
      }
      
      ${this.createDivider()}
      
      <h2>¿Por qué verificar tu email?</h2>
      
      <p>
        Verificar tu dirección de email nos ayuda a:
      </p>
      
      <ul style="margin-left: 20px; margin-bottom: 20px;">
        <li style="margin-bottom: 10px;">Asegurar que podamos contactarte cuando sea necesario</li>
        <li style="margin-bottom: 10px;">Proteger tu cuenta de accesos no autorizados</li>
        <li style="margin-bottom: 10px;">Enviarte notificaciones importantes sobre tu cuenta</li>
        <li style="margin-bottom: 10px;">Recuperar tu contraseña si la olvidas</li>
      </ul>
      
      ${this.createWarningBox(`
        <p style="margin: 0;">
          <strong>⚠️ ¿No te registraste?</strong><br>
          Si recibiste este email por error y no creaste una cuenta, simplemente ignora este mensaje.
          No se realizará ninguna acción y tu email no será registrado en nuestro sistema.
        </p>
      `)}
      
      ${this.createDivider()}
      
      <p class="text-muted">
        Si el botón no funciona, copia y pega el siguiente link en tu navegador:
      </p>
      
      <p class="text-muted" style="word-break: break-all;">
        ${data.verificationUrl}
      </p>
      
      <p class="text-center">
        Verificando: <strong>${data.userEmail}</strong>
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
  static generateText(data: IVerifyEmailData): string {
    const expirationHours = data.expirationHours || 24;

    let text = `Verifica tu dirección de email\n\n`;
    text += `Hola${data.userName ? ' ' + data.userName : ''},\n\n`;
    text += `Gracias por registrarte. Estás a solo un paso de completar tu registro.\n`;
    text += `Por favor verifica tu dirección de email usando el siguiente link:\n\n`;
    text += `${data.verificationUrl}\n\n`;
    text += `IMPORTANTE: Este link de verificación expirará en ${expirationHours} horas.\n\n`;

    if (data.verificationCode) {
      text += `---\n\n`;
      text += `¿El link no funciona?\n\n`;
      text += `Si tienes problemas con el link, puedes usar el siguiente código de verificación:\n\n`;
      text += `${data.verificationCode}\n\n`;
      text += `Ingresa este código en la página de verificación.\n\n`;
    }

    text += `---\n\n`;
    text += `¿Por qué verificar tu email?\n\n`;
    text += `Verificar tu dirección de email nos ayuda a:\n`;
    text += `- Asegurar que podamos contactarte cuando sea necesario\n`;
    text += `- Proteger tu cuenta de accesos no autorizados\n`;
    text += `- Enviarte notificaciones importantes sobre tu cuenta\n`;
    text += `- Recuperar tu contraseña si la olvidas\n\n`;
    text += `⚠️ ¿No te registraste?\n`;
    text += `Si recibiste este email por error, simplemente ignóralo.\n\n`;
    text += `Verificando: ${data.userEmail}\n\n`;
    text += `---\n`;
    text += `© ${new Date().getFullYear()} ${data.appName || this.DEFAULT_CONFIG.appName}. Todos los derechos reservados.\n`;

    return text;
  }
}
