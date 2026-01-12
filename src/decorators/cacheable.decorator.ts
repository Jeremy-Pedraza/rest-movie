// src/decorators/cacheable.decorator.ts

/**
 * @fileoverview Decorador para marcar endpoints como cacheables
 * @module decorators
 *
 * @example
 * ```typescript
 * // Cache por 60 segundos (default)
 * @Cacheable()
 * @Get('stats')
 * getStats() {}
 *
 * // Cache por 5 minutos
 * @Cacheable(300)
 * @Get('report')
 * getReport() {}
 *
 * // Cache por 1 hora
 * @Cacheable(3600)
 * @Get('dashboard')
 * getDashboard() {}
 * ```
 */

import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CACHE_TTL_KEY } from '@interceptors/cache.interceptor';

/**
 * Decorator para marcar un endpoint como cacheable
 * @param ttlSeconds - Tiempo de vida del cache en segundos (default: 60)
 */
export const Cacheable = (ttlSeconds: number = 60) => {
  return applyDecorators(SetMetadata(CACHE_TTL_KEY, ttlSeconds), UseInterceptors(CacheInterceptor));
};
