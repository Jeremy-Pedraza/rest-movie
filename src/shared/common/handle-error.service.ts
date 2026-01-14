// src/shared/common/handle-error.service.ts

/**
 * @fileoverview Servicio centralizado para manejo de errores
 * @module shared/common
 *
 * Integra ERROR_CODES para códigos consistentes en toda la aplicación.
 */

import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  RequestTimeoutException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { ERROR_CODES, ErrorCode } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

/**
 * Interfaz para errores estructurados
 */
export interface IStructuredError {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  code?: ErrorCode;
  details?: unknown;
  field?: string;
}

/**
 * Códigos de error de PostgreSQL comunes
 */
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  INVALID_TEXT_REPRESENTATION: '22P02',
  STRING_DATA_RIGHT_TRUNCATION: '22001',
} as const;

/**
 * HandleErrorService - Servicio centralizado para manejo de errores
 *
 * @example
 * ```typescript
 * // En un service
 * if (!user) {
 *   this.handleError.notFound('Usuario', id);
 * }
 *
 * // Manejar errores de BD
 * try {
 *   await this.repository.save(entity);
 * } catch (error) {
 *   throw this.handleError.handle(error, 'Error guardando usuario');
 * }
 * ```
 */
@Injectable()
export class HandleErrorService {
  private readonly logger = new Logger(HandleErrorService.name);

  /**
   * Maneja cualquier tipo de error y lo transforma en una HttpException apropiada
   *
   * @param error - Error original
   * @param context - Contexto adicional para el log
   * @returns HttpException con el error apropiado
   */
  handle(error: unknown, context?: string): HttpException {
    // Si ya es una HttpException, re-lanzarla
    if (error instanceof HttpException) {
      this.logError(error, context);
      return error;
    }

    // Manejar errores de TypeORM/PostgreSQL
    if (error instanceof QueryFailedError) {
      return this.handleDatabaseError(error as QueryFailedError, context);
    }

    // Manejar errores de validación
    if (this.isValidationError(error)) {
      return this.handleValidationError(error, context);
    }

    // Error genérico
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.logger.error(`${context || 'Error'}: ${errorMessage}`, errorStack);

    return new InternalServerErrorException({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
      error: 'Internal Server Error',
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    } satisfies IStructuredError);
  }

  /**
   * Maneja errores específicos de base de datos (TypeORM/PostgreSQL)
   */
  handleDatabaseError(error: QueryFailedError, context?: string): HttpException {
    const pgError = error as unknown as {
      code?: string;
      detail?: string;
      driverError?: { detail?: string };
    };
    const code = pgError.code;

    this.logger.error(`Database Error [${code}]: ${error.message}`, {
      context,
      code,
    });

    switch (code) {
      case PG_ERROR_CODES.UNIQUE_VIOLATION:
        return this.handleUniqueViolation(pgError);

      case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El registro referenciado no existe',
          error: 'Foreign Key Violation',
          code: ERROR_CODES.DATABASE_ERROR,
        } satisfies IStructuredError);

      case PG_ERROR_CODES.NOT_NULL_VIOLATION:
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELD,
          error: 'Not Null Violation',
          code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        } satisfies IStructuredError);

      case PG_ERROR_CODES.CHECK_VIOLATION:
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El valor no cumple con las restricciones',
          error: 'Check Violation',
          code: ERROR_CODES.VALIDATION_ERROR,
        } satisfies IStructuredError);

      case PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: RESPONSE_MESSAGES.VALIDATION.INVALID_FORMAT,
          error: 'Invalid Input',
          code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        } satisfies IStructuredError);

      default:
        return new InternalServerErrorException({
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: RESPONSE_MESSAGES.ERROR.DATABASE_ERROR,
          error: 'Database Error',
          code: ERROR_CODES.DATABASE_ERROR,
        } satisfies IStructuredError);
    }
  }

  /**
   * Extrae el campo duplicado de un error UNIQUE_VIOLATION
   */
  private handleUniqueViolation(error: {
    detail?: string;
    driverError?: { detail?: string };
  }): ConflictException {
    const detail = error.detail || error.driverError?.detail || '';
    const match = detail.match(/Key \(([^)]+)\)/);
    const field = match ? match[1] : 'campo';

    return new ConflictException({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      message: `El valor de '${field}' ya existe`,
      error: 'Conflict',
      code: ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      field,
    } satisfies IStructuredError);
  }

  /**
   * Verifica si es un error de validación
   */
  private isValidationError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const err = error as Record<string, unknown>;
    return (
      err.name === 'ValidationError' ||
      Array.isArray(err.errors) ||
      typeof err.constraints === 'object'
    );
  }

  /**
   * Maneja errores de validación
   */
  private handleValidationError(error: unknown, context?: string): BadRequestException {
    this.logError(error, context);

    const err = error as Record<string, unknown>;
    const details = err.errors || err.constraints || [];

    return new BadRequestException({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: RESPONSE_MESSAGES.VALIDATION.INVALID_FORMAT,
      error: 'Bad Request',
      code: ERROR_CODES.VALIDATION_ERROR,
      details,
    } satisfies IStructuredError);
  }

  /**
   * Registra el error en el logger
   */
  private logError(error: unknown, context?: string): void {
    const err = error as Error & { status?: number };
    const message = err.message || 'Unknown error';
    const statusCode = error instanceof HttpException ? error.getStatus() : 500;

    if (statusCode >= 500) {
      this.logger.error(`${context || 'Error'}: ${message}`, err.stack);
    } else {
      this.logger.warn(`${context || 'Warning'}: ${message}`);
    }
  }

  // ============================================
  // MÉTODOS DE CONVENIENCIA
  // ============================================

  /**
   * Lanza un BadRequestException
   */
  badRequest(
    message: string,
    details?: unknown,
    code: ErrorCode = ERROR_CODES.VALIDATION_ERROR,
  ): never {
    throw new BadRequestException({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Bad Request',
      code,
      details,
    } satisfies IStructuredError);
  }

  /**
   * Lanza un UnauthorizedException
   */
  unauthorized(
    message: string = RESPONSE_MESSAGES.AUTH.UNAUTHORIZED,
    code: ErrorCode = ERROR_CODES.AUTH_UNAUTHORIZED,
  ): never {
    throw new UnauthorizedException({
      success: false,
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'Unauthorized',
      code,
    } satisfies IStructuredError);
  }

  /**
   * Lanza un ForbiddenException
   */
  forbidden(
    message: string = RESPONSE_MESSAGES.AUTH.FORBIDDEN,
    code: ErrorCode = ERROR_CODES.AUTH_FORBIDDEN,
  ): never {
    throw new ForbiddenException({
      success: false,
      statusCode: HttpStatus.FORBIDDEN,
      message,
      error: 'Forbidden',
      code,
    } satisfies IStructuredError);
  }

  /**
   * Lanza un NotFoundException
   */
  notFound(
    resource: string,
    identifier?: string,
    code: ErrorCode = ERROR_CODES.RESOURCE_NOT_FOUND,
  ): never {
    const message = identifier
      ? `${resource} con ID '${identifier}' no encontrado`
      : `${resource} no encontrado`;

    throw new NotFoundException({
      success: false,
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: 'Not Found',
      code,
    } satisfies IStructuredError);
  }

  /**
   * Lanza un ConflictException
   */
  conflict(
    message: string,
    field?: string,
    code: ErrorCode = ERROR_CODES.RESOURCE_CONFLICT,
  ): never {
    throw new ConflictException({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'Conflict',
      code,
      field,
    } satisfies IStructuredError);
  }

  /**
   * Lanza un InternalServerErrorException
   */
  internal(
    message: string = RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
    code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
  ): never {
    throw new InternalServerErrorException({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: 'Internal Server Error',
      code,
    } satisfies IStructuredError);
  }

  /**
   * Alias de internal() para compatibilidad
   * Lanza un InternalServerErrorException
   */
  internalServerError(
    message: string = RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
    code: ErrorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
  ): never {
    return this.internal(message, code);
  }

  /**
   * Lanza un RequestTimeoutException
   */
  timeout(
    message: string = RESPONSE_MESSAGES.ERROR.REQUEST_TIMEOUT,
    code: ErrorCode = ERROR_CODES.REQUEST_TIMEOUT,
  ): never {
    throw new RequestTimeoutException({
      success: false,
      statusCode: HttpStatus.REQUEST_TIMEOUT,
      message,
      error: 'Request Timeout',
      code,
    } satisfies IStructuredError);
  }
}
