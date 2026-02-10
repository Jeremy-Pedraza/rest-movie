// src/config/security/security-whitelist.config.ts

/**
 * @fileoverview Configuración de whitelist de seguridad multi-tenant
 * @module config/security
 *
 * Este archivo reemplaza security-whitelist.json con las siguientes ventajas:
 * - Type-safety completo (errores en compile-time)
 * - Compatible con build de producción (se compila a JS)
 * - Sin I/O en runtime (import directo)
 * - Soporte para comentarios y documentación
 * - Enums para schemas (autocompletado en IDE)
 */

/**
 * Schemas de base de datos permitidos (multi-tenant)
 *
 * @description Agregar nuevos tenants aquí como enum values
 * @example
 * // Agregar nuevo tenant:
 * NUEVO_TENANT = 'nuevo_tenant',
 */
export enum AllowedSchema {
  /** Schema por defecto de PostgreSQL */
  PUBLIC = 'public',

  /** Taco Bell República Dominicana */
  TACO_BELL_RD = 'taco_bell_rd',

  /** Taco Bell Colombia */
  TACO_BELL_CO = 'taco_bell_co',
}

/**
 * Configuración de seguridad
 */
export interface ISecurityConfig {
  /** Longitud máxima permitida para nombres de schema (PostgreSQL limit: 63) */
  maxSchemaLength: number;

  /** Permitir schemas dinámicos no listados en whitelist */
  allowDynamicSchemas: boolean;

  /** Loguear intentos de acceso no autorizados */
  logUnauthorizedAttempts: boolean;

  /** Permitir localhost en cualquier entorno */
  allowLocalhost: boolean;
}

/**
 * Estructura completa de la whitelist de seguridad
 */
export interface ISecurityWhitelist {
  allowedDomains: readonly string[];
  allowedSchemas: readonly string[];
  config: ISecurityConfig;
}

/**
 * Dominios permitidos para CORS y validación de origen
 *
 * @description
 * - Incluir con y sin protocolo según necesidad
 * - localhost se permite automáticamente en desarrollo
 * - Agregar dominios de producción aquí
 */
const ALLOWED_DOMAINS = [
  // === Desarrollo local ===
  'localhost',
  '127.0.0.1',
  'http://localhost:3000',
  'http://localhost:4200',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4200',

  // === Producción ===
  'tacobell.rest-services.com',

  // === Staging (agregar según necesidad) ===
  // 'staging.tacobell.rest-services.com',
] as const;

/**
 * Configuración de comportamiento de seguridad
 */
const SECURITY_CONFIG: ISecurityConfig = {
  /** PostgreSQL limita nombres de identificadores a 63 caracteres */
  maxSchemaLength: 63,

  /** En producción, solo schemas explícitamente listados */
  allowDynamicSchemas: false,

  /** Registrar intentos de acceso no autorizados para auditoría */
  logUnauthorizedAttempts: true,

  /** Permitir localhost (útil para desarrollo y testing) */
  allowLocalhost: true,
};

/**
 * Whitelist de seguridad centralizada
 *
 * @description
 * Configuración principal de seguridad multi-tenant.
 * Usada por SecurityConfigService para validar dominios y schemas.
 *
 * @example
 * ```typescript
 * import { SECURITY_WHITELIST, AllowedSchema } from './security-whitelist.config';
 *
 * // Verificar dominio
 * const domains = SECURITY_WHITELIST.allowedDomains;
 *
 * // Usar schema tipado
 * const schema = AllowedSchema.TACO_BELL_RD;
 * ```
 */
export const SECURITY_WHITELIST: ISecurityWhitelist = {
  allowedDomains: ALLOWED_DOMAINS,
  allowedSchemas: Object.values(AllowedSchema),
  config: SECURITY_CONFIG,
} as const;

/**
 * Helper: Obtener todos los schemas como array
 */
export const getAllSchemas = (): string[] => Object.values(AllowedSchema);

/**
 * Helper: Verificar si un string es un schema válido
 */
export const isValidSchema = (schema: string): schema is AllowedSchema => {
  return Object.values(AllowedSchema).includes(schema as AllowedSchema);
};
