// src/config/security/security-config.service.ts

/**
 * @fileoverview Servicio de configuración de seguridad multi-tenant
 * @module config/security
 *
 * Características:
 * - Whitelist de dominios permitidos
 * - Whitelist de schemas de BD permitidos (multi-tenant)
 * - Búsqueda O(1) con Set
 * - Type-safe con TypeScript
 * - Sin I/O en runtime (import directo)
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  SECURITY_WHITELIST,
  ISecurityConfig,
  AllowedSchema,
  isValidSchema,
} from './security-whitelist.config';

/**
 * Resultado de validación de request
 */
export interface ISecurityValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * SecurityConfigService - Servicio centralizado para seguridad multi-tenant
 *
 * @example
 * ```typescript
 * // Validar dominio
 * const isAllowed = this.securityConfig.isDomainAllowed('example.com');
 *
 * // Validar schema
 * const isSchemaValid = this.securityConfig.isSchemaAllowed('tenant_schema');
 *
 * // Validar request completo
 * const validation = this.securityConfig.validateRequest(origin, schema);
 * if (!validation.isValid) {
 *   throw new ForbiddenException(validation.reason);
 * }
 *
 * // Usar schema tipado
 * const schema = AllowedSchema.TACO_BELL_RD;
 * ```
 */
@Injectable()
export class SecurityConfigService implements OnModuleInit {
  private readonly logger = new Logger(SecurityConfigService.name);
  private readonly allowedDomainsSet: Set<string>;
  private readonly allowedSchemasSet: Set<string>;
  private readonly config: ISecurityConfig;

  constructor() {
    // Inicializar Sets para búsqueda O(1)
    this.allowedDomainsSet = new Set(SECURITY_WHITELIST.allowedDomains);
    this.allowedSchemasSet = new Set(SECURITY_WHITELIST.allowedSchemas);
    this.config = SECURITY_WHITELIST.config;
  }

  /**
   * Log de inicialización al cargar el módulo
   */
  onModuleInit(): void {
    this.logger.log(
      `✅ SecurityConfig inicializado: ${this.allowedDomainsSet.size} dominios, ${this.allowedSchemasSet.size} schemas`,
    );
  }

  /**
   * Verifica si un dominio está permitido
   *
   * @param domain - Dominio a validar (puede incluir protocolo o ser solo hostname)
   * @returns true si está permitido
   *
   * @example
   * isDomainAllowed('http://localhost:3000')    // true
   * isDomainAllowed('localhost')                 // true
   * isDomainAllowed('evil.com')                  // false
   */
  isDomainAllowed(domain: string): boolean {
    if (!domain) return false;

    // Normalizar dominio (extraer hostname si tiene protocolo)
    const normalizedDomain = this.normalizeDomain(domain);

    // Verificar en Set O(1)
    const isAllowed = this.allowedDomainsSet.has(normalizedDomain);

    // Log de rechazos si está habilitado
    if (!isAllowed && this.config.logUnauthorizedAttempts) {
      this.logger.warn(`⚠️ Dominio rechazado: ${normalizedDomain} (original: ${domain})`);
    }

    return isAllowed;
  }

  /**
   * Verifica si un schema de BD está permitido
   *
   * @param schema - Schema a validar
   * @returns true si está permitido
   *
   * @example
   * isSchemaAllowed('public')           // true
   * isSchemaAllowed('taco_bell_rd')     // true
   * isSchemaAllowed('hacker_schema')    // false
   */
  isSchemaAllowed(schema: string): boolean {
    if (!schema) return false;

    const isAllowed = this.allowedSchemasSet.has(schema);

    // Log de rechazos si está habilitado
    if (!isAllowed && this.config.logUnauthorizedAttempts) {
      this.logger.warn(`⚠️ Schema rechazado: ${schema}`);
    }

    return isAllowed;
  }

  /**
   * Verifica si un schema es válido usando el type guard
   *
   * @param schema - Schema a validar
   * @returns true si es un AllowedSchema válido
   */
  isValidSchemaEnum(schema: string): schema is AllowedSchema {
    return isValidSchema(schema);
  }

  /**
   * Normaliza un dominio (extrae solo el hostname)
   *
   * @param domain - Dominio a normalizar
   * @returns Hostname normalizado
   *
   * @example
   * normalizeDomain('http://localhost:3000')  // 'localhost'
   * normalizeDomain('https://example.com')    // 'example.com'
   * normalizeDomain('localhost')              // 'localhost'
   */
  private normalizeDomain(domain: string): string {
    if (!domain) return '';

    try {
      // Si tiene protocolo, extraer hostname
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        const url = new URL(domain);
        return url.hostname;
      }
      // Si no tiene protocolo, retornar como está
      return domain;
    } catch {
      // Si falla el parsing, retornar original
      return domain;
    }
  }

  /**
   * Obtiene todos los dominios permitidos
   *
   * @returns Array de dominios permitidos
   */
  getAllowedDomains(): string[] {
    return Array.from(this.allowedDomainsSet);
  }

  /**
   * Obtiene todos los schemas permitidos
   *
   * @returns Array de schemas permitidos
   */
  getAllowedSchemas(): string[] {
    return Array.from(this.allowedSchemasSet);
  }

  /**
   * Obtiene la configuración de seguridad actual
   *
   * @returns Objeto con configuración
   */
  getConfig(): ISecurityConfig {
    return { ...this.config };
  }

  /**
   * Valida request completo (dominio + schema)
   *
   * @param origin - Origen del request (header Origin o Referer)
   * @param schema - Schema de BD a validar (opcional)
   * @returns Objeto con resultado de validación
   *
   * @example
   * ```typescript
   * const validation = securityConfig.validateRequest(origin, 'taco_bell_rd');
   * if (!validation.isValid) {
   *   throw new ForbiddenException(validation.reason);
   * }
   * ```
   */
  validateRequest(origin: string, schema?: string): ISecurityValidationResult {
    // Validar dominio
    if (!this.isDomainAllowed(origin)) {
      return {
        isValid: false,
        reason: `Dominio no permitido: ${origin}`,
      };
    }

    // Validar schema si se proporciona
    if (schema && !this.isSchemaAllowed(schema)) {
      return {
        isValid: false,
        reason: `Schema no permitido: ${schema}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Verifica si un dominio es localhost
   *
   * @param domain - Dominio a verificar
   * @returns true si es localhost
   */
  isLocalhost(domain: string): boolean {
    const normalized = this.normalizeDomain(domain);
    return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
  }
}
