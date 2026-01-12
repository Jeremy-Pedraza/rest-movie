// src/interceptors/transform.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T): Response<T> => {
        // Si la respuesta ya tiene el formato correcto, devolverla tal cual
        if (data && typeof data === 'object' && 'success' in data) {
          return data as unknown as Response<T>;
        }

        // Formatear respuesta estándar
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
