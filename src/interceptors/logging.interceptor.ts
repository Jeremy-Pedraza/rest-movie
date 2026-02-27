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
import {
  shouldLogToDb as checkShouldLogToDb,
  redactUrl as redactSensitiveUrl,
} from '@config/logging-policy';

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

    const requestId = request.requestId || '-';

    // Redactar query params sensibles para consola; path limpio para DB
    const safeUrl = this.redactUrl(url);
    const pathOnly = url.split('?')[0];

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const statusCode = response.statusCode;
          const contentLength = response.get('content-length') || '0';
          const responseTime = Date.now() - startTime;

          // Leer userId y userAgent DESPUÉS del handler (login setea request.user durante ejecución)
          const userId = request.user?.id;
          const userAgent = request.get('user-agent') || '';

          // Log en consola (si está habilitado)
          if (this.logConsole) {
            this.logger.log(
              `${method} ${safeUrl} ${statusCode} ${contentLength} - ${responseTime}ms [${requestId}]`,
            );
          }

          // Log en base de datos (según configuración) — solo path, sin query
          if (this.shouldLogToDb(statusCode)) {
            void this.loggerService
              ?.logHttpRequest({
                method,
                url: pathOnly,
                statusCode,
                responseTime,
                requestId: requestId !== '-' ? requestId : undefined,
                userId,
                ip: ip || undefined,
                userAgent: userAgent || undefined,
              })
              .catch((err: Error) => {
                this.logger.warn(`Error al escribir log HTTP en DB: ${err.message}`);
              });
          }
        },
        error: (error: Error & { status?: number }) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Solo log en consola — la persistencia en BD la maneja AllExceptionsFilter
          // que captura la excepción con contexto completo (ip, userId, method, etc.)
          if (this.logConsole) {
            this.logger.error(
              `${method} ${safeUrl} ${statusCode} - ${responseTime}ms [${requestId}]`,
            );
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
    return checkShouldLogToDb(this.dbLevel, statusCode);
  }

  /**
   * Verifica si la ruta debe ser ignorada
   */
  private shouldIgnorePath(url: string): boolean {
    // Extraer solo el path (sin query params)
    const path = url.split('?')[0];
    return this.ignorePaths.some((ignorePath) => path.startsWith(ignorePath));
  }

  /**
   * Redacta parámetros sensibles de la URL para logging seguro.
   */
  private redactUrl(url: string): string {
    return redactSensitiveUrl(url);
  }
}
