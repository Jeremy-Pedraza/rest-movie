// src/middleware/logger.middleware.ts

/**
 * @fileoverview Middleware ligero de timing y contexto para requests HTTP.
 *
 * El logging principal de request/response se consolida en LoggingInterceptor
 * para evitar duplicidad. Este middleware solo:
 * 1. Registra el startTime en el request para medición de latencia.
 * 2. Emite un log DEBUG de entrada (útil para diagnóstico de requests que
 *    no llegan al interceptor, ej. rechazados por middleware previo).
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/** Campos de URL query que deben redactarse */
const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'apikey',
  'api_key',
  'secret',
  'password',
  'access_token',
]);

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method } = req;
    const requestId = req.requestId || '-';

    // Registrar startTime para que LoggingInterceptor lo use si lo necesita
    (req as any)._startTime = Date.now();

    // Log de entrada ligero (sin user-agent completo, sin response logging)
    this.logger.debug(
      `-> ${method} ${this.redactUrl(req.originalUrl)} [${requestId}]`,
    );

    next();
  }

  /**
   * Redacta parámetros sensibles de la URL para logging seguro.
   */
  private redactUrl(url: string): string {
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
}
