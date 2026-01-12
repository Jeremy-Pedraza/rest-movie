// src/interceptors/timeout.interceptor.ts

/**
 * @fileoverview Interceptor para timeout de requests
 * @module interceptors
 *
 * Aplica un timeout global a todas las peticiones.
 * Configurable via APP_REQUEST_TIMEOUT en .env (default: 30000ms)
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { ERROR_CODES } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.timeoutMs = this.configService.get<number>('app.requestTimeout') || 30000;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException({
                success: false,
                statusCode: 408,
                message: `${RESPONSE_MESSAGES.ERROR.REQUEST_TIMEOUT} (${this.timeoutMs / 1000}s)`,
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
