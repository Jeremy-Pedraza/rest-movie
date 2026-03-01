// src/shared/utils/utils.service.ts

/**
 * @fileoverview Servicio principal de utilidades
 * @module shared/utils
 * @description Expone helpers como servicio inyectable de NestJS
 */

import { Injectable } from '@nestjs/common';

// ============================================
// IMPORTAR HELPERS
// ============================================
import * as StringHelpers from './helpers/string.helper';
import * as DateHelpers from './helpers/date.helper';
import * as CryptoHelpers from './helpers/crypto.helper';
import * as ValidationHelpers from './helpers/validation.helper';

@Injectable()
export class UtilsService {
  // ============================================
  // STRING UTILITIES
  // ============================================

  /**
   * Utilidades de manipulación de strings
   */
  readonly string = {
    slugify: StringHelpers.slugify,
    capitalize: StringHelpers.capitalize,
    titleCase: StringHelpers.titleCase,
    toCamelCase: StringHelpers.toCamelCase,
    toSnakeCase: StringHelpers.toSnakeCase,
    toKebabCase: StringHelpers.toKebabCase,
    truncate: StringHelpers.truncate,
    cleanSpaces: StringHelpers.cleanSpaces,
    removeSpecialChars: StringHelpers.removeSpecialChars,
    isEmpty: StringHelpers.isEmpty,
    isNotEmpty: StringHelpers.isNotEmpty,
    randomString: StringHelpers.randomString,
    mask: StringHelpers.mask,
    maskEmail: StringHelpers.maskEmail,
    maskPhone: StringHelpers.maskPhone,
    extractNumbers: StringHelpers.extractNumbers,
    extractLetters: StringHelpers.extractLetters,
    wordCount: StringHelpers.wordCount,
    reverse: StringHelpers.reverse,
    isPalindrome: StringHelpers.isPalindrome,
    escapeHtml: StringHelpers.escapeHtml,
    unescapeHtml: StringHelpers.unescapeHtml,
    removeAccents: StringHelpers.removeAccents,
    formatCurrency: StringHelpers.formatCurrency,
    formatNumber: StringHelpers.formatNumber,
    getInitials: StringHelpers.getInitials,
    normalizeForSearch: StringHelpers.normalizeForSearch,
    containsIgnoreCase: StringHelpers.containsIgnoreCase,
  } as const;

  // ============================================
  // DATE UTILITIES
  // ============================================

  /**
   * Utilidades de manipulación de fechas
   */
  readonly date = {
    // Constantes
    FORMATS: DateHelpers.DATE_FORMATS,

    // Parsing y formato
    parseDate: DateHelpers.parseDate,
    formatDate: DateHelpers.formatDate,
    formatDateDisplay: DateHelpers.formatDateDisplay,
    formatDateTime: DateHelpers.formatDateTime,
    formatDateLong: DateHelpers.formatDateLong,
    formatTime: DateHelpers.formatTime,
    toISOString: DateHelpers.toISOString,
    toDBFormat: DateHelpers.toDBFormat,

    // Obtención
    now: DateHelpers.now,
    today: DateHelpers.today,
    startOfDay: DateHelpers.startOfDay,
    endOfDay: DateHelpers.endOfDay,
    startOfWeek: DateHelpers.startOfWeek,
    endOfWeek: DateHelpers.endOfWeek,
    startOfMonth: DateHelpers.startOfMonth,
    endOfMonth: DateHelpers.endOfMonth,
    startOfYear: DateHelpers.startOfYear,
    endOfYear: DateHelpers.endOfYear,

    // Manipulación
    addTime: DateHelpers.addTime,
    subtractTime: DateHelpers.subtractTime,
    addDays: DateHelpers.addDays,
    addMonths: DateHelpers.addMonths,
    addYears: DateHelpers.addYears,
    addHours: DateHelpers.addHours,
    addMinutes: DateHelpers.addMinutes,

    // Comparación
    isToday: DateHelpers.isToday,
    isYesterday: DateHelpers.isYesterday,
    isBefore: DateHelpers.isBefore,
    isAfter: DateHelpers.isAfter,
    isBetween: DateHelpers.isBetween,
    isSameDay: DateHelpers.isSameDay,
    isPast: DateHelpers.isPast,
    isFuture: DateHelpers.isFuture,
    isWeekend: DateHelpers.isWeekend,
    isWeekday: DateHelpers.isWeekday,

    // Diferencia
    diff: DateHelpers.diff,
    daysBetween: DateHelpers.daysBetween,
    monthsBetween: DateHelpers.monthsBetween,
    yearsBetween: DateHelpers.yearsBetween,
    calculateAge: DateHelpers.calculateAge,

    // Tiempo relativo
    timeAgo: DateHelpers.timeAgo,
    timeUntil: DateHelpers.timeUntil,
    timeBetween: DateHelpers.timeBetween,

    // Rango
    dateRange: DateHelpers.dateRange,
    workdaysInRange: DateHelpers.workdaysInRange,

    // Partes
    getYear: DateHelpers.getYear,
    getMonth: DateHelpers.getMonth,
    getDay: DateHelpers.getDay,
    getDayOfWeek: DateHelpers.getDayOfWeek,
    getDayName: DateHelpers.getDayName,
    getMonthName: DateHelpers.getMonthName,
    getWeekOfYear: DateHelpers.getWeekOfYear,
    getQuarter: DateHelpers.getQuarter,

    // Utilidad
    isValidDate: DateHelpers.isValidDate,
    daysInMonth: DateHelpers.daysInMonth,
    isLeapYear: DateHelpers.isLeapYear,
    toUnixTimestamp: DateHelpers.toUnixTimestamp,
    fromUnixTimestamp: DateHelpers.fromUnixTimestamp,
    formatDuration: DateHelpers.formatDuration,
    getNextDayOfWeek: DateHelpers.getNextDayOfWeek,
    combineDateAndTime: DateHelpers.combineDateAndTime,
  };

  // ============================================
  // CRYPTO UTILITIES
  // ============================================

  /**
   * Utilidades criptográficas
   */
  readonly crypto = {
    // Hash crypto
    sha256: CryptoHelpers.sha256,
    sha512: CryptoHelpers.sha512,
    md5: CryptoHelpers.md5,
    hmacSha256: CryptoHelpers.hmacSha256,
    hmacSha512: CryptoHelpers.hmacSha512,

    // Encriptación
    encrypt: CryptoHelpers.encrypt,
    decrypt: CryptoHelpers.decrypt,
    encryptToString: CryptoHelpers.encryptToString,
    decryptFromString: CryptoHelpers.decryptFromString,

    // Tokens
    randomBytes: CryptoHelpers.randomBytes,
    generateToken: CryptoHelpers.generateToken,
    generateBase64Token: CryptoHelpers.generateBase64Token,
    generateNumericCode: CryptoHelpers.generateNumericCode,
    generateAlphanumericCode: CryptoHelpers.generateAlphanumericCode,
    generateUUID: CryptoHelpers.generateUUID,
    generateUUIDv7: CryptoHelpers.generateUUIDv7,
    generateSalt: CryptoHelpers.generateSalt,

    // Comparación
    secureCompare: CryptoHelpers.secureCompare,
    secureCompareBuffers: CryptoHelpers.secureCompareBuffers,

    // Derivación
    deriveKey: CryptoHelpers.deriveKey,
    deriveKeySync: CryptoHelpers.deriveKeySync,

    // Hash de archivos
    hashBuffer: CryptoHelpers.hashBuffer,
    checksumMD5: CryptoHelpers.checksumMD5,
    checksumSHA256: CryptoHelpers.checksumSHA256,

    // Encoding
    toBase64: CryptoHelpers.toBase64,
    fromBase64: CryptoHelpers.fromBase64,
    toBase64Url: CryptoHelpers.toBase64Url,
    fromBase64Url: CryptoHelpers.fromBase64Url,
    toHex: CryptoHelpers.toHex,
    fromHex: CryptoHelpers.fromHex,

    // Firma
    sign: CryptoHelpers.sign,
    verifySignature: CryptoHelpers.verifySignature,
    createSignedToken: CryptoHelpers.createSignedToken,
    verifySignedToken: CryptoHelpers.verifySignedToken,
  };

  // ============================================
  // VALIDATION UTILITIES
  // ============================================

  /**
   * Utilidades de validación
   */
  readonly validation = {
    // Regex
    REGEX: ValidationHelpers.REGEX,

    // Validaciones de string
    isEmail: ValidationHelpers.isEmail,
    isURL: ValidationHelpers.isURL,
    isPhone: ValidationHelpers.isPhone,
    isUUID: ValidationHelpers.isUUID,
    isSlug: ValidationHelpers.isSlug,
    isNumeric: ValidationHelpers.isNumeric,
    isAlpha: ValidationHelpers.isAlpha,
    isAlphanumeric: ValidationHelpers.isAlphanumeric,
    isHexColor: ValidationHelpers.isHexColor,
    isIPv4: ValidationHelpers.isIPv4,
    isIPv6: ValidationHelpers.isIPv6,
    isJWT: ValidationHelpers.isJWT,
    isBase64: ValidationHelpers.isBase64,
    isMongoId: ValidationHelpers.isMongoId,

    // Password
    validatePassword: ValidationHelpers.validatePassword,
    isStrongPassword: ValidationHelpers.isStrongPassword,

    // Documentos Colombia
    isValidNIT: ValidationHelpers.isValidNIT,
    isValidCedula: ValidationHelpers.isValidCedula,

    // Tarjetas
    isValidCreditCard: ValidationHelpers.isValidCreditCard,
    detectCardType: ValidationHelpers.detectCardType,

    // Fecha
    isISODate: ValidationHelpers.isISODate,
    isISODateTime: ValidationHelpers.isISODateTime,
    isValidDate: ValidationHelpers.isValidDate,
    isAdult: ValidationHelpers.isAdult,

    // Tipos
    isNullOrUndefined: ValidationHelpers.isNullOrUndefined,
    isObject: ValidationHelpers.isObject,
    isArray: ValidationHelpers.isArray,
    isFiniteNumber: ValidationHelpers.isFiniteNumber,
    isInteger: ValidationHelpers.isInteger,
    isPositive: ValidationHelpers.isPositive,
    isNegative: ValidationHelpers.isNegative,
    isEmpty: ValidationHelpers.isEmpty,
    isNotEmpty: ValidationHelpers.isNotEmpty,
    isEmptyArray: ValidationHelpers.isEmptyArray,
    isEmptyObject: ValidationHelpers.isEmptyObject,

    // Rango
    isInRange: ValidationHelpers.isInRange,
    isLengthInRange: ValidationHelpers.isLengthInRange,

    // Validación compuesta
    validate: ValidationHelpers.validate,
    required: ValidationHelpers.required,
    emailValidator: ValidationHelpers.emailValidator,
    minLength: ValidationHelpers.minLength,
    maxLength: ValidationHelpers.maxLength,
    compose: ValidationHelpers.compose,
  };

  // ============================================
  // MÉTODOS DE CONVENIENCIA
  // ============================================

  /**
   * Genera un ID único (UUIDv7)
   * @returns UUIDv7
   */
  generateId(): string {
    return CryptoHelpers.generateUUIDv7();
  }

  /**
   * Genera un token seguro
   * @param length - Longitud en bytes
   * @returns Token hexadecimal
   */
  generateSecureToken(length: number = 32): string {
    return CryptoHelpers.generateToken(length);
  }

  /**
   * Formatea fecha para mostrar
   * @param date - Fecha
   * @returns Fecha formateada (DD/MM/YYYY)
   */
  formatDate(date: Date | string): string {
    return DateHelpers.formatDateDisplay(date);
  }

  /**
   * Formatea fecha con hora
   * @param date - Fecha
   * @returns Fecha con hora formateada
   */
  formatDateTime(date: Date | string): string {
    return DateHelpers.formatDateTime(date);
  }

  /**
   * Genera slug desde texto
   * @param text - Texto a convertir
   * @returns Slug
   */
  slugify(text: string): string {
    return StringHelpers.slugify(text);
  }

  /**
   * Valida email
   * @param email - Email a validar
   * @returns true si es válido
   */
  isValidEmail(email: string): boolean {
    return ValidationHelpers.isEmail(email);
  }

  /**
   * Valida UUID
   * @param uuid - UUID a validar
   * @returns true si es válido
   */
  isValidUUID(uuid: string): boolean {
    return ValidationHelpers.isUUID(uuid);
  }

  /**
   * Enmascara datos sensibles
   * @param text - Texto a enmascarar
   * @param type - Tipo: 'email', 'phone', o 'default'
   * @returns Texto enmascarado
   */
  maskSensitive(text: string, type: 'email' | 'phone' | 'default' = 'default'): string {
    switch (type) {
      case 'email':
        return StringHelpers.maskEmail(text);
      case 'phone':
        return StringHelpers.maskPhone(text);
      default:
        return StringHelpers.mask(text);
    }
  }

  /**
   * Calcula tiempo relativo
   * @param date - Fecha
   * @returns Texto relativo (ej: "hace 2 horas")
   */
  timeAgo(date: Date | string): string {
    return DateHelpers.timeAgo(date);
  }

  /**
   * Normaliza texto para búsquedas
   * @param text - Texto a normalizar
   * @returns Texto normalizado
   */
  normalizeForSearch(text: string): string {
    return StringHelpers.normalizeForSearch(text);
  }

  /**
   * Elimina timestamps de un objeto o array de objetos
   * Elimina: created_at, updated_at, createdAt, updatedAt
   * @param obj - Objeto o array a limpiar
   * @returns Objeto limpio
   */
  removeTimestamps(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    // Si es array, aplicar recursivamente
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeTimestamps(item));
    }

    // Si es Date, mantenerlo
    if (obj instanceof Date) {
      return obj;
    }

    // Si es objeto, procesar cada propiedad
    if (typeof obj === 'object') {
      const cleaned: any = {};

      // Keys a omitir (snake_case y camelCase)
      const timestampKeys = ['created_at', 'updated_at', 'createdAt', 'updatedAt'];

      for (const [key, value] of Object.entries(obj)) {
        // Omitir timestamps en ambos formatos
        if (!timestampKeys.includes(key)) {
          cleaned[key] = this.removeTimestamps(value);
        }
      }

      return cleaned;
    }

    // Primitivos: devolver tal cual
    return obj;
  }
}
