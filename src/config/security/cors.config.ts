// src/config/security/cors.config.ts

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigService } from '@nestjs/config';

/**
 * Factory function para configuracion CORS
 *
 * @param configService - Servicio de configuracion de NestJS
 * @returns Opciones de CORS para app.enableCors()
 */
export function getCorsOptions(configService: ConfigService): CorsOptions {
  const allowedOrigins = (configService.get<string>('CORS_ORIGIN') || '')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter(Boolean);
  const allowAllOrigins = allowedOrigins.includes('*');
  const credentials = configService.get<string>('CORS_CREDENTIALS') === 'true';

  return {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowAllOrigins && !credentials) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Dominio no permitido por CORS: ${origin}`));
      }
    },

    methods: (() => {
      const corsMethods = configService.get<string>('CORS_METHODS');
      return corsMethods
        ? corsMethods.split(',').map((m: string) => m.trim())
        : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    })(),

    credentials,

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Request-Id',
    ],

    exposedHeaders: ['X-Request-Id', 'X-Total-Count'],

    maxAge: 86400,
  };
}
