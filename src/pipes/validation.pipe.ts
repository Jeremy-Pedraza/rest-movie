// src/pipes/validation.pipe.ts

/**
 * @fileoverview Pipe de validación custom con formato de errores agrupado por campo.
 *
 * @deprecated NO usar en nuevos endpoints.
 * El proyecto usa `ValidationPipe` global de `@nestjs/common` (configurado en main.ts)
 * con `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`.
 * Los errores se formatean por `ValidationExceptionFilter`.
 *
 * Este pipe existe solo como referencia. Si se usa, su formato de error
 * difiere del global y puede causar inconsistencias en el cliente.
 *
 * @see src/main.ts (app.useGlobalPipes)
 * @see src/filters/validation-exception.filter.ts
 */

import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Tipo para clases constructoras
 */
type ClassConstructor<T = unknown> = new (...args: unknown[]) => T;

/**
 * @deprecated Usar `ValidationPipe` global de `@nestjs/common` en su lugar.
 */
@Injectable()
export class CustomValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value as Record<string, unknown>);
    const errors = await validate(object as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        message: 'Error de validación',
        errors: formattedErrors,
      });
    }

    return object;
  }

  private toValidate(metatype: ClassConstructor): boolean {
    const types: ClassConstructor[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      const property = error.property;
      const constraints = error.constraints;

      if (constraints) {
        result[property] = Object.values(constraints);
      }

      // Manejar errores anidados
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        for (const key of Object.keys(nestedErrors)) {
          result[`${property}.${key}`] = nestedErrors[key];
        }
      }
    }

    return result;
  }
}
