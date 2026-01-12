// src/modules/cache/interfaces/cache-options.interface.ts

/**
 * @fileoverview Interfaces para configuración de cache
 * @module modules/cache
 */

/**
 * Opciones para operaciones de cache
 */
export interface ICacheOptions {
  /**
   * Time to live en segundos
   * @default 3600 (1 hora)
   */
  ttl?: number;

  /**
   * Tags para agrupar caches relacionados
   * Útil para invalidación masiva
   * @example ['users', 'user:123']
   */
  tags?: string[];

  /**
   * Si es true, no cachea valores null/undefined
   * @default false
   */
  skipNull?: boolean;

  /**
   * Si es true, fuerza la actualización del cache
   * @default false
   */
  refresh?: boolean;
}

/**
 * Estadísticas de cache
 */
export interface ICacheStats {
  /** Total de hits (cache encontrado) */
  hits: number;

  /** Total de misses (cache no encontrado) */
  misses: number;

  /** Ratio de hits (hits / total) */
  hitRatio: number;

  /** Total de keys en cache */
  totalKeys: number;

  /** Memoria usada (si disponible) */
  memoryUsage?: string;

  /** Estadísticas por tag */
  byTag?: Record<string, ITagStats>;

  /** Timestamp de última actualización */
  lastUpdated: Date;
}

/**
 * Estadísticas por tag
 */
export interface ITagStats {
  /** Hits de este tag */
  hits: number;

  /** Misses de este tag */
  misses: number;

  /** Keys con este tag */
  keys: number;
}

/**
 * Resultado de operación de cache
 */
export interface ICacheResult<T> {
  /** Indica si se obtuvo del cache */
  fromCache: boolean;

  /** El valor */
  value: T | null;

  /** Tags asociados */
  tags?: string[];

  /** TTL restante en segundos */
  ttl?: number;
}

/**
 * Configuración de cache por tipo de dato
 */
export interface ICacheConfig {
  /** TTL por defecto en segundos */
  defaultTTL: number;

  /** TTL por tipo de dato */
  ttlByType: {
    users: number;
    sessions: number;
    roles: number;
    permissions: number;
    stats: number;
    lists: number;
    detail: number;
  };

  /** Prefijos por módulo */
  prefixes: {
    user: string;
    auth: string;
    product: string;
    stats: string;
  };
}
