// src/middleware/logger.middleware.ts

/**
 * @fileoverview Middleware ligero de timing y contexto para requests HTTP.
 *
 * El logging principal de request/response se consolida en LoggingInterceptor
 * para evitar duplicidad. Este middleware solo:
 * 1. Registra el startTime en el request para medición de latencia.
 * 2. No emite logs para evitar duplicidad con LoggingInterceptor y filtros.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Registrar startTime para que LoggingInterceptor lo use si lo necesita
    req.startTime = Date.now();

    next();
  }
}
