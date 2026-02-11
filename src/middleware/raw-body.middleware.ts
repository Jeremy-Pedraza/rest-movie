// src/middleware/raw-body.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { json } from 'express';

/**
 * Middleware para preservar el raw body en rutas de webhook.
 * Se aplica SOLO a rutas específicas que requieren verificación de firma
 * (Stripe, MercadoPago, etc.) y NO globalmente.
 *
 * @usage
 * ```typescript
 * // En el módulo de webhook:
 * configure(consumer: MiddlewareConsumer) {
 *   consumer
 *     .apply(RawBodyMiddleware)
 *     .forRoutes('webhooks/*path');
 * }
 * ```
 *
 * El raw body queda disponible en `req.rawBody` como Buffer.
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  private readonly jsonParser = json({
    verify: (req: Request & { rawBody?: Buffer }, _res: Response, buf: Buffer) => {
      req.rawBody = buf;
    },
    limit: '1mb',
  });

  use(req: Request, res: Response, next: NextFunction): void {
    // Solo parsear si el body aún no fue procesado
    if (req.readable) {
      this.jsonParser(req, res, next);
    } else {
      next();
    }
  }
}
