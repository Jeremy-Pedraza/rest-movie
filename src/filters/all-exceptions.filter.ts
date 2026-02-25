// src/filters/all-exceptions.filter.ts

/**
 * @fileoverview Filtro global para todas las excepciones
 * @module filters
 *
 * Captura TODAS las excepciones excepto BadRequestException (manejada por ValidationExceptionFilter).
 * Integra ERROR_CODES para códigos de error estándar y maneja 10+ códigos PostgreSQL.
 *
 * IMPORTANTE: Este filter se ejecuta DESPUÉS de ValidationExceptionFilter
 * para capturar todo lo que no sea error de validación.
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
import { shouldLogToDb as checkShouldLogToDb } from '@config/logging-policy';
import { ERROR_CODES, ErrorCode } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

/**
 * Tipo para errores de PostgreSQL
 */
interface PostgresError {
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

/**
 * Respuesta de error estándar
 */
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  code: ErrorCode;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  details?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly dbLevel: LogDbLevel;
  private readonly retryAfter429Seconds: number;
  private readonly retryAfter503Seconds: number;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {
    this.dbLevel = this.configService.get<LogDbLevel>('app.logging.dbLevel') || 'all';
    this.retryAfter429Seconds = Number(process.env.HTTP_RETRY_AFTER_429_SECONDS || 60);
    this.retryAfter503Seconds = Number(process.env.HTTP_RETRY_AFTER_503_SECONDS || 30);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER;
    let error = 'Internal Server Error';
    let errorCode: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
    let details: string | undefined = undefined;

    // HttpException (401, 403, 404, 409, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
        error = (resp.error as string) || HttpStatus[status];

        // Usar el code si viene en la respuesta (HandleErrorService lo provee)
        if (resp.code && typeof resp.code === 'string') {
          errorCode = resp.code as ErrorCode;
        } else {
          errorCode = this.getErrorCodeFromStatus(status);
        }

        // Capturar detalles si existen (manejo seguro de tipos)
        if (resp.details !== undefined && resp.details !== null) {
          details = this.safeStringify(resp.details);
        }
      }
    }
    // TypeORM QueryFailedError (errores de PostgreSQL)
    else if (exception instanceof QueryFailedError) {
      const dbError = this.handleDatabaseError(exception as QueryFailedError);
      status = dbError.status;
      message = dbError.message;
      error = dbError.error;
      errorCode = dbError.code;
      details = dbError.details;
    }
    // Error genérico de JavaScript
    else if (exception instanceof Error) {
      message = exception.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER;
      errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
    }
    // Excepción desconocida
    else {
      message = RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER;
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
      details: details || undefined,
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
          details,
        },
      });
    }

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      response.setHeader('Retry-After', String(this.retryAfter429Seconds));
    }
    if (status === HttpStatus.SERVICE_UNAVAILABLE) {
      response.setHeader('Retry-After', String(this.retryAfter503Seconds));
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Convierte de forma segura cualquier valor a string
   * Evita el problema de [object Object] con objetos/arrays
   */
  private safeStringify(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Complex Object]';
      }
    }

    return String(value);
  }

  /**
   * Maneja errores de base de datos PostgreSQL
   * Cubre 10+ códigos de error más comunes
   */
  private handleDatabaseError(exception: QueryFailedError): {
    status: number;
    message: string;
    error: string;
    code: ErrorCode;
    details?: string;
  } {
    const pgError = exception as unknown as PostgresError;
    const pgCode = pgError.code;

    // Categoría 23xxx: Violaciones de integridad
    if (pgCode?.startsWith('23')) {
      switch (pgCode) {
        case '23505': // Unique violation
          return {
            status: HttpStatus.CONFLICT,
            message: pgError.detail || 'El registro ya existe',
            error: 'Conflict',
            code: ERROR_CODES.DATABASE_DUPLICATE_KEY,
            details: pgError.constraint,
          };

        case '23503': // Foreign key violation
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Referencia a registro inexistente',
            error: 'Bad Request',
            code: ERROR_CODES.DATABASE_ERROR,
            details: pgError.detail,
          };

        case '23502': // Not null violation
          return {
            status: HttpStatus.BAD_REQUEST,
            message: `Campo '${pgError.column || 'requerido'}' no puede ser nulo`,
            error: 'Bad Request',
            code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
            details: pgError.column,
          };

        case '23514': // Check constraint violation
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Restricción de validación violada',
            error: 'Bad Request',
            code: ERROR_CODES.VALIDATION_ERROR,
            details: pgError.constraint,
          };

        default:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Error de integridad de datos',
            error: 'Bad Request',
            code: ERROR_CODES.DATABASE_ERROR,
          };
      }
    }

    // Categoría 22xxx: Violaciones de datos
    if (pgCode?.startsWith('22')) {
      switch (pgCode) {
        case '22001': // String data right truncation
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Texto excede longitud máxima permitida',
            error: 'Bad Request',
            code: ERROR_CODES.VALIDATION_ERROR,
          };

        case '22003': // Numeric value out of range
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Valor numérico fuera de rango',
            error: 'Bad Request',
            code: ERROR_CODES.VALIDATION_ERROR,
          };

        case '22P02': // Invalid text representation (ej: UUID inválido, formato fecha)
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Formato de dato inválido',
            error: 'Bad Request',
            code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
            details: pgError.detail,
          };

        case '22007': // Invalid datetime format
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Formato de fecha/hora inválido',
            error: 'Bad Request',
            code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
          };

        default:
          return {
            status: HttpStatus.BAD_REQUEST,
            message: 'Formato de dato inválido',
            error: 'Bad Request',
            code: ERROR_CODES.VALIDATION_ERROR,
          };
      }
    }

    // Categoría 40xxx: Problemas de transacciones
    if (pgCode?.startsWith('40')) {
      switch (pgCode) {
        case '40001': // Serialization failure (deadlock)
          return {
            status: HttpStatus.CONFLICT,
            message: 'Conflicto de concurrencia detectado. Por favor, reintente la operación',
            error: 'Conflict',
            code: ERROR_CODES.DATABASE_TRANSACTION_ERROR,
          };

        case '40P01': // Deadlock detected
          return {
            status: HttpStatus.CONFLICT,
            message: 'Deadlock detectado. Por favor, reintente la operación',
            error: 'Conflict',
            code: ERROR_CODES.DATABASE_TRANSACTION_ERROR,
          };

        default:
          return {
            status: HttpStatus.CONFLICT,
            message: 'Error de transacción. Por favor, reintente',
            error: 'Conflict',
            code: ERROR_CODES.DATABASE_TRANSACTION_ERROR,
          };
      }
    }

    // Categoría 08xxx: Errores de conexión
    if (pgCode?.startsWith('08')) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Error de conexión a base de datos. Servicio temporalmente no disponible',
        error: 'Service Unavailable',
        code: ERROR_CODES.DATABASE_CONNECTION_ERROR,
        details: pgCode,
      };
    }

    // Categoría 42xxx: Errores de sintaxis SQL / Objetos no encontrados
    if (pgCode?.startsWith('42')) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: RESPONSE_MESSAGES.ERROR.DATABASE_ERROR,
        error: 'Internal Server Error',
        code: ERROR_CODES.DATABASE_QUERY_ERROR,
        details: `SQL Error: ${pgCode}`,
      };
    }

    // Categoría 53xxx: Recursos insuficientes
    if (pgCode?.startsWith('53')) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Recursos insuficientes en base de datos',
        error: 'Service Unavailable',
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        details: pgCode,
      };
    }

    // Error de base de datos genérico
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: RESPONSE_MESSAGES.ERROR.DATABASE_ERROR,
      error: 'Database Error',
      code: ERROR_CODES.DATABASE_ERROR,
      details: pgCode,
    };
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
      case 503:
        return ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return status >= 500 ? ERROR_CODES.INTERNAL_SERVER_ERROR : ERROR_CODES.VALIDATION_ERROR;
    }
  }

  /**
   * Determina si se debe loggear en BD según el status code y configuración
   */
  private shouldLogToDb(statusCode: number): boolean {
    if (!this.loggerService) return false;
    return checkShouldLogToDb(this.dbLevel, statusCode);
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
