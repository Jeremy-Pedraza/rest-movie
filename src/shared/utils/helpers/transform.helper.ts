// src/shared/utils/helpers/transform.helper.ts

/**
 * @fileoverview Helpers de transformación para class-transformer
 * @module shared/utils/helpers/transform
 *
 * Resuelve conflicto en class-transformer 0.5.x donde `enableImplicitConversion: true`
 * ejecuta la conversión implícita ANTES del `@Transform`.
 *
 * En TransformOperationExecutor.js (PLAIN_TO_CLASS):
 *   finalValue = this.transform(subSource, subValue, type, ...);          // 1. Implicit: Boolean('false') → true
 *   finalValue = this.applyCustomTransformations(finalValue, ..., value); // 2. @Transform recibe true, no 'false'
 *
 * Solución: Leer el valor crudo desde `obj[key]` (el objeto fuente original)
 * en lugar de `value` (ya convertido implícitamente).
 */

/**
 * Transforma un valor de query string a boolean de forma segura.
 *
 * Lee el valor crudo desde el objeto fuente (`obj[key]`) para evitar
 * la interferencia de `enableImplicitConversion` que convierte
 * `Boolean('false')` → `true`.
 *
 * @param params - Parámetros del decorador @Transform de class-transformer
 * @returns `true`, `false`, o `undefined` si no se envió el parámetro
 *
 * @example
 * ```typescript
 * // En un DTO:
 * @Transform(toBoolean)
 * @IsBoolean()
 * @IsOptional()
 * myFlag?: boolean;
 * ```
 */
export function toBoolean(params: {
  value: unknown;
  key: string;
  obj: Record<string, unknown>;
}): boolean | undefined {
  // Leer valor CRUDO del objeto fuente, no el `value` ya convertido
  const raw = params.obj[params.key];
  if (raw === undefined || raw === null) return undefined;
  if (raw === 'true' || raw === true) return true;
  if (raw === 'false' || raw === false) return false;
  return undefined;
}
