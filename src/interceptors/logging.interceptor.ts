// src/interceptors/logging.interceptor.ts

/**
 * @fileoverview Interceptor para logging de peticiones HTTP
 * @module interceptors
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

import { LoggerService } from '@modules/logger';
import { LogDbLevel } from '@config/app.config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly dbLevel: LogDbLevel;
  private readonly logConsole: boolean;
  private readonly ignorePaths: string[];

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {
    this.dbLevel = this.configService.get<LogDbLevel>('app.logging.dbLevel') || 'all';
    this.logConsole = this.configService.get<boolean>('app.logging.console') ?? true;
    this.ignorePaths = this.configService.get<string[]>('app.logging.ignorePaths') || [];
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;

    // Ignorar ciertas rutas (health checks, etc)
    if (this.shouldIgnorePath(url)) {
      return next.handle();
    }

    const userAgent = request.get('user-agent') || '';
    const requestId = request.requestId || '-';
    const userId = request.user?.id;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const statusCode = response.statusCode;
          const contentLength = response.get('content-length') || '0';
          const responseTime = Date.now() - startTime;

          // Log en consola (si está habilitado)
          if (this.logConsole) {
            this.logger.log(
              `${method} ${url} ${statusCode} ${contentLength} - ${responseTime}ms - ${ip} [${requestId}]`,
            );
          }

          // Log en base de datos (según configuración)
          if (this.shouldLogToDb(statusCode)) {
            void this.loggerService?.logHttpRequest({
              method,
              url,
              statusCode,
              responseTime,
              requestId: requestId !== '-' ? requestId : undefined,
              userId,
              ip: ip || undefined,
              userAgent: userAgent || undefined,
            });
          }
        },
        error: (error: Error & { status?: number }) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log en consola (siempre para errores)
          this.logger.error(
            `${method} ${url} ${statusCode} - ${responseTime}ms - ${ip} [${requestId}]`,
          );

          // Log en base de datos (según configuración)
          // Nota: Los errores también se loggean en AllExceptionsFilter con más detalle
          if (this.shouldLogToDb(statusCode)) {
            void this.loggerService?.logHttpRequest({
              method,
              url,
              statusCode,
              responseTime,
              requestId: requestId !== '-' ? requestId : undefined,
              userId,
              ip: ip || undefined,
              userAgent: userAgent || undefined,
            });
          }
        },
      }),
    );
  }

  /**
   * Determina si se debe loggear en BD según el status code y configuración
   */
  private shouldLogToDb(statusCode: number): boolean {
    if (!this.loggerService) return false;

    switch (this.dbLevel) {
      case 'none':
        return false;

      case 'errors':
        // Solo 5xx
        return statusCode >= 500;

      case 'warnings':
        // 4xx y 5xx
        return statusCode >= 400;

      case 'all':
      default:
        return true;
    }
  }

  /**
   * Verifica si la ruta debe ser ignorada
   */
  private shouldIgnorePath(url: string): boolean {
    // Extraer solo el path (sin query params)
    const path = url.split('?')[0];
    return this.ignorePaths.some((ignorePath) => path.startsWith(ignorePath));
  }
}
