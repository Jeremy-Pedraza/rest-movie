// src/interceptors/cache.interceptor.ts

/**
 * @fileoverview Interceptor para cache de responses
 * @module interceptors
 *
 * NO es global - usar selectivamente con @UseInterceptors(CacheInterceptor)
 * o con el decorador @Cacheable()
 *
 * @example
 * ```typescript
 * // Uso básico (TTL default: 60s)
 * @UseInterceptors(CacheInterceptor)
 * @Get('stats')
 * getStats() {}
 *
 * // Con decorador (TTL personalizado)
 * @Cacheable(300) // 5 minutos
 * @Get('report')
 * getReport() {}
 * ```
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request } from 'express';

/** Key para metadata de cache TTL */
export const CACHE_TTL_KEY = 'cache:ttl';

/** TTL por defecto en segundos */
const DEFAULT_TTL = 60;

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();

    // Solo cachear requests GET
    if (request.method !== 'GET') {
      return next.handle();
    }

    // No cachear si el usuario está autenticado (respuestas personalizadas)
    // Comentar esta línea si quieres cachear también respuestas autenticadas
    if (request.user) {
      return next.handle();
    }

    // Obtener TTL del decorador o usar default
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || DEFAULT_TTL;

    // Generar key de cache
    const cacheKey = this.generateCacheKey(request);

    try {
      // Intentar obtener del cache
      const cachedResponse = await this.cacheManager.get(cacheKey);

      if (cachedResponse) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return of(cachedResponse);
      }

      this.logger.debug(`Cache MISS: ${cacheKey}`);

      // Si no está en cache, ejecutar y guardar
      return next.handle().pipe(
        tap((response) => {
          // Guardar en cache (TTL en milisegundos)
          void this.cacheManager.set(cacheKey, response, ttl * 1000);
          this.logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl}s)`);
        }),
      );
    } catch (error) {
      // Si hay error en cache, continuar sin cache
      this.logger.warn(`Cache error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return next.handle();
    }
  }

  /**
   * Genera una key única para el cache basada en la URL
   */
  private generateCacheKey(request: Request): string {
    const { originalUrl } = request;
    // Normalizar URL (remover trailing slash, ordenar query params)
    const normalizedUrl = originalUrl.replace(/\/$/, '');
    return `http:cache:${normalizedUrl}`;
  }
}
