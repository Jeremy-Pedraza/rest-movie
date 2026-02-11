// src/pipes/parse-uuid.pipe.ts

/**
 * @fileoverview Pipe custom para validación de UUIDs con ERROR_CODES.
 * @module pipes
 *
 * Nombre distinto al built-in de NestJS (`StrictParseUUIDPipe`) para evitar
 * colisiones de import. Si no se requieren códigos de error personalizados,
 * usar el `ParseUUIDPipe` built-in de `@nestjs/common`.
 *
 * @example
 * ```typescript
 * // Uso con pipe custom (incluye code/field en error)
 * @Get(':id')
 * findOne(@Param('id', StrictParseUUIDPipe) id: string) {}
 *
 * // Uso con pipe built-in (recomendado para la mayoría de casos)
 * import { ParseUUIDPipe } from '@nestjs/common';
 * @Get(':id')
 * findOne(@Param('id', ParseUUIDPipe) id: string) {}
 * ```
 */

import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

import { ERROR_CODES } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

@Injectable()
export class StrictParseUUIDPipe implements PipeTransform<string> {
  transform(value: string, metadata?: ArgumentMetadata): string {
    const field = metadata?.data || 'id';

    if (!value) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELD,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        field,
      });
    }

    if (!isUUID(value)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `El campo "${field}" debe ser un UUID válido`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_UUID,
        field,
      });
    }

    return value;
  }
}

/**
 * @deprecated Usar StrictParseUUIDPipe o el ParseUUIDPipe built-in de @nestjs/common
 */
export { StrictParseUUIDPipe as ParseUUIDPipe };
