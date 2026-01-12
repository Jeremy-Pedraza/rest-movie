// src/middleware/raw-body.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import { IncomingMessage } from 'http';

/**
 * Request con rawBody para verificar callback
 */
interface RawBodyRequest extends IncomingMessage {
  rawBody?: Buffer;
}

/**
 * Middleware para preservar el raw body
 * Útil para verificar firmas de webhooks (Stripe, etc.)
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    bodyParser.json({
      verify: (rawReq: RawBodyRequest, _res: Response, buf: Buffer) => {
        rawReq.rawBody = buf;
      },
    })(req, res, next);
  }
}
