// src/shared/utils/helpers/validation.helper.ts

/**
 * @fileoverview Utilidades de validación comunes
 * @module shared/utils/helpers/validation
 */

// ============================================
// EXPRESIONES REGULARES
// ============================================

export const REGEX = {
  // Email RFC 5322
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // Email simple (más restrictivo)
  EMAIL_SIMPLE: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // URL
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,

  // URL estricta (requiere http/https)
  URL_STRICT:
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,

  // Teléfono internacional
  PHONE_INTERNATIONAL: /^\+?[1-9]\d{1,14}$/,

  // Teléfono Colombia
  PHONE_COLOMBIA: /^(\+57)?3[0-9]{9}$/,

  // UUID v4
  UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // UUID cualquier versión
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  // Solo números
  NUMERIC: /^\d+$/,

  // Solo letras
  ALPHA: /^[a-zA-Z]+$/,

  // Alfanumérico
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,

  // Alfanumérico con espacios
  ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,

  // Slug
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  // Hexadecimal
  HEX: /^[0-9a-fA-F]+$/,

  // Color hexadecimal
  HEX_COLOR: /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,

  // IP v4
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  // IP v6
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,

  // Tarjeta de crédito (básico)
  CREDIT_CARD: /^\d{13,19}$/,

  // Código postal Colombia
  POSTAL_CODE_CO: /^\d{6}$/,

  // NIT Colombia
  NIT_COLOMBIA: /^\d{9,10}-?\d$/,

  // Cédula Colombia
  CEDULA_COLOMBIA: /^\d{6,10}$/,

  // Contraseña fuerte
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Base64
  BASE64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,

  // JWT
  JWT: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,

  // Fecha ISO
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,

  // Fecha y hora ISO
  DATETIME_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,

  // Hora HH:mm
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,

  // Hora HH:mm:ss
  TIME_SECONDS: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,

  // Solo espacios en blanco
  WHITESPACE_ONLY: /^\s*$/,

  // HTML tags
  HTML_TAGS: /<[^>]*>/g,

  // MongoDB ObjectId
  MONGO_ID: /^[0-9a-fA-F]{24}$/,
} as const;

// ============================================
// VALIDACIONES DE STRING
// ============================================

/**
 * Verifica si un valor es un email válido
 * @param email - Email a validar
 * @returns true si es válido
 */
export function isEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return REGEX.EMAIL.test(email.trim());
}

/**
 * Verifica si un valor es una URL válida
 * @param url - URL a validar
 * @param requireProtocol - Si requiere http/https
 * @returns true si es válida
 */
export function isURL(url: string, requireProtocol: boolean = false): boolean {
  if (!url || typeof url !== 'string') return false;
  const regex = requireProtocol ? REGEX.URL_STRICT : REGEX.URL;
  return regex.test(url.trim());
}

/**
 * Verifica si es un teléfono válido
 * @param phone - Teléfono a validar
 * @param country - País (opcional, 'CO' para Colombia)
 * @returns true si es válido
 */
export function isPhone(phone: string, country?: 'CO'): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-()]/g, '');

  if (country === 'CO') {
    return REGEX.PHONE_COLOMBIA.test(cleaned);
  }
  return REGEX.PHONE_INTERNATIONAL.test(cleaned);
}

/**
 * Verifica si es un UUID válido
 * @param uuid - UUID a validar
 * @param version - Versión específica (4 para v4)
 * @returns true si es válido
 */
export function isUUID(uuid: string, version?: 4): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const regex = version === 4 ? REGEX.UUID_V4 : REGEX.UUID;
  return regex.test(uuid.trim());
}

/**
 * Verifica si es un slug válido
 * @param slug - Slug a validar
 * @returns true si es válido
 */
export function isSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return REGEX.SLUG.test(slug);
}

/**
 * Verifica si contiene solo números
 * @param value - Valor a validar
 * @returns true si solo contiene números
 */
export function isNumeric(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return REGEX.NUMERIC.test(value);
}

/**
 * Verifica si contiene solo letras
 * @param value - Valor a validar
 * @returns true si solo contiene letras
 */
export function isAlpha(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return REGEX.ALPHA.test(value);
}

/**
 * Verifica si es alfanumérico
 * @param value - Valor a validar
 * @param allowSpaces - Permitir espacios
 * @returns true si es alfanumérico
 */
export function isAlphanumeric(value: string, allowSpaces: boolean = false): boolean {
  if (!value || typeof value !== 'string') return false;
  const regex = allowSpaces ? REGEX.ALPHANUMERIC_SPACES : REGEX.ALPHANUMERIC;
  return regex.test(value);
}

/**
 * Verifica si es un color hexadecimal válido
 * @param color - Color a validar
 * @returns true si es válido
 */
export function isHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  return REGEX.HEX_COLOR.test(color.trim());
}

/**
 * Verifica si es una dirección IPv4 válida
 * @param ip - IP a validar
 * @returns true si es válida
 */
export function isIPv4(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  return REGEX.IPV4.test(ip.trim());
}

/**
 * Verifica si es una dirección IPv6 válida
 * @param ip - IP a validar
 * @returns true si es válida
 */
export function isIPv6(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  return REGEX.IPV6.test(ip.trim());
}

/**
 * Verifica si es un JWT válido (formato, no firma)
 * @param token - Token a validar
 * @returns true si tiene formato JWT
 */
export function isJWT(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  return REGEX.JWT.test(token.trim());
}

/**
 * Verifica si es un string Base64 válido
 * @param str - String a validar
 * @returns true si es Base64
 */
export function isBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return REGEX.BASE64.test(str.trim());
}

/**
 * Verifica si es un MongoDB ObjectId válido
 * @param id - ID a validar
 * @returns true si es válido
 */
export function isMongoId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return REGEX.MONGO_ID.test(id.trim());
}

// ============================================
// VALIDACIONES DE CONTRASEÑA
// ============================================

/**
 * Resultado de validación de contraseña
 */
export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
}

/**
 * Valida la fortaleza de una contraseña
 * @param password - Contraseña a validar
 * @param options - Opciones de validación
 * @returns Resultado de validación
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {},
): PasswordValidationResult {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      score: 0,
      errors: ['La contraseña es requerida'],
      suggestions: ['Ingrese una contraseña'],
    };
  }

  // Validar longitud
  if (password.length < minLength) {
    errors.push(`Debe tener al menos ${minLength} caracteres`);
  } else {
    score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
  }

  if (password.length > maxLength) {
    errors.push(`No debe exceder ${maxLength} caracteres`);
  }

  // Validar mayúsculas
  const hasUppercase = /[A-Z]/.test(password);
  if (requireUppercase && !hasUppercase) {
    errors.push('Debe contener al menos una mayúscula');
  } else if (hasUppercase) {
    score += 1;
  }

  // Validar minúsculas
  const hasLowercase = /[a-z]/.test(password);
  if (requireLowercase && !hasLowercase) {
    errors.push('Debe contener al menos una minúscula');
  } else if (hasLowercase) {
    score += 1;
  }

  // Validar números
  const hasNumbers = /\d/.test(password);
  if (requireNumbers && !hasNumbers) {
    errors.push('Debe contener al menos un número');
  } else if (hasNumbers) {
    score += 1;
  }

  // Validar caracteres especiales
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);
  if (requireSpecialChars && !hasSpecialChars) {
    errors.push('Debe contener al menos un carácter especial (!@#$%^&*...)');
  } else if (hasSpecialChars) {
    score += 1;
  }

  // Verificar patrones comunes inseguros
  const commonPatterns = [/^12345/, /password/i, /qwerty/i, /abc123/i, /111111/, /123123/];

  const hasCommonPattern = commonPatterns.some((pattern) => pattern.test(password));
  if (hasCommonPattern) {
    score -= 2;
    suggestions.push('Evite patrones comunes como "123456" o "password"');
  }

  // Verificar repeticiones
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    suggestions.push('Evite caracteres repetidos consecutivamente');
  }

  // Generar sugerencias
  if (score < 4) {
    if (!hasUppercase) suggestions.push('Agregue letras mayúsculas');
    if (!hasLowercase) suggestions.push('Agregue letras minúsculas');
    if (!hasNumbers) suggestions.push('Agregue números');
    if (!hasSpecialChars) suggestions.push('Agregue caracteres especiales');
    if (password.length < 12) suggestions.push('Use una contraseña más larga');
  }

  return {
    isValid: errors.length === 0,
    score: Math.max(0, Math.min(score, 7)),
    errors,
    suggestions,
  };
}

/**
 * Verifica si una contraseña es fuerte (usando regex simple)
 * @param password - Contraseña a verificar
 * @returns true si es fuerte
 */
export function isStrongPassword(password: string): boolean {
  return REGEX.PASSWORD_STRONG.test(password);
}

// ============================================
// VALIDACIONES DE DOCUMENTOS COLOMBIA
// ============================================

/**
 * Valida un NIT colombiano
 * @param nit - NIT a validar
 * @returns true si es válido
 */
export function isValidNIT(nit: string): boolean {
  if (!nit) return false;

  // Limpiar formato
  const cleaned = nit.replace(/[.-]/g, '');

  if (!/^\d{9,10}\d$/.test(cleaned)) return false;

  // Extraer número base y dígito de verificación
  const base = cleaned.slice(0, -1);
  const checkDigit = parseInt(cleaned.slice(-1), 10);

  // Calcular dígito de verificación
  const weights = [71, 67, 59, 53, 47, 43, 41, 37, 29, 23, 19, 17, 13, 7, 3];
  const paddedBase = base.padStart(15, '0');

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += parseInt(paddedBase[i], 10) * weights[i];
  }

  const remainder = sum % 11;
  const expectedCheckDigit = remainder > 1 ? 11 - remainder : remainder;

  return checkDigit === expectedCheckDigit;
}

/**
 * Valida una cédula colombiana (formato básico)
 * @param cedula - Cédula a validar
 * @returns true si tiene formato válido
 */
export function isValidCedula(cedula: string): boolean {
  if (!cedula) return false;
  const cleaned = cedula.replace(/\D/g, '');
  return REGEX.CEDULA_COLOMBIA.test(cleaned);
}

// ============================================
// VALIDACIONES DE TARJETAS
// ============================================

/**
 * Valida un número de tarjeta de crédito usando algoritmo de Luhn
 * @param cardNumber - Número de tarjeta
 * @returns true si es válido
 */
export function isValidCreditCard(cardNumber: string): boolean {
  if (!cardNumber) return false;

  // Limpiar espacios y guiones
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Verificar que solo contenga números
  if (!REGEX.CREDIT_CARD.test(cleaned)) return false;

  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detecta el tipo de tarjeta de crédito
 * @param cardNumber - Número de tarjeta
 * @returns Tipo de tarjeta o 'unknown'
 */
export function detectCardType(
  cardNumber: string,
): 'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'unknown' {
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';
  if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';

  return 'unknown';
}

// ============================================
// VALIDACIONES DE FECHA
// ============================================

/**
 * Verifica si es una fecha ISO válida (YYYY-MM-DD)
 * @param date - Fecha a validar
 * @returns true si es válida
 */
export function isISODate(date: string): boolean {
  if (!date || typeof date !== 'string') return false;
  if (!REGEX.DATE_ISO.test(date)) return false;

  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Verifica si es una fecha y hora ISO válida
 * @param datetime - Fecha y hora a validar
 * @returns true si es válida
 */
export function isISODateTime(datetime: string): boolean {
  if (!datetime || typeof datetime !== 'string') return false;
  if (!REGEX.DATETIME_ISO.test(datetime)) return false;

  const parsed = new Date(datetime);
  return !isNaN(parsed.getTime());
}

/**
 * Verifica si una fecha es válida
 * @param date - Fecha a validar
 * @returns true si es válida
 */
export function isValidDate(date: Date | string | number): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Verifica si una persona es mayor de edad
 * @param birthDate - Fecha de nacimiento
 * @param minAge - Edad mínima (default: 18)
 * @returns true si es mayor de edad
 */
export function isAdult(birthDate: Date | string, minAge: number = 18): boolean {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return false;

  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= minAge;
  }

  return age >= minAge;
}

// ============================================
// VALIDACIONES DE TIPOS
// ============================================

/**
 * Verifica si un valor es null o undefined
 * @param value - Valor a verificar
 * @returns true si es null o undefined
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Verifica si un valor es un objeto (no array, no null)
 * @param value - Valor a verificar
 * @returns true si es objeto
 */
export function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Verifica si un valor es un array
 * @param value - Valor a verificar
 * @returns true si es array
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Verifica si un valor es un número finito
 * @param value - Valor a verificar
 * @returns true si es número finito
 */
export function isFiniteNumber(value: any): value is number {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Verifica si un valor es un entero
 * @param value - Valor a verificar
 * @returns true si es entero
 */
export function isInteger(value: any): value is number {
  return Number.isInteger(value);
}

/**
 * Verifica si un valor es un número positivo
 * @param value - Valor a verificar
 * @returns true si es positivo
 */
export function isPositive(value: number): boolean {
  return isFiniteNumber(value) && value > 0;
}

/**
 * Verifica si un valor es un número negativo
 * @param value - Valor a verificar
 * @returns true si es negativo
 */
export function isNegative(value: number): boolean {
  return isFiniteNumber(value) && value < 0;
}

/**
 * Verifica si un string está vacío o solo tiene espacios
 * @param value - Valor a verificar
 * @returns true si está vacío
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Verifica si un string NO está vacío
 * @param value - Valor a verificar
 * @returns true si no está vacío
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return !isEmpty(value);
}

/**
 * Verifica si un array está vacío
 * @param arr - Array a verificar
 * @returns true si está vacío
 */
export function isEmptyArray(arr: any[] | null | undefined): boolean {
  return !arr || arr.length === 0;
}

/**
 * Verifica si un objeto está vacío
 * @param obj - Objeto a verificar
 * @returns true si está vacío
 */
export function isEmptyObject(obj: Record<string, any> | null | undefined): boolean {
  return !obj || Object.keys(obj).length === 0;
}

// ============================================
// VALIDACIONES DE RANGO
// ============================================

/**
 * Verifica si un número está en un rango
 * @param value - Valor a verificar
 * @param min - Valor mínimo
 * @param max - Valor máximo
 * @param inclusive - Si incluye los límites
 * @returns true si está en rango
 */
export function isInRange(
  value: number,
  min: number,
  max: number,
  inclusive: boolean = true,
): boolean {
  if (inclusive) {
    return value >= min && value <= max;
  }
  return value > min && value < max;
}

/**
 * Verifica si la longitud de un string está en un rango
 * @param str - String a verificar
 * @param min - Longitud mínima
 * @param max - Longitud máxima
 * @returns true si está en rango
 */
export function isLengthInRange(str: string, min: number, max: number): boolean {
  if (!str) return min === 0;
  return str.length >= min && str.length <= max;
}

// ============================================
// VALIDACIONES COMPUESTAS
// ============================================

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida un objeto contra un esquema de validación
 * @param data - Datos a validar
 * @param schema - Esquema de validación
 * @returns Resultado de validación
 */
export function validate(
  data: Record<string, any>,
  schema: Record<string, (value: any) => string | null>,
): ValidationResult {
  const errors: string[] = [];

  for (const [field, validator] of Object.entries(schema)) {
    const error = validator(data[field]);
    if (error) {
      errors.push(`${field}: ${error}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Crea un validador de campo requerido
 * @param message - Mensaje de error
 * @returns Función validadora
 */
export function required(message: string = 'Este campo es requerido') {
  return (value: any): string | null => {
    if (isNullOrUndefined(value) || (typeof value === 'string' && isEmpty(value))) {
      return message;
    }
    return null;
  };
}

/**
 * Crea un validador de email
 * @param message - Mensaje de error
 * @returns Función validadora
 */
export function emailValidator(message: string = 'Email inválido') {
  return (value: any): string | null => {
    if (!value) return null; // Permitir vacío (usar required() si es obligatorio)
    return isEmail(value) ? null : message;
  };
}

/**
 * Crea un validador de longitud mínima
 * @param min - Longitud mínima
 * @param message - Mensaje de error
 * @returns Función validadora
 */
export function minLength(min: number, message?: string) {
  return (value: any): string | null => {
    if (!value) return null;
    if (typeof value !== 'string' || value.length < min) {
      return message || `Debe tener al menos ${min} caracteres`;
    }
    return null;
  };
}

/**
 * Crea un validador de longitud máxima
 * @param max - Longitud máxima
 * @param message - Mensaje de error
 * @returns Función validadora
 */
export function maxLength(max: number, message?: string) {
  return (value: any): string | null => {
    if (!value) return null;
    if (typeof value !== 'string' || value.length > max) {
      return message || `No debe exceder ${max} caracteres`;
    }
    return null;
  };
}

/**
 * Combina múltiples validadores
 * @param validators - Validadores a combinar
 * @returns Función validadora combinada
 */
export function compose(...validators: Array<(value: any) => string | null>) {
  return (value: any): string | null => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
}
