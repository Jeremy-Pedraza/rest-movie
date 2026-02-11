// src/interceptors/transform.interceptor.ts

/**
 * @fileoverview Interceptor para transformar respuestas a formato estándar.
 *
 * IMPORTANTE: Este interceptor NO debe registrarse globalmente.
 * El proyecto usa IApiResponse devuelto directamente por controllers.
 * Usar solo en endpoints puntuales que integren servicios externos
 * que no retornen el formato estándar.
 *
 * @see docs/CODE-PATTERNS.md ("NO usamos TransformInterceptor global")
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T): Response<T> => {
        // Si la respuesta ya tiene el formato IApiResponse, no transformar
        if (data && typeof data === 'object' && 'success' in data) {
          return data as unknown as Response<T>;
        }

        // Transformar respuesta cruda a formato estándar
        this.logger.debug(
          `Transformando respuesta en ${context.getClass().name}.${context.getHandler().name}`,
        );

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
