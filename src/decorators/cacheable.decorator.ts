// src/decorators/cacheable.decorator.ts

/**
 * @fileoverview Decorador para marcar endpoints como cacheables
 * @module decorators
 *
 * ✅ ACTUALIZADO: Soporta estrategias de cache (public, per-tenant, per-user)
 *
 * @example
 * ```typescript
 * // Cache por 60 segundos, estrategia per-tenant (default)
 * @Cacheable()
 * @Get('stats')
 * getStats() {}
 *
 * // Cache por 5 minutos, per-tenant
 * @Cacheable(300)
 * @Get('report')
 * getReport() {}
 *
 * // Cache con opciones explícitas
 * @Cacheable({ ttl: 120, strategy: 'per-tenant' })
 * @Get('trends')
 * getTrends() {}
 *
 * // Cache por usuario específico
 * @Cacheable({ ttl: 60, strategy: 'per-user' })
 * @Get('my-dashboard')
 * getMyDashboard() {}
 *
 * // Cache público (endpoints sin auth)
 * @Cacheable({ ttl: 3600, strategy: 'public' })
 * @Get('public-stats')
 * getPublicStats() {}
 * ```
 */

import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import {
  CacheInterceptor,
  CacheOptions,
  CacheKeyStrategy,
  CACHE_TTL_KEY,
  CACHE_OPTIONS_KEY,
} from '@interceptors/cache.interceptor';

/**
 * Decorator para marcar un endpoint como cacheable
 *
 * @param ttlOrOptions - TTL en segundos (number) o objeto de opciones (CacheOptions)
 *
 * Estrategias disponibles:
 * - `public`: Cache compartido global (solo para endpoints @Public())
 * - `per-tenant`: Cache por schema/tenant (DEFAULT - recomendado para reportes)
 * - `per-user`: Cache individual por usuario (para datos personalizados)
 *
 * @example
 * // Forma simple (TTL en segundos)
 * @Cacheable(120)
 *
 * // Forma completa (con opciones)
 * @Cacheable({ ttl: 120, strategy: 'per-tenant' })
 */
export function Cacheable(ttlOrOptions?: number | CacheOptions) {
  // Normalizar: si es número, convertir a opciones
  const options: CacheOptions =
    typeof ttlOrOptions === 'number' ? { ttl: ttlOrOptions } : ttlOrOptions || {};

  // Aplicar defaults
  const finalOptions: CacheOptions = {
    ttl: 60,
    strategy: 'per-tenant',
    prefix: 'cache',
    ...options,
  };

  return applyDecorators(
    SetMetadata(CACHE_TTL_KEY, finalOptions.ttl),
    SetMetadata(CACHE_OPTIONS_KEY, finalOptions),
    UseInterceptors(CacheInterceptor),
  );
}

// Re-exportar tipos para uso externo
export type { CacheOptions, CacheKeyStrategy };
