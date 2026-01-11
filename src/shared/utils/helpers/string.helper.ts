// src/shared/utils/helpers/string.helper.ts

/**
 * @fileoverview Utilidades para manipulación de strings
 * @module shared/utils/helpers/string
 */

/**
 * Genera un slug a partir de un texto
 * @param text - Texto a convertir en slug
 * @returns Slug generado
 * @example
 * slugify('Hello World!') // 'hello-world'
 * slugify('Café con Leche') // 'cafe-con-leche'
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/[\s_]+/g, '-') // Reemplazar espacios y guiones bajos por guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

/**
 * Capitaliza la primera letra de un texto
 * @param text - Texto a capitalizar
 * @returns Texto con primera letra mayúscula
 * @example
 * capitalize('hello') // 'Hello'
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param text - Texto a convertir
 * @returns Texto en Title Case
 * @example
 * titleCase('hello world') // 'Hello World'
 */
export function titleCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convierte texto a camelCase
 * @param text - Texto a convertir
 * @returns Texto en camelCase
 * @example
 * toCamelCase('hello_world') // 'helloWorld'
 * toCamelCase('Hello World') // 'helloWorld'
 */
export function toCamelCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_match: string, char: string) => char.toUpperCase());
}

/**
 * Convierte texto a snake_case
 * @param text - Texto a convertir
 * @returns Texto en snake_case
 * @example
 * toSnakeCase('helloWorld') // 'hello_world'
 * toSnakeCase('Hello World') // 'hello_world'
 */
export function toSnakeCase(text: string): string {
  if (!text) return '';
  return text
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

/**
 * Convierte texto a kebab-case
 * @param text - Texto a convertir
 * @returns Texto en kebab-case
 * @example
 * toKebabCase('helloWorld') // 'hello-world'
 * toKebabCase('Hello World') // 'hello-world'
 */
export function toKebabCase(text: string): string {
  if (!text) return '';
  return text
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/**
 * Trunca un texto a una longitud máxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @param suffix - Sufijo a agregar (default: '...')
 * @returns Texto truncado
 * @example
 * truncate('Hello World', 8) // 'Hello...'
 * truncate('Hello World', 8, '…') // 'Hello W…'
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Elimina espacios múltiples y trim
 * @param text - Texto a limpiar
 * @returns Texto limpio
 * @example
 * cleanSpaces('  hello   world  ') // 'hello world'
 */
export function cleanSpaces(text: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Elimina caracteres especiales de un texto
 * @param text - Texto a limpiar
 * @param allowSpaces - Permitir espacios (default: true)
 * @returns Texto sin caracteres especiales
 * @example
 * removeSpecialChars('Hello! World@#$') // 'Hello World'
 */
export function removeSpecialChars(text: string, allowSpaces: boolean = true): string {
  if (!text) return '';
  const pattern = allowSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g;
  return text.replace(pattern, '').replace(/\s+/g, ' ').trim();
}

/**
 * Verifica si un texto está vacío o solo contiene espacios
 * @param text - Texto a verificar
 * @returns true si está vacío o es null/undefined
 * @example
 * isEmpty('   ') // true
 * isEmpty('hello') // false
 */
export function isEmpty(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

/**
 * Verifica si un texto NO está vacío
 * @param text - Texto a verificar
 * @returns true si tiene contenido
 */
export function isNotEmpty(text: string | null | undefined): boolean {
  return !isEmpty(text);
}

/**
 * Genera un string aleatorio
 * @param length - Longitud del string (default: 10)
 * @param options - Opciones de generación
 * @returns String aleatorio
 * @example
 * randomString(8) // 'aB3kL9mN'
 * randomString(6, { numbers: false }) // 'aBcDeF'
 */
export function randomString(
  length: number = 10,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    special?: boolean;
  } = {},
): string {
  const { uppercase = true, lowercase = true, numbers = true, special = false } = options;

  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (special) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Enmascara un texto dejando visibles solo algunos caracteres
 * @param text - Texto a enmascarar
 * @param visibleStart - Caracteres visibles al inicio (default: 3)
 * @param visibleEnd - Caracteres visibles al final (default: 3)
 * @param maskChar - Caracter de máscara (default: '*')
 * @returns Texto enmascarado
 * @example
 * mask('1234567890', 2, 2) // '12****90'
 * mask('email@domain.com', 2, 4) // 'em*********.com'
 */
export function mask(
  text: string,
  visibleStart: number = 3,
  visibleEnd: number = 3,
  maskChar: string = '*',
): string {
  if (!text) return '';
  if (text.length <= visibleStart + visibleEnd) {
    return maskChar.repeat(text.length);
  }

  const start = text.slice(0, visibleStart);
  const end = text.slice(-visibleEnd);
  const middle = maskChar.repeat(text.length - visibleStart - visibleEnd);

  return start + middle + end;
}

/**
 * Enmascara un email
 * @param email - Email a enmascarar
 * @returns Email enmascarado
 * @example
 * maskEmail('john.doe@example.com') // 'jo****oe@example.com'
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');
  const maskedLocal = mask(localPart, 2, 2);
  return `${maskedLocal}@${domain}`;
}

/**
 * Enmascara un número de teléfono
 * @param phone - Teléfono a enmascarar
 * @returns Teléfono enmascarado
 * @example
 * maskPhone('+573001234567') // '+57******4567'
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 6) return mask(cleaned, 0, 0);
  return mask(cleaned, 3, 4);
}

/**
 * Extrae números de un texto
 * @param text - Texto del que extraer números
 * @returns Solo los números del texto
 * @example
 * extractNumbers('abc123def456') // '123456'
 */
export function extractNumbers(text: string): string {
  if (!text) return '';
  return text.replace(/\D/g, '');
}

/**
 * Extrae letras de un texto
 * @param text - Texto del que extraer letras
 * @returns Solo las letras del texto
 * @example
 * extractLetters('abc123def456') // 'abcdef'
 */
export function extractLetters(text: string): string {
  if (!text) return '';
  return text.replace(/[^a-zA-Z]/g, '');
}

/**
 * Cuenta las palabras en un texto
 * @param text - Texto a analizar
 * @returns Número de palabras
 * @example
 * wordCount('Hello World') // 2
 */
export function wordCount(text: string): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Invierte un texto
 * @param text - Texto a invertir
 * @returns Texto invertido
 * @example
 * reverse('hello') // 'olleh'
 */
export function reverse(text: string): string {
  if (!text) return '';
  return text.split('').reverse().join('');
}

/**
 * Verifica si un texto es palíndromo
 * @param text - Texto a verificar
 * @returns true si es palíndromo
 * @example
 * isPalindrome('radar') // true
 * isPalindrome('hello') // false
 */
export function isPalindrome(text: string): boolean {
  if (!text) return false;
  const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === reverse(cleaned);
}

/**
 * Escapa caracteres HTML
 * @param text - Texto a escapar
 * @returns Texto con caracteres HTML escapados
 * @example
 * escapeHtml('<script>alert("xss")</script>') // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Desescapa caracteres HTML
 * @param text - Texto a desescapar
 * @returns Texto con caracteres HTML desescapados
 */
export function unescapeHtml(text: string): string {
  if (!text) return '';
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => htmlEntities[entity]);
}

/**
 * Normaliza un texto removiendo acentos
 * @param text - Texto a normalizar
 * @returns Texto sin acentos
 * @example
 * removeAccents('Café con Leche') // 'Cafe con Leche'
 */
export function removeAccents(text: string): string {
  if (!text) return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Formatea un número como moneda
 * @param value - Valor numérico
 * @param currency - Código de moneda (default: 'COP')
 * @param locale - Locale (default: 'es-CO')
 * @returns Valor formateado como moneda
 * @example
 * formatCurrency(1234567.89) // '$1.234.567,89'
 */
export function formatCurrency(
  value: number,
  currency: string = 'COP',
  locale: string = 'es-CO',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea un número con separadores de miles
 * @param value - Valor numérico
 * @param locale - Locale (default: 'es-CO')
 * @returns Valor formateado
 * @example
 * formatNumber(1234567.89) // '1.234.567,89'
 */
export function formatNumber(value: number, locale: string = 'es-CO'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Genera las iniciales de un nombre
 * @param name - Nombre completo
 * @param maxInitials - Máximo de iniciales (default: 2)
 * @returns Iniciales en mayúsculas
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('John Michael Doe', 3) // 'JMD'
 */
export function getInitials(name: string, maxInitials: number = 2): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter((word) => word.length > 0)
    .slice(0, maxInitials)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Limpia y normaliza un texto para búsquedas
 * @param text - Texto a normalizar
 * @returns Texto normalizado para búsqueda
 * @example
 * normalizeForSearch('  Café con LECHE  ') // 'cafe con leche'
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return removeAccents(text).toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Verifica si un texto contiene otro (case insensitive)
 * @param text - Texto donde buscar
 * @param search - Texto a buscar
 * @returns true si contiene el texto
 * @example
 * containsIgnoreCase('Hello World', 'WORLD') // true
 */
export function containsIgnoreCase(text: string, search: string): boolean {
  if (!text || !search) return false;
  return normalizeForSearch(text).includes(normalizeForSearch(search));
}
