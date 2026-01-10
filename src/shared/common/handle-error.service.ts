// src/shared/common/handle-error.service.ts
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
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/**
 * Interfaz para errores estructurados
 */
export interface IStructuredError {
  statusCode: number;
  message: string;
  error: string;
  details?: any;
  code?: string;
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
 * Proporciona métodos estandarizados para el manejo y transformación
 * de errores en toda la aplicación.
 *
 * @example
 * ```typescript
 * try {
 *   await this.repository.create(dto);
 * } catch (error) {
 *   throw this.handleError.handle(error, 'Error al crear usuario');
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
  handle(error: any, context?: string): HttpException {
    // Si ya es una HttpException, re-lanzarla
    if (error instanceof HttpException) {
      this.logError(error, context);
      return error;
    }

    // Manejar errores de TypeORM/PostgreSQL
    if (error instanceof QueryFailedError) {
      return this.handleDatabaseError(error, context);
    }

    // Manejar errores de validación
    if (this.isValidationError(error)) {
      return this.handleValidationError(error, context);
    }

    // Error genérico
    this.logger.error(`${context || 'Error'}: ${error.message}`, error.stack);

    return new InternalServerErrorException({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno del servidor',
      error: 'Internal Server Error',
    });
  }

  /**
   * Maneja errores específicos de base de datos (TypeORM/PostgreSQL)
   *
   * @param error - QueryFailedError de TypeORM
   * @param context - Contexto adicional
   * @returns HttpException apropiada
   */
  handleDatabaseError(error: QueryFailedError, context?: string): HttpException {
    const pgError = error as any;
    const code = pgError.code || pgError.driverError?.code;

    this.logger.error(`Database Error [${code}]: ${error.message}`, {
      context,
      query: pgError.query,
      parameters: pgError.parameters,
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
          code: 'FOREIGN_KEY_VIOLATION',
        });

      case PG_ERROR_CODES.NOT_NULL_VIOLATION:
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Falta un campo requerido',
          error: 'Not Null Violation',
          code: 'NOT_NULL_VIOLATION',
        });

      case PG_ERROR_CODES.CHECK_VIOLATION:
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'El valor no cumple con las restricciones',
          error: 'Check Violation',
          code: 'CHECK_VIOLATION',
        });

      case PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Formato de dato inválido',
          error: 'Invalid Input',
          code: 'INVALID_INPUT',
        });

      default:
        return new InternalServerErrorException({
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error en la base de datos',
          error: 'Database Error',
        });
    }
  }

  /**
   * Extrae el campo duplicado de un error UNIQUE_VIOLATION
   */
  private handleUniqueViolation(error: any): ConflictException {
    // Intentar extraer el campo del detalle del error
    const detail = error.detail || error.driverError?.detail || '';
    const match = detail.match(/Key \(([^)]+)\)/);
    const field = match ? match[1] : 'campo';

    return new ConflictException({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      message: `El valor de '${field}' ya existe`,
      error: 'Conflict',
      code: 'DUPLICATE_ENTRY',
      field,
    });
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
  private handleValidationError(error: any, context?: string): BadRequestException {
    this.logError(error, context);

    const details = error.errors || error.constraints || [];

    return new BadRequestException({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Error de validación',
      error: 'Bad Request',
      details,
    });
  }

  /**
   * Registra el error en el logger
   */
  private logError(error: any, context?: string): void {
    const message = error.message || 'Unknown error';
    const statusCode = error instanceof HttpException ? error.getStatus() : 500;

    if (statusCode >= 500) {
      this.logger.error(`${context || 'Error'}: ${message}`, error.stack);
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
  badRequest(message: string, details?: any): never {
    throw new BadRequestException({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Bad Request',
      details,
    });
  }

  /**
   * Lanza un UnauthorizedException
   */
  unauthorized(message: string = 'No autorizado'): never {
    throw new UnauthorizedException({
      success: false,
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'Unauthorized',
    });
  }

  /**
   * Lanza un ForbiddenException
   */
  forbidden(message: string = 'Acceso denegado'): never {
    throw new ForbiddenException({
      success: false,
      statusCode: HttpStatus.FORBIDDEN,
      message,
      error: 'Forbidden',
    });
  }

  /**
   * Lanza un NotFoundException
   */
  notFound(resource: string, identifier?: string): never {
    const message = identifier
      ? `${resource} con ID '${identifier}' no encontrado`
      : `${resource} no encontrado`;

    throw new NotFoundException({
      success: false,
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: 'Not Found',
    });
  }

  /**
   * Lanza un ConflictException
   */
  conflict(message: string, field?: string): never {
    throw new ConflictException({
      success: false,
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'Conflict',
      field,
    });
  }

  /**
   * Lanza un InternalServerErrorException
   */
  internal(message: string = 'Error interno del servidor'): never {
    throw new InternalServerErrorException({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: 'Internal Server Error',
    });
  }
}
