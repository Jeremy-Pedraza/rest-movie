// src/config/logging-policy.ts

import { LogDbLevel } from './app.config';

/**
 * Lista centralizada de query params sensibles que deben redactarse en logs.
 * Usada por LoggerMiddleware y LoggingInterceptor.
 */
export const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'apikey',
  'api_key',
  'secret',
  'password',
  'access_token',
  'refresh_token',
  'authorization',
]);

/**
 * Determina si un request con el status code dado debe loggearse en BD
 * segun la politica de nivel configurada.
 *
 * Politica centralizada usada por LoggingInterceptor, AllExceptionsFilter
 * y ValidationExceptionFilter.
 */
export function shouldLogToDb(dbLevel: LogDbLevel, statusCode: number): boolean {
  switch (dbLevel) {
    case 'none':
      return false;
    case 'errors':
      return statusCode >= 500;
    case 'warnings':
      return statusCode >= 400;
    case 'info':
    case 'all':
    default:
      return true;
  }
}

/**
 * Redacta parametros sensibles de una URL para logging seguro.
 * Retorna la URL con valores sensibles reemplazados por [REDACTED].
 */
export function redactUrl(url: string): string {
  const [path, queryString] = url.split('?');
  if (!queryString) return path;

  const params = new URLSearchParams(queryString);
  for (const key of params.keys()) {
    if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
      params.set(key, '[REDACTED]');
    }
  }

  return `${path}?${params.toString()}`;
}
