/**
 * @fileoverview Template base para emails
 * @module modules/notification/templates
 *
 * Proporciona estructura común para todos los templates de email:
 * - Layout HTML base
 * - Estilos consistentes
 * - Variables de marca (logo, colores, nombre)
 * - Métodos helper para generar contenido
 */

/**
 * Interface para datos del template base
 */
export interface IBaseTemplateData {
  /** Nombre de la aplicación */
  appName?: string;
  /** URL del logo */
  logoUrl?: string;
  /** URL de la aplicación */
  appUrl?: string;
  /** Año actual (para footer) */
  year?: number;
  /** Información de contacto */
  supportEmail?: string;
  /** Colores personalizados */
  colors?: {
    primary?: string;
    secondary?: string;
    text?: string;
    background?: string;
  };
}

/**
 * Clase base para templates de email
 *
 * Proporciona:
 * - Layout HTML consistente
 * - Estilos predefinidos
 * - Header y footer reutilizables
 * - Métodos helper para contenido
 */
export abstract class BaseEmailTemplate {
  /**
   * Configuración por defecto
   */
  protected static readonly DEFAULT_CONFIG = {
    appName: 'Mokka Backend',
    appUrl: 'https://mokka.com',
    supportEmail: 'support@mokka.com',
    logoUrl: 'https://mokka.com/logo.png',
    colors: {
      primary: '#3B82F6', // Blue
      secondary: '#8B5CF6', // Purple
      text: '#1F2937', // Gray-800
      background: '#F9FAFB', // Gray-50
    },
  };

  /**
   * Generar HTML completo del email
   *
   * @param content - Contenido HTML del body
   * @param data - Datos del template
   * @returns HTML completo
   */
  protected static generateHtml(content: string, data: IBaseTemplateData = {}): string {
    const config = { ...this.DEFAULT_CONFIG, ...data };
    const year = data.year || new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${config.appName}</title>
  <style>
    ${this.getStyles(config)}
  </style>
</head>
<body>
  <div class="email-wrapper">
    ${this.getHeader(config)}
    
    <div class="email-content">
      ${content}
    </div>
    
    ${this.getFooter(config, year)}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Obtener estilos CSS
   */
  protected static getStyles(config: typeof BaseEmailTemplate.DEFAULT_CONFIG): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: ${config.colors.text};
        background-color: ${config.colors.background};
      }
      
      .email-wrapper {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
      }
      
      .email-header {
        background-color: ${config.colors.primary};
        padding: 30px 20px;
        text-align: center;
      }
      
      .email-header img {
        max-width: 150px;
        height: auto;
      }
      
      .email-header h1 {
        color: #ffffff;
        font-size: 24px;
        margin-top: 10px;
      }
      
      .email-content {
        padding: 40px 30px;
      }
      
      .email-content h1 {
        color: ${config.colors.primary};
        font-size: 28px;
        margin-bottom: 20px;
      }
      
      .email-content h2 {
        color: ${config.colors.text};
        font-size: 22px;
        margin-top: 30px;
        margin-bottom: 15px;
      }
      
      .email-content p {
        margin-bottom: 15px;
        font-size: 16px;
      }
      
      .button {
        display: inline-block;
        padding: 14px 30px;
        background-color: ${config.colors.primary};
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
        transition: background-color 0.3s;
      }
      
      .button:hover {
        background-color: ${config.colors.secondary};
      }
      
      .info-box {
        background-color: #F3F4F6;
        border-left: 4px solid ${config.colors.primary};
        padding: 15px 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      
      .warning-box {
        background-color: #FEF3C7;
        border-left: 4px solid #F59E0B;
        padding: 15px 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      
      .email-footer {
        background-color: #F9FAFB;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #E5E7EB;
      }
      
      .email-footer p {
        color: #6B7280;
        font-size: 14px;
        margin-bottom: 10px;
      }
      
      .email-footer a {
        color: ${config.colors.primary};
        text-decoration: none;
      }
      
      .divider {
        height: 1px;
        background-color: #E5E7EB;
        margin: 30px 0;
      }
      
      .text-center {
        text-align: center;
      }
      
      .text-muted {
        color: #6B7280;
        font-size: 14px;
      }
      
      @media only screen and (max-width: 600px) {
        .email-wrapper {
          width: 100% !important;
        }
        
        .email-content {
          padding: 25px 20px !important;
        }
        
        .email-content h1 {
          font-size: 24px !important;
        }
        
        .button {
          display: block;
          text-align: center;
        }
      }
    `;
  }

  /**
   * Generar header del email
   */
  protected static getHeader(config: typeof BaseEmailTemplate.DEFAULT_CONFIG): string {
    return `
      <div class="email-header">
        <img src="${config.logoUrl}" alt="${config.appName} Logo">
        <h1>${config.appName}</h1>
      </div>
    `;
  }

  /**
   * Generar footer del email
   */
  protected static getFooter(
    config: typeof BaseEmailTemplate.DEFAULT_CONFIG,
    year: number,
  ): string {
    return `
      <div class="email-footer">
        <p>
          © ${year} ${config.appName}. Todos los derechos reservados.
        </p>
        <p>
          ¿Necesitas ayuda? Contáctanos en 
          <a href="mailto:${config.supportEmail}">${config.supportEmail}</a>
        </p>
        <p class="text-muted">
          Este es un correo automático, por favor no respondas a este mensaje.
        </p>
      </div>
    `;
  }

  /**
   * Generar botón de acción
   */
  protected static createButton(text: string, url: string): string {
    return `<a href="${url}" class="button">${text}</a>`;
  }

  /**
   * Generar caja de información
   */
  protected static createInfoBox(content: string): string {
    return `<div class="info-box">${content}</div>`;
  }

  /**
   * Generar caja de advertencia
   */
  protected static createWarningBox(content: string): string {
    return `<div class="warning-box">${content}</div>`;
  }

  /**
   * Generar divisor
   */
  protected static createDivider(): string {
    return '<div class="divider"></div>';
  }

  /**
   * Generar texto plano desde HTML (básico)
   * Remueve tags HTML y formatea para texto plano
   */
  protected static htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }
}
