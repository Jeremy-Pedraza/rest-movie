import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v7 as uuidv7 } from 'uuid';

/** Longitud máxima permitida para x-request-id */
const MAX_REQUEST_ID_LENGTH = 128;

/** Patrón de caracteres permitidos: alfanuméricos, guiones, puntos, underscores */
const VALID_REQUEST_ID_PATTERN = /^[a-zA-Z0-9\-._]+$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'] as string | undefined;

    // Validar formato/longitud del request-id entrante; regenerar si inválido
    const requestId =
      incoming && this.isValidRequestId(incoming) ? incoming : uuidv7();

    // Agregar al request
    req.requestId = requestId;

    // Agregar al response header
    res.setHeader('X-Request-Id', requestId);

    next();
  }

  private isValidRequestId(value: string): boolean {
    return (
      value.length > 0 &&
      value.length <= MAX_REQUEST_ID_LENGTH &&
      VALID_REQUEST_ID_PATTERN.test(value)
    );
  }
}
