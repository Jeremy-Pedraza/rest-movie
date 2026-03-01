// src/filters/validation-exception.filter.ts

/**
 * @fileoverview Filtro especializado para errores de validación
 * @module filters
 *
 * Captura BadRequestException (principalmente de class-validator)
 * y agrupa los errores por campo para mejor UX en el frontend.
 *
 * IMPORTANTE: Este filter se ejecuta ANTES de AllExceptionsFilter
 * para proporcionar un formato especial a errores de validación.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

import { LoggerService, LogContext } from '@modules/logger';
import { LogDbLevel } from '@config/app.config';
import { shouldLogToDb as checkShouldLogToDb } from '@config/logging-policy';
import { ERROR_CODES, ErrorCode } from '@constants/error-codes.constant';

/**
 * Estructura de respuesta de BadRequestException
 */
interface ValidationExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
  code?: ErrorCode;
  details?: unknown;
}

/**
 * Respuesta de error de validación
 */
interface ValidationErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  code: ErrorCode;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  errors?: Record<string, string[]>;
  details?: unknown;
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);
  private readonly dbLevel: LogDbLevel;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {
    this.dbLevel = this.configService.get<LogDbLevel>('app.logging.dbLevel') || 'all';
  }

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;
    const exceptionResponse = exception.getResponse() as ValidationExceptionResponse;

    // Formatear errores de validación
    let validationErrors: Record<string, string[]> | undefined = undefined;
    let details: unknown = undefined;
    let message = 'Error de validación';
    let errorCode: ErrorCode = ERROR_CODES.VALIDATION_ERROR;

    // Verificar si tiene ERROR_CODE específico
    if (exceptionResponse.code) {
      errorCode = exceptionResponse.code;
    }
    if (exceptionResponse.details !== undefined) {
      details = exceptionResponse.details;
    }

    // Si message es un array, son errores de class-validator
    if (Array.isArray(exceptionResponse.message)) {
      validationErrors = this.formatValidationErrors(exceptionResponse.message);
      message = 'Los datos proporcionados no son válidos';
    }
    // Si es string, es un error genérico
    else if (typeof exceptionResponse.message === 'string') {
      message = exceptionResponse.message;
    }

    const errorResponse: ValidationErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error: 'Bad Request',
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId || undefined,
      errors: validationErrors,
      details,
    };

    // Log en consola
    this.logger.warn(
      `${request.method} ${request.url} - ${status} - ${message} [${errorCode}]`,
      validationErrors ? JSON.stringify(validationErrors, null, 2) : undefined,
    );

    // Log en base de datos (según configuración LOG_DB_LEVEL)
    if (this.loggerService && checkShouldLogToDb(this.dbLevel, status)) {
      void this.loggerService.warn(message, {
        context: LogContext.HTTP,
        errorCode,
        requestId: request.requestId,
        ip: request.ip,
        userAgent: request.get('user-agent'),
        method: request.method,
        url: request.url,
        statusCode: status,
        action: 'ValidationException',
        metadata: {
          errors: validationErrors,
          details: details !== undefined ? this.safeStringify(details) : undefined,
        },
      });
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Formatea los errores de validación de class-validator
   * Agrupa errores por campo para mejor UX en frontend
   *
   * @param errors - Array de mensajes de error de class-validator
   * @returns Objeto con errores agrupados por campo
   *
   * @example
   * Input: ["email must be an email", "email should not be empty", "password is too short"]
   * Output: {
   *   email: ["email must be an email", "email should not be empty"],
   *   password: ["password is too short"]
   * }
   */
  private formatValidationErrors(errors: string[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      // Extraer el nombre del campo del mensaje
      // Formato típico: "field must be ...", "field should be ...", "field is ..."
      const match = error.match(/^(\w+)\s+(must|should|is|cannot|has)/i);
      const field = match ? match[1] : 'general';

      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }

      formattedErrors[field].push(error);
    });

    return formattedErrors;
  }

  /**
   * Convierte de forma segura cualquier valor a string para logging.
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
}
