import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = HttpStatus.BAD_REQUEST;
    const exceptionResponse = exception.getResponse() as any;

    // Formatear errores de validación
    let validationErrors: Record<string, string[]> | null = null;
    let message = 'Error de validación';

    if (Array.isArray(exceptionResponse.message)) {
      validationErrors = this.formatValidationErrors(exceptionResponse.message);
      message = 'Los datos proporcionados no son válidos';
    } else if (typeof exceptionResponse.message === 'string') {
      message = exceptionResponse.message;
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      error: 'Validation Error',
      errors: validationErrors,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId || undefined,
    };

    // Log del error
    this.logger.warn(`${request.method} ${request.url} - Validation Error`, {
      errors: validationErrors,
    });

    response.status(status).json(errorResponse);
  }

  /**
   * Formatea los errores de validación de class-validator
   * @param errors - Array de mensajes de error
   * @returns Objeto con errores agrupados por campo
   */
  private formatValidationErrors(errors: string[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      // Intentar extraer el nombre del campo del mensaje
      // Formato típico: "field must be ..." o "field should be ..."
      const match = error.match(/^(\w+)\s/);
      const field = match ? match[1] : 'general';

      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error);
    });

    return formattedErrors;
  }
}
