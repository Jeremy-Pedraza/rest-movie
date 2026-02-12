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
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { redactUrl } from '@config/logging-policy';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly logConsole: boolean;

  constructor(private readonly configService: ConfigService) {
    this.logConsole = this.configService.get<boolean>('app.logging.console') ?? true;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Registrar startTime para que LoggingInterceptor lo use si lo necesita
    req.startTime = Date.now();

    // Log de entrada ligero (respeta LOG_CONSOLE)
    if (this.logConsole) {
      const { method } = req;
      const requestId = req.requestId || '-';
      this.logger.debug(`-> ${method} ${redactUrl(req.originalUrl)} [${requestId}]`);
    }

    next();
  }
}
