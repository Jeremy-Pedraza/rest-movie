// src/shared/utils/helpers/transform.helper.ts

/**
 * @fileoverview Helpers de transformación para class-transformer
 * @module shared/utils/helpers/transform
 *
 * Resuelve conflicto conocido entre `@Transform` y `enableImplicitConversion: true`.
 * Con enableImplicitConversion, class-transformer ejecuta `Boolean('false')` → `true`
 * porque 'false' es un string no vacío. Estos helpers manejan explícitamente
 * los valores string de query params antes de la conversión implícita.
 */

/**
 * Transforma un valor de query string a boolean de forma segura.
 *
 * Compatible con `enableImplicitConversion: true` del ValidationPipe.
 * Maneja correctamente los strings 'true'/'false' de los query params.
 *
 * @param value - Valor crudo del query param (string, boolean, undefined, null)
 * @returns `true`, `false`, o `undefined` si no se envió el parámetro
 *
 * @example
 * ```typescript
 * // En un DTO:
 * @Transform(({ value }) => toBoolean(value))
 * @IsBoolean()
 * @IsOptional()
 * myFlag?: boolean;
 * ```
 */
export function toBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}
