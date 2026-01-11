// src/config/app.config.ts

import { registerAs } from '@nestjs/config';

/**
 * Niveles de logging en base de datos
 * - all: Guarda todo (success + warnings + errors)
 * - warnings: Guarda solo 4xx y 5xx
 * - errors: Guarda solo 5xx
 * - none: No guarda nada en BD (solo consola)
 */
export type LogDbLevel = 'all' | 'warnings' | 'errors' | 'none';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'mokka-backend',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  host: process.env.APP_HOST || 'localhost',
  url: process.env.APP_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  debug: process.env.APP_DEBUG === 'true',

  /**
   * Configuración de logging en base de datos
   */
  logging: {
    /**
     * Nivel de logging en BD
     * @default 'all' en development, 'errors' en production
     */
    dbLevel: (process.env.LOG_DB_LEVEL as LogDbLevel) || 
      (process.env.NODE_ENV === 'production' ? 'errors' : 'all'),

    /**
     * Si se debe loggear en consola
     * @default true
     */
    console: process.env.LOG_CONSOLE !== 'false',

    /**
     * Rutas a ignorar del logging (health checks, etc)
     */
    ignorePaths: (process.env.LOG_IGNORE_PATHS || '/health,/health/ready,/favicon.ico')
      .split(',')
      .map((p) => p.trim()),
  },
}));
