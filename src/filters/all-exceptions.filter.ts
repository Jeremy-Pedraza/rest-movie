// src/filters/all-exceptions.filter.ts

/**
 * @fileoverview Filtro global para todas las excepciones
 * @module filters
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

import { LoggerService, LogContext } from '@modules/logger';
import { LogDbLevel } from '@config/app.config';

/**
 * Tipo para errores de PostgreSQL
 */
interface PostgresError {
  code?: string;
  detail?: string;
  constraint?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly dbLevel: LogDbLevel;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {
    this.dbLevel = this.configService.get<LogDbLevel>('app.logging.dbLevel') || 'all';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';
    let errorCode: string | undefined;

    // HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        error = (resp.error as string) || HttpStatus[status];
      }
    }
    // TypeORM QueryFailedError
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Error en la consulta a la base de datos';
      error = 'Database Error';
      errorCode = 'DB_QUERY_ERROR';

      // Manejar errores específicos de PostgreSQL
      const pgError = exception as unknown as PostgresError;
      if (pgError.code === '23505') {
        // Unique violation
        status = HttpStatus.CONFLICT;
        message = 'El registro ya existe';
        error = 'Conflict';
        errorCode = 'DB_UNIQUE_VIOLATION';
      } else if (pgError.code === '23503') {
        // Foreign key violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Referencia a registro inexistente';
        error = 'Bad Request';
        errorCode = 'DB_FK_VIOLATION';
      } else if (pgError.code === '23502') {
        // Not null violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Campo requerido faltante';
        error = 'Bad Request';
        errorCode = 'DB_NOT_NULL_VIOLATION';
      }
    }
    // Error genérico
    else if (exception instanceof Error) {
      message = exception.message;
      errorCode = 'INTERNAL_ERROR';
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId || undefined,
    };

    // Log en consola (siempre para errores)
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Log en base de datos (según configuración)
    if (this.shouldLogToDb(status)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      const userId = request.user?.id;

      void this.loggerService?.error(message, {
        context: this.getLogContext(exception),
        errorCode,
        stack,
        requestId: request.requestId,
        userId,
        ip: request.ip,
        userAgent: request.get('user-agent'),
        method: request.method,
        url: request.url,
        statusCode: status,
        metadata: {
          error,
          exceptionName: exception instanceof Error ? exception.name : 'Unknown',
        },
      });
    }

    response.status(status).json(errorResponse);
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
        // En 'all' también loggeamos errores
        return statusCode >= 400;
    }
  }

  /**
   * Determina el contexto de log según el tipo de excepción
   */
  private getLogContext(exception: unknown): LogContext {
    if (exception instanceof QueryFailedError) {
      return LogContext.DATABASE;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === 401 || status === 403) {
        return LogContext.AUTH;
      }
    }

    return LogContext.SYSTEM;
  }
}
