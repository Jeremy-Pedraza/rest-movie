// src/interceptors/timeout.interceptor.ts

/**
 * @fileoverview Interceptor para timeout de requests
 * @module interceptors
 *
 * Aplica un timeout global a todas las peticiones (default: 30s via APP_REQUEST_TIMEOUT).
 * Endpoints específicos pueden sobreescribir el timeout con @SetTimeout(ms):
 *
 * @example
 * ```typescript
 * @SetTimeout(120000) // 2 minutos para reportes pesados
 * @Get('export')
 * exportData() {}
 * ```
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { ERROR_CODES } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

/** Metadata key para timeout por endpoint */
export const TIMEOUT_KEY = 'custom:timeout';

/**
 * Decorador para sobreescribir el timeout en endpoints específicos.
 * @param ms - Timeout en milisegundos
 */
export const SetTimeout = (ms: number) => SetMetadata(TIMEOUT_KEY, ms);

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeoutMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {
    this.defaultTimeoutMs = this.configService.get<number>('app.requestTimeout') || 30000;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Permitir override por endpoint vía @SetTimeout(ms)
    const handlerTimeout = this.reflector.get<number>(TIMEOUT_KEY, context.getHandler());
    const classTimeout = this.reflector.get<number>(TIMEOUT_KEY, context.getClass());
    const effectiveTimeout = handlerTimeout ?? classTimeout ?? this.defaultTimeoutMs;

    return next.handle().pipe(
      timeout(effectiveTimeout),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException({
                success: false,
                statusCode: 408,
                message: `${RESPONSE_MESSAGES.ERROR.REQUEST_TIMEOUT} (${effectiveTimeout / 1000}s)`,
                error: 'Request Timeout',
                code: ERROR_CODES.REQUEST_TIMEOUT,
              }),
          );
        }
        return throwError(() => err as Error);
      }),
    );
  }
}
