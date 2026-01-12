// src/pipes/parse-uuid.pipe.ts

/**
 * @fileoverview Pipe para validación de UUIDs
 * @module pipes
 *
 * Valida que un parámetro sea un UUID válido (v1-v7).
 * Usa ERROR_CODES para códigos consistentes.
 *
 * @example
 * ```typescript
 * // Uso en controller
 * @Get(':id')
 * findOne(@Param('id', ParseUUIDPipe) id: string) {}
 *
 * // El pipe de NestJS también funciona bien:
 * @Get(':id')
 * findOne(@Param('id', ParseUUIDPipe) id: string) {}
 * ```
 */

import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

import { ERROR_CODES } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  transform(value: string, metadata?: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELD,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_REQUIRED_FIELD,
        field: metadata?.data || 'id',
      });
    }

    if (!isUUID(value)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `${RESPONSE_MESSAGES.VALIDATION.INVALID_UUID}: "${value}"`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_UUID,
        field: metadata?.data || 'id',
      });
    }

    return value;
  }
}
