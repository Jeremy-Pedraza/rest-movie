import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

/**
 * Middleware para preservar el raw body
 * Útil para verificar firmas de webhooks (Stripe, etc.)
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    })(req, res, next);
  }
}

/**
 * Interface extendida del Request con rawBody
 */
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}
