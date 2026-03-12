// src/config/app.config.ts

import { registerAs } from '@nestjs/config';

/**
 * Niveles de logging en base de datos
 * - all: Guarda todo (incluye debug y verbose)
 * - info: Guarda info + warnings + errors
 * - warnings: Guarda solo 4xx y 5xx
 * - errors: Guarda solo 5xx
 * - none: No guarda nada en BD (solo consola)
 */
export type LogDbLevel = 'all' | 'info' | 'warnings' | 'errors' | 'none';

const LOG_DB_LEVEL_VALUES: LogDbLevel[] = ['all', 'info', 'warnings', 'errors', 'none'];

function resolveLogDbLevel(nodeEnv: string): LogDbLevel {
  const envLevel = process.env.LOG_DB_LEVEL as LogDbLevel | undefined;
  const isValidEnvLevel = !!envLevel && LOG_DB_LEVEL_VALUES.includes(envLevel);

  if (nodeEnv === 'production') {
    return 'errors';
  }

  if (nodeEnv === 'test') {
    return 'none';
  }

  if (isValidEnvLevel) return envLevel;
  return 'info';
}

function resolveConsoleLogging(nodeEnv: string): boolean {
  if (process.env.LOG_CONSOLE === 'true') return true;
  if (process.env.LOG_CONSOLE === 'false') return false;
  return nodeEnv === 'development';
}

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'Rest-backend',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  host: process.env.APP_HOST || 'localhost',
  url: process.env.APP_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  debug: process.env.APP_DEBUG === 'true',

  /**
   * Timeout para requests HTTP (en milisegundos)
   * @default 30000 (30 segundos)
   */
  requestTimeout: parseInt(process.env.APP_REQUEST_TIMEOUT || '30000', 10),

  /**
   * Configuración de logging en base de datos
   */
  logging: {
    /**
     * Nivel de logging en BD
     * @default 'info' en development, 'errors' en production
     */
    dbLevel: resolveLogDbLevel(process.env.NODE_ENV || 'development'),

    /**
     * Si se debe loggear en consola
     * @default true
     */
    console: resolveConsoleLogging(process.env.NODE_ENV || 'development'),

    /**
     * Rutas a ignorar del logging (health checks, etc)
     */
    ignorePaths: (process.env.LOG_IGNORE_PATHS || '/health,/health/ready,/favicon.ico')
      .split(',')
      .map((p) => p.trim()),
  },
}));
