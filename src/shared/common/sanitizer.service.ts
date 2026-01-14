// src/shared/common/sanitizer.service.ts
import { Injectable } from '@nestjs/common';

/**
 * SanitizerService - Servicio para sanitización de datos
 *
 * Proporciona métodos para limpiar y sanitizar datos de entrada
 * para prevenir ataques XSS, SQL injection (capa adicional), etc.
 *
 * @example
 * ```typescript
 * const clean = this.sanitizer.sanitizeString(userInput);
 * const safeHtml = this.sanitizer.stripHtml(htmlContent);
 * ```
 */
@Injectable()
export class SanitizerService {
  /**
   * Caracteres HTML peligrosos y sus reemplazos
   */
  private readonly htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  /**
   * Sanitiza un string removiendo/escapando caracteres peligrosos
   *
   * @param input - String a sanitizar
   * @returns String sanitizado
   */
  sanitizeString(input: string | null | undefined): string {
    if (!input) return '';

    return input
      .toString()
      .trim()
      .replace(/[&<>"'`=/]/g, (char) => this.htmlEntities[char] || char);
  }

  /**
   * Alias de sanitizeString para compatibilidad
   * Sanitiza un texto removiendo/escapando caracteres peligrosos
   *
   * @param input - Texto a sanitizar
   * @returns Texto sanitizado
   */
  sanitizeText(input: string | null | undefined): string {
    return this.sanitizeString(input);
  }

  /**
   * Remueve todas las etiquetas HTML de un string
   *
   * @param input - String con posible HTML
   * @returns String sin etiquetas HTML
   */
  stripHtml(input: string | null | undefined): string {
    if (!input) return '';

    return input
      .toString()
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Sanitiza un email (lowercase, trim, validación básica)
   *
   * @param email - Email a sanitizar
   * @returns Email sanitizado
   */
  sanitizeEmail(email: string | null | undefined): string {
    if (!email) return '';

    return email.toString().toLowerCase().trim();
  }

  /**
   * Sanitiza un objeto recursivamente
   *
   * @param obj - Objeto a sanitizar
   * @returns Objeto con strings sanitizados
   */
  sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item: unknown): unknown => {
          if (typeof item === 'string') {
            return this.sanitizeString(item);
          }
          if (typeof item === 'object' && item !== null) {
            return this.sanitizeObject(item as Record<string, unknown>);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized as T;
  }

  /**
   * Sanitiza un string para uso en nombres de archivo
   *
   * @param filename - Nombre de archivo a sanitizar
   * @returns Nombre de archivo seguro
   */
  sanitizeFilename(filename: string | null | undefined): string {
    if (!filename) return '';

    return filename
      .toString()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase()
      .trim();
  }

  /**
   * Sanitiza un slug (URL-friendly)
   *
   * @param text - Texto a convertir en slug
   * @returns Slug sanitizado
   */
  sanitizeSlug(text: string | null | undefined): string {
    if (!text) return '';

    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .replace(/[\s_]+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno
      .replace(/^-|-$/g, ''); // Remover guiones al inicio/final
  }

  /**
   * Trunca un string a una longitud máxima
   *
   * @param text - Texto a truncar
   * @param maxLength - Longitud máxima
   * @param suffix - Sufijo a agregar si se trunca (default: '...')
   * @returns Texto truncado
   */
  truncate(text: string | null | undefined, maxLength: number, suffix: string = '...'): string {
    if (!text) return '';

    const str = text.toString().trim();

    if (str.length <= maxLength) return str;

    return str.substring(0, maxLength - suffix.length).trim() + suffix;
  }

  /**
   * Remueve espacios múltiples de un string
   *
   * @param text - Texto a limpiar
   * @returns Texto con espacios normalizados
   */
  normalizeSpaces(text: string | null | undefined): string {
    if (!text) return '';

    return text.toString().replace(/\s+/g, ' ').trim();
  }

  /**
   * Escapa caracteres para uso en expresiones regulares
   *
   * @param text - Texto a escapar
   * @returns Texto seguro para RegExp
   */
  escapeRegex(text: string | null | undefined): string {
    if (!text) return '';

    return text.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Sanitiza un número de teléfono (solo dígitos y +)
   *
   * @param phone - Número de teléfono
   * @returns Número sanitizado
   */
  sanitizePhone(phone: string | null | undefined): string {
    if (!phone) return '';

    return phone.toString().replace(/[^\d+]/g, '');
  }
}
