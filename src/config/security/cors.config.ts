// src/config/security/cors.config.ts

/**
 * @fileoverview Configuración CORS integrada con SecurityConfigService
 * @module config/security
 *
 * Esta configuración:
 * - Lee dominios permitidos desde SecurityConfigService
 * - SecurityConfigService obtiene dominios de security-whitelist.json
 * - NO usa variables de entorno para dominios (solo para métodos y credenciales)
 * - Permite hot-reload de dominios sin reiniciar servidor
 *
 * @example
 * // En main.ts:
 * import { getCorsOptionsWithSecurity } from '@config/security';
 *
 * const securityConfig = app.get(SecurityConfigService);
 * const configService = app.get(ConfigService);
 * const corsOptions = getCorsOptionsWithSecurity(securityConfig, configService);
 * app.enableCors(corsOptions);
 */

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigService } from '@nestjs/config';
import type { SecurityConfigService } from './security-config.service';

/**
 * Factory function para CORS dinámico con SecurityConfigService
 *
 * Esta función debe usarse en main.ts cuando SecurityConfigService
 * ya esté inicializado.
 *
 * Validación de dominios:
 * - Los dominios permitidos se leen desde security-whitelist.json
 * - Cada request es validado contra SecurityConfigService
 * - Requests sin origin (Postman, cURL) se permiten automáticamente
 *
 * Configuración adicional:
 * - CORS_METHODS: Métodos HTTP permitidos (del .env)
 * - CORS_CREDENTIALS: Permitir credenciales (del .env)
 *
 * @param securityConfigService - Servicio de seguridad con whitelist
 * @param configService - Servicio de configuración de NestJS
 * @returns Opciones de CORS para app.enableCors()
 */
export function getCorsOptionsWithSecurity(
  securityConfigService: SecurityConfigService,
  configService: ConfigService,
): CorsOptions {
  return {
    // ✅ ORIGEN DINÁMICO: Validación con SecurityConfigService
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Sin origin = request directo (Postman, cURL, server-to-server) → permitir
      if (!origin) {
        return callback(null, true);
      }

      // Validar con SecurityConfigService (lee de security-whitelist.json)
      const isAllowed = securityConfigService.isDomainAllowed(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Dominio no permitido por CORS: ${origin}`));
      }
    },

    // Métodos HTTP permitidos (desde .env)
    methods: (() => {
      const corsMethods = configService.get<string>('CORS_METHODS');
      return corsMethods
        ? corsMethods.split(',').map((m: string) => m.trim())
        : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    })(),

    // Credenciales (cookies, authorization headers) (desde .env)
    credentials: configService.get<string>('CORS_CREDENTIALS') === 'true',

    // Headers permitidos en requests
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-Id',
    ],

    // Headers expuestos en responses
    exposedHeaders: ['X-Request-Id', 'X-Total-Count'],

    // Cache de preflight requests (24 horas)
    maxAge: 86400,
  };
}
