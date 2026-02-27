// src/@types/uuid.d.ts

/**
 * Declaración de tipos para uuid v13+
 * Fallback en caso de que los tipos built-in no se detecten correctamente
 *
 * uuid v13+ incluye sus propios tipos TypeScript, este archivo
 * existe solo como fallback para TypeScript.
 */

declare module 'uuid' {
  /**
   * Genera un UUID v1 (basado en timestamp)
   */
  export function v1(options?: V1Options, buffer?: ArrayLike<number>, offset?: number): string;
  export function v1(
    options: V1Options | null | undefined,
    buffer: ArrayLike<number>,
    offset?: number,
  ): ArrayLike<number>;

  /**
   * Genera un UUID v4 (aleatorio)
   */
  export function v4(options?: V4Options, buffer?: ArrayLike<number>, offset?: number): string;
  export function v4(
    options: V4Options | null | undefined,
    buffer: ArrayLike<number>,
    offset?: number,
  ): ArrayLike<number>;

  /**
   * Genera un UUID v5 (basado en namespace + name con SHA-1)
   */
  export function v5(
    name: string | ArrayLike<number>,
    namespace: string | ArrayLike<number>,
    buffer?: ArrayLike<number>,
    offset?: number,
  ): string;
  export function v5(
    name: string | ArrayLike<number>,
    namespace: string | ArrayLike<number>,
    buffer: ArrayLike<number>,
    offset?: number,
  ): ArrayLike<number>;

  /**
   * Genera un UUID v6 (ordenable por timestamp)
   */
  export function v6(options?: V6Options, buffer?: ArrayLike<number>, offset?: number): string;
  export function v6(
    options: V6Options | null | undefined,
    buffer: ArrayLike<number>,
    offset?: number,
  ): ArrayLike<number>;

  /**
   * Genera un UUID v7 (ordenable por timestamp, basado en Unix epoch)
   */
  export function v7(options?: V7Options, buffer?: ArrayLike<number>, offset?: number): string;
  export function v7(
    options: V7Options | null | undefined,
    buffer: ArrayLike<number>,
    offset?: number,
  ): ArrayLike<number>;

  /**
   * Valida que un string sea un UUID válido
   */
  export function validate(uuid: string): boolean;

  /**
   * Detecta la versión de un UUID
   */
  export function version(uuid: string): number;

  /**
   * Parsea un UUID string a un array de bytes
   */
  export function parse(uuid: string): Uint8Array;

  /**
   * Convierte un array de bytes a un UUID string
   */
  export function stringify(arr: ArrayLike<number>, offset?: number): string;

  /**
   * UUID nil (todos ceros)
   */
  export const NIL: string;

  /**
   * UUID max (todos unos)
   */
  export const MAX: string;

  /**
   * Namespaces predefinidos
   */
  export namespace v5 {
    const DNS: string;
    const URL: string;
  }

  export interface V1Options {
    node?: ArrayLike<number>;
    clockseq?: number;
    msecs?: number;
    nsecs?: number;
    random?: ArrayLike<number>;
    rng?: () => ArrayLike<number>;
  }

  export interface V4Options {
    random?: ArrayLike<number>;
    rng?: () => ArrayLike<number>;
  }

  export interface V6Options {
    node?: ArrayLike<number>;
    clockseq?: number;
    msecs?: number;
    nsecs?: number;
    random?: ArrayLike<number>;
    rng?: () => ArrayLike<number>;
  }

  export interface V7Options {
    msecs?: number;
    random?: ArrayLike<number>;
    rng?: () => ArrayLike<number>;
    seq?: number;
  }
}
