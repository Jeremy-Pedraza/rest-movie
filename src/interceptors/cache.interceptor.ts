// src/interceptors/cache.interceptor.ts

/**
 * @fileoverview Interceptor para cache de responses usando RedisService
 * @module interceptors
 *
 * ✅ ACTUALIZADO: Usa RedisService en lugar de CACHE_MANAGER
 * ✅ Soporta cache por tenant (schema)
 * ✅ Configurable por endpoint con @Cacheable()
 *
 * NO es global - usar selectivamente con @Cacheable()
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

import { RedisService } from '@shared/redis';

// ============================================
// CONSTANTS & TYPES
// ============================================

/** Key para metadata de cache TTL */
export const CACHE_TTL_KEY = 'cache:ttl';

/** Key para metadata de opciones de cache */
export const CACHE_OPTIONS_KEY = 'cache:options';

/** TTL por defecto en segundos */
const DEFAULT_TTL = 60;

/** Prefijo base para cache HTTP */
const HTTP_CACHE_PREFIX = 'cache';

/** Estrategia de generación de cache key */
export type CacheKeyStrategy =
  | 'public' // Solo URL (endpoints sin auth)
  | 'per-tenant' // URL + schema (todos del tenant comparten) - DEFAULT
  | 'per-user'; // URL + schema + userId (cada usuario su cache)

/** Opciones de configuración del cache */
export interface CacheOptions {
  /** TTL en segundos (default: 60) */
  ttl?: number;
  /** Estrategia de cache key (default: per-tenant) */
  strategy?: CacheKeyStrategy;
  /** Prefijo personalizado para la key (default: 'cache') */
  prefix?: string;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Intercepta el request y aplica cache según configuración
   *
   * Flujo:
   * 1. Solo cachear GET requests
   * 2. Obtener opciones del decorador @Cacheable()
   * 3. Validar si debe cachear según estrategia
   * 4. Verificar cache (HIT/MISS)
   * 5. Si MISS, ejecutar handler y guardar en cache
   */
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Solo cachear requests GET
    if (request.method !== 'GET') {
      return next.handle();
    }

    // 2. Obtener opciones del decorador
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || DEFAULT_TTL;
    const decoratorOptions =
      this.reflector.get<CacheOptions>(CACHE_OPTIONS_KEY, context.getHandler()) || {};

    // Merge opciones con defaults
    const options: CacheOptions = {
      strategy: 'per-tenant',
      prefix: HTTP_CACHE_PREFIX,
      ...decoratorOptions,
      ttl: decoratorOptions.ttl || ttl,
    };

    // 3. Validar si debe cachear según estrategia
    const user = request.user;

    // Estrategia 'public' solo funciona sin usuario autenticado
    if (options.strategy === 'public' && user) {
      this.logger.debug('Skipping cache: public strategy with authenticated user');
      return next.handle();
    }

    // Estrategias 'per-tenant' y 'per-user' requieren usuario autenticado
    if (options.strategy !== 'public' && !user) {
      this.logger.debug('Skipping cache: tenant/user strategy without authentication');
      return next.handle();
    }

    // 4. Generar cache key
    const cacheKey = this.generateCacheKey(request, options);

    try {
      // 5. Intentar obtener del cache
      const cachedResponse = await this.redisService.getJson<unknown>(cacheKey);

      if (cachedResponse !== null) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return of(cachedResponse);
      }

      this.logger.debug(`Cache MISS: ${cacheKey}`);

      // 6. Si no está en cache, ejecutar handler y guardar
      return next.handle().pipe(
        tap((response) => {
          // Guardar en cache (fire and forget - no bloquea respuesta)
          void this.redisService
            .setJson(cacheKey, response, {
              ttl: options.ttl,
            })
            .then((saved) => {
              if (saved) {
                this.logger.debug(`Cache SET: ${cacheKey} (TTL: ${options.ttl}s)`);
              }
            });
        }),
      );
    } catch (error) {
      // Si hay error en Redis, continuar sin cache
      this.logger.warn(`Cache error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return next.handle();
    }
  }

  /**
   * Genera una key única para el cache basada en la estrategia
   *
   * Formato de keys (usando RedisService.buildKey):
   * - public:     cache:http:{normalizedUrl}
   * - per-tenant: cache:{schema}:http:{normalizedUrl}
   * - per-user:   cache:{schema}:user:{userId}:http:{normalizedUrl}
   *
   * @param request - Request HTTP
   * @param options - Opciones de cache
   * @returns Cache key formateada
   */
  private generateCacheKey(request: Request, options: CacheOptions): string {
    const { originalUrl } = request;
    // Normalizar URL: remover trailing slash y espacios
    const normalizedUrl = originalUrl.replace(/\/$/, '').trim();

    const prefix = options.prefix || HTTP_CACHE_PREFIX;
    const strategy = options.strategy || 'per-tenant';

    // Extraer datos del usuario autenticado (UserSessionDto)
    const user = request.user as { id?: string; schema?: string } | undefined;
    const schema = user?.schema || 'public';
    const userId = user?.id || 'anonymous';

    switch (strategy) {
      case 'public':
        // cache:http:/reports/public-stats
        return this.redisService.buildKey(prefix, 'http', normalizedUrl);

      case 'per-tenant':
        // cache:tenant_schema:http:/reports/trends?from=2025-01-01
        return this.redisService.buildKey(prefix, schema, 'http', normalizedUrl);

      case 'per-user':
        // cache:tenant_schema:user:abc123:http:/reports/my-data
        return this.redisService.buildKey(prefix, schema, 'user', userId, 'http', normalizedUrl);

      default:
        return this.redisService.buildKey(prefix, schema, 'http', normalizedUrl);
    }
  }
}
