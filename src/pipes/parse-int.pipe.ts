// src/pipes/parse-int.pipe.ts

/**
 * @fileoverview Pipes para validación de números enteros
 * @module pipes
 *
 * @example
 * ```typescript
 * // Entero cualquiera
 * @Get('items')
 * findAll(@Query('page', ParseIntPipe) page: number) {}
 *
 * // Solo positivos
 * @Get('items')
 * findAll(@Query('limit', ParsePositiveIntPipe) limit: number) {}
 * ```
 */

import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';

import { ERROR_CODES } from '@constants/error-codes.constant';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata?: ArgumentMetadata): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `"${value}" no es un número entero válido`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        field: metadata?.data || 'value',
      });
    }

    return val;
  }
}

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata?: ArgumentMetadata): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `"${value}" no es un número entero válido`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        field: metadata?.data || 'value',
      });
    }

    if (val < 0) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `"${value}" debe ser un número positivo`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_ERROR,
        field: metadata?.data || 'value',
      });
    }

    return val;
  }
}

@Injectable()
export class ParseOptionalIntPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined, metadata?: ArgumentMetadata): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `"${value}" no es un número entero válido`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        field: metadata?.data || 'value',
      });
    }

    return val;
  }
}
