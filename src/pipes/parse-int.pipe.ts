// src/pipes/parse-int.pipe.ts

/**
 * @fileoverview Pipes custom para validación estricta de números enteros.
 * @module pipes
 *
 * Estos pipes aplican parseo estricto (rechazan "12abc", " ", "+10", etc.)
 * a diferencia de parseInt que acepta prefijos numéricos.
 *
 * Nombre distinto al built-in de NestJS (`StrictParseIntPipe`) para evitar
 * colisiones de import. Si no se requiere parseo estricto, usar el built-in.
 *
 * @example
 * ```typescript
 * // Entero cualquiera (estricto)
 * @Get('items')
 * findAll(@Query('page', StrictParseIntPipe) page: number) {}
 *
 * // Solo positivos (> 0)
 * @Get('items')
 * findAll(@Query('limit', StrictParsePositiveIntPipe) limit: number) {}
 *
 * // Opcional (undefined si vacío)
 * @Get('items')
 * findAll(@Query('offset', StrictParseOptionalIntPipe) offset?: number) {}
 * ```
 */

import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';

import { ERROR_CODES } from '@constants/error-codes.constant';

/** Patrón para entero canónico: dígitos opcionales con signo negativo, sin espacios */
const STRICT_INT_PATTERN = /^-?\d+$/;

/**
 * Parsea un string a entero de forma estricta.
 * Rechaza: "12abc", " 10 ", "+10", "1.5", "", NaN.
 */
function strictParseInt(value: string): number | null {
  const trimmed = value.trim();
  if (!STRICT_INT_PATTERN.test(trimmed)) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || !Number.isInteger(num)) return null;
  return num;
}

@Injectable()
export class StrictParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata?: ArgumentMetadata): number {
    const val = strictParseInt(value);
    const field = metadata?.data || 'value';

    if (val === null) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `El campo "${field}" debe ser un número entero válido`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        field,
      });
    }

    return val;
  }
}

@Injectable()
export class StrictParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata?: ArgumentMetadata): number {
    const val = strictParseInt(value);
    const field = metadata?.data || 'value';

    if (val === null) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `El campo "${field}" debe ser un número entero válido`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        field,
      });
    }

    if (val <= 0) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `El campo "${field}" debe ser un número entero positivo (mayor a 0)`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_ERROR,
        field,
      });
    }

    return val;
  }
}

@Injectable()
export class StrictParseOptionalIntPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value: string | undefined, metadata?: ArgumentMetadata): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const val = strictParseInt(value);
    const field = metadata?.data || 'value';

    if (val === null) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: `El campo "${field}" debe ser un número entero válido`,
        error: 'Bad Request',
        code: ERROR_CODES.VALIDATION_INVALID_FORMAT,
        field,
      });
    }

    return val;
  }
}

/**
 * @deprecated Usar StrictParseIntPipe en su lugar
 */
export const ParseIntPipe = StrictParseIntPipe;

/**
 * @deprecated Usar StrictParsePositiveIntPipe en su lugar
 */
export const ParsePositiveIntPipe = StrictParsePositiveIntPipe;

/**
 * @deprecated Usar StrictParseOptionalIntPipe en su lugar
 */
export const ParseOptionalIntPipe = StrictParseOptionalIntPipe;
