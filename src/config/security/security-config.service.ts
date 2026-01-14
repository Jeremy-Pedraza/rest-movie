// src/config/security/security-config.service.ts

/**
 * @fileoverview Servicio de configuración de seguridad multi-tenant
 * @module config/security
 *
 * Características:
 * - Whitelist de dominios permitidos
 * - Whitelist de schemas de BD permitidos (multi-tenant)
 * - Integración con variables de entorno (.env)
 * - Hot-reload de configuración
 * - Logging de intentos no autorizados
 * - Búsqueda O(1) con Set
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interfaz para la estructura del archivo security-whitelist.json
 */
interface SecurityWhitelist {
  allowedDomains: string[];
  allowedSchemas: string[];
  config?: {
    maxSchemaLength?: number;
    allowDynamicSchemas?: boolean;
    logUnauthorizedAttempts?: boolean;
    allowLocalhost?: boolean;
  };
}

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
 * ```
 */
@Injectable()
export class SecurityConfigService implements OnModuleInit {
  private readonly logger = new Logger(SecurityConfigService.name);
  private whitelist: SecurityWhitelist;
  private allowedDomainsSet: Set<string>;
  private allowedSchemasSet: Set<string>;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Inicialización al cargar el módulo
   */
  onModuleInit(): void {
    this.loadWhitelist();
  }

  /**
   * Carga la whitelist desde security-whitelist.json
   */
  private loadWhitelist(): void {
    try {
      const filePath = path.join(
        process.cwd(),
        'src',
        'config',
        'security',
        'security-whitelist.json',
      );

      if (!fs.existsSync(filePath)) {
        this.logger.error(`❌ Archivo no encontrado: ${filePath}`);
        this.setDefaultWhitelist();
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      this.whitelist = JSON.parse(fileContent);

      // Validar estructura
      if (!this.whitelist.allowedDomains || !Array.isArray(this.whitelist.allowedDomains)) {
        this.logger.error('❌ security-whitelist.json: allowedDomains inválido');
        this.setDefaultWhitelist();
        return;
      }

      if (!this.whitelist.allowedSchemas || !Array.isArray(this.whitelist.allowedSchemas)) {
        this.logger.error('❌ security-whitelist.json: allowedSchemas inválido');
        this.setDefaultWhitelist();
        return;
      }

      // Convertir a Set para búsquedas O(1)
      this.allowedDomainsSet = new Set(this.whitelist.allowedDomains);
      this.allowedSchemasSet = new Set(this.whitelist.allowedSchemas);

      this.logger.log(
        `✅ Whitelist cargada: ${this.allowedDomainsSet.size} dominios, ${this.allowedSchemasSet.size} schemas`,
      );
    } catch (error) {
      this.logger.error('❌ Error cargando security-whitelist.json', error);
      this.setDefaultWhitelist();
    }
  }

  /**
   * Establece valores por defecto seguros en caso de error
   */
  private setDefaultWhitelist(): void {
    this.logger.warn('⚠️ Usando whitelist por defecto (valores seguros)');

    // Valores por defecto seguros para desarrollo
    this.whitelist = {
      allowedDomains: ['localhost', '127.0.0.1'],
      allowedSchemas: ['public'],
      config: {
        maxSchemaLength: 63,
        allowDynamicSchemas: false,
        logUnauthorizedAttempts: true,
        allowLocalhost: true,
      },
    };

    this.allowedDomainsSet = new Set(this.whitelist.allowedDomains);
    this.allowedSchemasSet = new Set(this.whitelist.allowedSchemas);
  }

  /**
   * Recarga la whitelist desde el archivo
   * Útil para hot-reload en desarrollo sin reiniciar el servidor
   */
  reloadWhitelist(): void {
    this.logger.log('🔄 Recargando whitelist...');
    this.loadWhitelist();
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
    if (!this.allowedDomainsSet) {
      this.logger.error('❌ allowedDomainsSet no inicializado');
      return false;
    }

    // Normalizar dominio (extraer hostname si tiene protocolo)
    const normalizedDomain = this.normalizeDomain(domain);

    // Verificar en Set
    const isAllowed = this.allowedDomainsSet.has(normalizedDomain);

    // Log de rechazos si está habilitado
    if (!isAllowed && this.whitelist.config?.logUnauthorizedAttempts) {
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
   * isSchemaAllowed('tenant_schema')    // true (si está en whitelist)
   * isSchemaAllowed('hacker_schema')    // false
   */
  isSchemaAllowed(schema: string): boolean {
    if (!this.allowedSchemasSet) {
      this.logger.error('❌ allowedSchemasSet no inicializado');
      return false;
    }

    const isAllowed = this.allowedSchemasSet.has(schema);

    // Log de rechazos si está habilitado
    if (!isAllowed && this.whitelist.config?.logUnauthorizedAttempts) {
      this.logger.warn(`⚠️ Schema rechazado: ${schema}`);
    }

    return isAllowed;
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
    return Array.from(this.allowedDomainsSet || []);
  }

  /**
   * Obtiene todos los schemas permitidos
   *
   * @returns Array de schemas permitidos
   */
  getAllowedSchemas(): string[] {
    return Array.from(this.allowedSchemasSet || []);
  }

  /**
   * Obtiene la configuración de seguridad actual
   *
   * @returns Objeto con configuración
   */
  getConfig() {
    return (
      this.whitelist?.config || {
        maxSchemaLength: 63,
        allowDynamicSchemas: false,
        logUnauthorizedAttempts: true,
        allowLocalhost: true,
      }
    );
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
   * const validation = securityConfig.validateRequest(origin, 'tenant_schema');
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
