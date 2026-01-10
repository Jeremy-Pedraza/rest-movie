import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Usar X-Request-Id del header o generar uno nuevo (UUIDv7)
    const requestId = (req.headers['x-request-id'] as string) || uuidv7();

    // Agregar al request
    req.requestId = requestId;

    // Agregar al response header
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
