// src/filters/all-exceptions.filter.ts

/**
 * @fileoverview Filtro global para todas las excepciones
 * @module filters
 *
 * Captura TODAS las excepciones y las formatea consistentemente.
 * Integra ERROR_CODES para códigos de error estándar.
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
import { ERROR_CODES, ErrorCode } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

/**
 * Tipo para errores de PostgreSQL
 */
interface PostgresError {
  code?: string;
  detail?: string;
  constraint?: string;
}

/**
 * Respuesta de error estándar
 */
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  code?: ErrorCode;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
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
    let message = RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER;
    let error = 'Internal Server Error';
    let errorCode: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;

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
        // Usar el code si viene en la respuesta
        if (resp.code && typeof resp.code === 'string') {
          errorCode = resp.code as ErrorCode;
        } else {
          errorCode = this.getErrorCodeFromStatus(status);
        }
      }
    }
    // TypeORM QueryFailedError
    else if (exception instanceof QueryFailedError) {
      const dbError = this.handleDatabaseError(exception);
      status = dbError.status;
      message = dbError.message;
      error = dbError.error;
      errorCode = dbError.code;
    }
    // Error genérico
    else if (exception instanceof Error) {
      message = exception.message;
      errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error,
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId || undefined,
    };

    // Log en consola (siempre para errores)
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message} [${errorCode}]`,
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
   * Maneja errores de base de datos
   */
  private handleDatabaseError(exception: QueryFailedError): {
    status: number;
    message: string;
    error: string;
    code: ErrorCode;
  } {
    const pgError = exception as unknown as PostgresError;

    switch (pgError.code) {
      case '23505': // Unique violation
        return {
          status: HttpStatus.CONFLICT,
          message: 'El registro ya existe',
          error: 'Conflict',
          code: ERROR_CODES.DATABASE_DUPLICATE_KEY,
        };

      case '23503': // Foreign key violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Referencia a registro inexistente',
          error: 'Bad Request',
          code: ERROR_CODES.DATABASE_ERROR,
        };

      case '23502': // Not null violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELD,
          error: 'Bad Request',
          code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: RESPONSE_MESSAGES.ERROR.DATABASE_ERROR,
          error: 'Database Error',
          code: ERROR_CODES.DATABASE_ERROR,
        };
    }
  }

  /**
   * Obtiene el ErrorCode basado en el status HTTP
   */
  private getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case 400:
        return ERROR_CODES.VALIDATION_ERROR;
      case 401:
        return ERROR_CODES.AUTH_UNAUTHORIZED;
      case 403:
        return ERROR_CODES.AUTH_FORBIDDEN;
      case 404:
        return ERROR_CODES.RESOURCE_NOT_FOUND;
      case 408:
        return ERROR_CODES.REQUEST_TIMEOUT;
      case 409:
        return ERROR_CODES.RESOURCE_CONFLICT;
      case 429:
        return ERROR_CODES.RATE_LIMIT_EXCEEDED;
      default:
        return status >= 500 ? ERROR_CODES.INTERNAL_SERVER_ERROR : ERROR_CODES.VALIDATION_ERROR;
    }
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
        return statusCode >= 500;
      case 'warnings':
        return statusCode >= 400;
      case 'all':
      default:
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
