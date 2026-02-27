// src/modules/cache/cache.service.ts

/**
 * @fileoverview Servicio de cache inteligente con tags e invalidación
 * @module modules/cache
 *
 * ⚠️ RESPONSABILIDADES:
 * - Cache de datos de negocio (no solo HTTP)
 * - Invalidación inteligente por tags
 * - Estadísticas de uso
 * - Cache warmup
 * - Serialización automática
 *
 * 🔧 USO EN SERVICES:
 * constructor(private readonly cacheService: CacheService) {}
 *
 * // Cache con callback
 * const user = await this.cacheService.remember(
 *   'user:123',
 *   async () => this.repository.findById('123'),
 *   { ttl: 3600, tags: ['users', 'user:123'] }
 * );
 *
 * // Invalidar por tag
 * await this.cacheService.invalidateTag('user:123');
 */

import { Injectable, Logger, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService, LogContext } from '@modules/logger';
import { RedisService } from '@shared/redis';
import { HandleErrorService } from '@shared/common';
import { CacheStatsDto } from './dto';
import { ICacheConfig, ICacheOptions, ICacheResult, ICacheStats } from './interfaces';

/**
 * Prefijo para keys de tags
 */
const TAG_PREFIX = 'cache:tag:';

/**
 * Prefijo para keys de stats
 */
const STATS_PREFIX = 'cache:stats:';

/**
 * Prefijo para índice inverso key->tags
 */
const KEY_TAGS_PREFIX = 'cache:keytags:';

/**
 * Key para estadísticas globales
 */
const GLOBAL_STATS_KEY = `${STATS_PREFIX}global`;

/**
 * TTL por defecto (1 hora)
 */
const DEFAULT_TTL = 3600;

/**
 * TTL para claves de estadisticas por tag (24 horas)
 * Se renueva automaticamente con cada hit/miss activo
 * Tags inactivos expiran naturalmente
 */
const STATS_TAG_TTL = 86400;

/**
 * TTL para clave de estadisticas globales (7 dias)
 * Se renueva automaticamente con cada hit/miss
 */
const STATS_GLOBAL_TTL = 604800;

/**
 * Límite de concurrencia para operaciones batch
 */
const BATCH_CONCURRENCY = 10;

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);

  /** Single-flight: previene stampede en remember() concurrente */
  private readonly inflightCallbacks = new Map<string, Promise<any>>();

  /**
   * Configuración de TTL por tipo
   */
  private readonly config: ICacheConfig = {
    defaultTTL: DEFAULT_TTL,
    ttlByType: {
      users: 3600, // 1 hora
      sessions: 1800, // 30 minutos
      roles: 86400, // 24 horas
      permissions: 86400, // 24 horas
      stats: 300, // 5 minutos
      lists: 600, // 10 minutos
      detail: 1800, // 30 minutos
    },
    prefixes: {
      user: 'user:',
      auth: 'auth:',
      product: 'product:',
      stats: 'stats:',
    },
  };

  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
    private readonly handleError: HandleErrorService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  async onModuleInit() {
    this.logger.log('✅ CacheService initialized');
    await this.initializeStats();
  }

  // ============================================
  // CACHE PRINCIPAL: remember()
  // ============================================

  /**
   * Obtiene del cache o ejecuta el callback y cachea el resultado
   * @param key - Key del cache
   * @param callback - Función a ejecutar si no existe en cache
   * @param options - Opciones de cache
   * @returns Valor cacheado o resultado del callback
   *
   * @example
   * const user = await this.cacheService.remember(
   *   'user:123',
   *   async () => this.repository.findById('123'),
   *   { ttl: 3600, tags: ['users', 'user:123'] }
   * );
   */
  async remember<T>(
    key: string,
    callback: () => Promise<T>,
    options: ICacheOptions = {},
  ): Promise<T> {
    const { ttl = this.config.defaultTTL, tags = [], skipNull = false, refresh = false } = options;

    // Si refresh=true, forzar actualización
    if (!refresh) {
      // Intentar obtener del cache
      const cached = await this.get<T>(key);

      if (cached !== null) {
        // HIT
        await this.incrementHit(tags);
        this.logger.debug(`Cache HIT: ${key}`);
        return cached;
      }
    }

    // MISS - Single-flight: si ya hay un callback en vuelo para esta key, esperar
    const inflight = this.inflightCallbacks.get(key);
    if (inflight) {
      this.logger.debug(`Cache COALESCE: ${key}`);
      return inflight as Promise<T>;
    }

    await this.incrementMiss(tags);
    this.logger.debug(`Cache MISS: ${key}`);

    // Ejecutar callback con single-flight
    const promise = callback()
      .then(async (value) => {
        // No cachear null/undefined si skipNull=true
        if (skipNull && (value === null || value === undefined)) {
          return value;
        }

        // TTL jitter: +/- 10% para evitar expiración sincronizada
        const jitter = Math.floor(ttl * 0.1 * (Math.random() * 2 - 1));
        const finalTtl = Math.max(1, ttl + jitter);

        await this.set(key, value, finalTtl, tags);
        return value;
      })
      .finally(() => {
        this.inflightCallbacks.delete(key);
      });

    this.inflightCallbacks.set(key, promise);
    return promise;
  }

  // ============================================
  // OPERACIONES BÁSICAS
  // ============================================

  /**
   * Guardar en cache
   */
  async set<T>(key: string, value: T, ttl?: number, tags: string[] = []): Promise<void> {
    try {
      // Serializar valor
      const serialized = JSON.stringify(value);

      // Guardar con TTL
      const finalTtl = ttl || this.config.defaultTTL;
      await this.redis.set(key, serialized, { ttl: finalTtl });

      // Asociar tags
      if (tags.length > 0) {
        await this.associateTags(key, tags, finalTtl);
      }

      this.logger.debug(`Cache SET: ${key} (TTL: ${finalTtl}s, Tags: ${tags.join(', ')})`);
    } catch (error) {
      this.logError(`Error setting cache: ${key}`, error);
      throw error;
    }
  }

  /**
   * Obtener del cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      // Deserializar
      return JSON.parse(value) as T;
    } catch (error) {
      this.logError(`Error getting cache: ${key}`, error);
      return null;
    }
  }

  /**
   * Verificar si existe
   */
  async has(key: string): Promise<boolean> {
    return await this.redis.exists(key);
  }

  /**
   * Obtener con metadata
   */
  async getWithMetadata<T>(key: string): Promise<ICacheResult<T>> {
    const value = await this.get<T>(key);
    const exists = value !== null;
    const ttl = exists ? await this.redis.ttl(key) : undefined;
    const tags = exists ? await this.getKeyTags(key) : undefined;

    return {
      fromCache: exists,
      value,
      tags,
      ttl,
    };
  }

  // ============================================
  // INVALIDACIÓN
  // ============================================

  /**
   * Eliminar key específica (con limpieza de tags)
   */
  async forget(key: string): Promise<void> {
    await this.cleanupKeyFromAllTags(key);
    await this.redis.del(key);
    this.logger.debug(`Cache FORGET: ${key}`);
  }

  /**
   * Invalidar todas las keys con un tag (limpieza bidireccional)
   */
  async invalidateTag(tag: string): Promise<number> {
    const tagKey = `${TAG_PREFIX}${tag}`;
    const keys = await this.redis.sMembers(tagKey);

    if (keys.length === 0) {
      return 0;
    }

    // Para cada key: limpiar membresía en otros tags + eliminar índice inverso + la key misma
    await this.processInChunks(
      keys,
      async (key) => {
        await this.cleanupKeyFromAllTags(key, tag);
        await this.redis.del(key);
      },
      BATCH_CONCURRENCY,
    );

    // Eliminar el tag set
    await this.redis.del(tagKey);

    this.logger.log(`Cache INVALIDATE TAG: ${tag} (${keys.length} keys)`);
    return keys.length;
  }

  /**
   * Invalidar múltiples tags
   */
  async invalidateTags(tags: string[]): Promise<number> {
    let total = 0;
    for (const tag of tags) {
      const count = await this.invalidateTag(tag);
      total += count;
    }
    return total;
  }

  /**
   * Invalidar por patrón (usa SCAN incremental)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let totalDeleted = 0;
    let cursor = '0';

    do {
      const page = await this.redis.scanPage(cursor, { pattern, count: 100 });
      cursor = page.nextCursor;

      if (page.keys.length > 0) {
        await this.redis.del(...page.keys);
        totalDeleted += page.keys.length;
      }
    } while (cursor !== '0');

    if (totalDeleted > 0) {
      this.logger.log(`Cache INVALIDATE PATTERN: ${pattern} (${totalDeleted} keys)`);
    }
    return totalDeleted;
  }

  /**
   * Limpiar todo el cache (protegido por feature flag en producción)
   */
  async flush(): Promise<void> {
    const isProduction = this.configService.get<string>('app.nodeEnv') === 'production';
    const flushEnabled = this.configService.get<boolean>('redis.flushEnabled');

    if (isProduction && !flushEnabled) {
      this.logWarn('Cache FLUSH bloqueado: CACHE_FLUSH_ENABLED no está habilitado en producción');
      this.handleError.forbidden('Flush de cache no permitido en este ambiente');
    }

    this.logWarn(
      `Cache FLUSH ejecutado en ambiente: ${this.configService.get<string>('app.nodeEnv')}`,
    );
    await this.redis.flushDb();
    await this.initializeStats();
    this.logWarn('Cache FLUSH: All keys deleted');
  }

  /**
   * Limpiar cache de un módulo específico (con validación runtime)
   */
  async flushModule(module: keyof ICacheConfig['prefixes']): Promise<number> {
    const prefix = this.config.prefixes[module];
    if (!prefix) {
      throw new Error(`Módulo de cache inválido: ${module}`);
    }
    return await this.invalidatePattern(`${prefix}*`);
  }

  // ============================================
  // TAGS MANAGEMENT
  // ============================================

  /**
   * Asociar tags a una key (mantiene índice directo e inverso)
   */
  private async associateTags(key: string, tags: string[], ttl: number): Promise<void> {
    const inverseKey = `${KEY_TAGS_PREFIX}${key}`;

    for (const tag of tags) {
      // Índice directo: tag -> keys
      const tagKey = `${TAG_PREFIX}${tag}`;
      await this.redis.sAdd(tagKey, key);
      await this.redis.expire(tagKey, ttl + 300);

      // Índice inverso: key -> tags
      await this.redis.sAdd(inverseKey, tag);
    }
    // El índice inverso expira junto con la key
    await this.redis.expire(inverseKey, ttl + 300);
  }

  /**
   * Obtener tags de una key (usa índice inverso si existe, fallback a SCAN)
   */
  private async getKeyTags(key: string): Promise<string[]> {
    // Primero intentar índice inverso
    const inverseKey = `${KEY_TAGS_PREFIX}${key}`;
    const inverseTags = await this.redis.sMembers(inverseKey);
    if (inverseTags.length > 0) {
      return inverseTags;
    }

    // Fallback: escanear tags (costoso, solo para keys legacy sin índice inverso)
    const tags: string[] = [];
    let cursor = '0';

    do {
      const page = await this.redis.scanPage(cursor, { pattern: `${TAG_PREFIX}*`, count: 100 });
      cursor = page.nextCursor;

      for (const tagKey of page.keys) {
        const isMember = await this.redis.sIsMember(tagKey, key);
        if (isMember) {
          tags.push(tagKey.replace(TAG_PREFIX, ''));
        }
      }
    } while (cursor !== '0');

    return tags;
  }

  /**
   * Limpia la membresía de una key en todos sus tags asociados + elimina índice inverso
   * @param key - La key de cache a limpiar
   * @param excludeTag - Tag que ya se está eliminando (evitar trabajo doble)
   */
  private async cleanupKeyFromAllTags(key: string, excludeTag?: string): Promise<void> {
    const inverseKey = `${KEY_TAGS_PREFIX}${key}`;
    const tags = await this.redis.sMembers(inverseKey);

    for (const tag of tags) {
      if (tag === excludeTag) continue;
      const tagKey = `${TAG_PREFIX}${tag}`;
      await this.redis.sRem(tagKey, key);
    }

    // Eliminar índice inverso
    await this.redis.del(inverseKey);
  }

  /**
   * Listar todas las keys de un tag
   */
  async getTagKeys(tag: string): Promise<string[]> {
    const tagKey = `${TAG_PREFIX}${tag}`;
    return await this.redis.sMembers(tagKey);
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Inicializar estadísticas (hash atómico)
   */
  private async initializeStats(): Promise<void> {
    const exists = await this.redis.exists(GLOBAL_STATS_KEY);
    if (!exists) {
      await this.redis.hMSet(GLOBAL_STATS_KEY, {
        hits: 0,
        misses: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
    // Siempre refrescar TTL al inicializar (previene acumulacion sin expiracion)
    await this.redis.expire(GLOBAL_STATS_KEY, STATS_GLOBAL_TTL);
  }

  /**
   * Incrementar hit (atómico con HINCRBY)
   */
  private async incrementHit(tags: string[]): Promise<void> {
    await this.incrementStat('hits', tags);
  }

  /**
   * Incrementar miss (atómico con HINCRBY)
   */
  private async incrementMiss(tags: string[]): Promise<void> {
    await this.incrementStat('misses', tags);
  }

  /**
   * Incrementar estadística de forma atómica
   */
  private async incrementStat(stat: 'hits' | 'misses', tags: string[]): Promise<void> {
    try {
      // Incremento atómico global
      await this.redis.hIncr(GLOBAL_STATS_KEY, stat, 1);
      await this.redis.hSet(GLOBAL_STATS_KEY, 'lastUpdated', new Date().toISOString());
      await this.redis.expire(GLOBAL_STATS_KEY, STATS_GLOBAL_TTL); // Refrescar TTL (7 dias)

      // Incremento atómico por tag (con TTL para evitar acumulacion de tags inactivos)
      for (const tag of tags) {
        const tagStatsKey = `${STATS_PREFIX}tag:${tag}`;
        await this.redis.hIncr(tagStatsKey, stat, 1);
        await this.redis.expire(tagStatsKey, STATS_TAG_TTL); // Refrescar TTL (24h)
      }
    } catch (error) {
      this.logError('Error updating stats', error);
    }
  }

  /**
   * Obtener estadísticas (ratios calculados en lectura)
   */
  async getStats(): Promise<CacheStatsDto> {
    const raw = await this.redis.hGetAll(GLOBAL_STATS_KEY);
    const hits = parseInt(raw.hits || '0', 10);
    const misses = parseInt(raw.misses || '0', 10);
    const total = hits + misses;
    const hitRatio = total > 0 ? hits / total : 0;

    // Contar keys actuales via SCAN (excluir internas)
    let totalKeys = 0;
    let scanCursor = '0';
    do {
      const page = await this.redis.scanPage(scanCursor, { pattern: '*', count: 200 });
      scanCursor = page.nextCursor;
      totalKeys += page.keys.filter(
        (k) =>
          !k.startsWith(STATS_PREFIX) &&
          !k.startsWith(TAG_PREFIX) &&
          !k.startsWith(KEY_TAGS_PREFIX),
      ).length;
    } while (scanCursor !== '0');

    // Recopilar stats por tag desde hashes individuales
    const byTag: Record<string, any> = {};
    let tagCursor = '0';
    do {
      const page = await this.redis.scanPage(tagCursor, {
        pattern: `${STATS_PREFIX}tag:*`,
        count: 100,
      });
      tagCursor = page.nextCursor;

      for (const tagStatsKey of page.keys) {
        const tag = tagStatsKey.replace(`${STATS_PREFIX}tag:`, '');
        const tagRaw = await this.redis.hGetAll(tagStatsKey);
        const tagHits = parseInt(tagRaw.hits || '0', 10);
        const tagMisses = parseInt(tagRaw.misses || '0', 10);
        const tagTotal = tagHits + tagMisses;
        const tagKeys = await this.getTagKeys(tag);

        byTag[tag] = {
          hits: tagHits,
          misses: tagMisses,
          keys: tagKeys.length,
          hitRatio: tagTotal > 0 ? tagHits / tagTotal : 0,
        };
      }
    } while (tagCursor !== '0');

    const stats: any = {
      hits,
      misses,
      hitRatio,
      totalKeys,
      lastUpdated: raw.lastUpdated ? new Date(raw.lastUpdated) : new Date(),
    };

    if (Object.keys(byTag).length > 0) {
      stats.byTag = byTag;
    }

    // Intentar obtener uso de memoria (opcional)
    try {
      const info = await this.redis.info('memory');
      const match = info.match(/used_memory_human:(.+)/);
      if (match) {
        stats.memoryUsage = match[1].trim();
      }
    } catch {
      // Ignorar si no está disponible
    }

    return stats as CacheStatsDto;
  }

  /**
   * Resetear estadísticas (overwrite real, no condicional)
   */
  async resetStats(): Promise<void> {
    // Eliminar stats globales y recrear con TTL
    await this.redis.del(GLOBAL_STATS_KEY);
    await this.redis.hMSet(GLOBAL_STATS_KEY, {
      hits: 0,
      misses: 0,
      lastUpdated: new Date().toISOString(),
    });
    await this.redis.expire(GLOBAL_STATS_KEY, STATS_GLOBAL_TTL);

    // Eliminar stats por tag
    let cursor = '0';
    do {
      const page = await this.redis.scanPage(cursor, {
        pattern: `${STATS_PREFIX}tag:*`,
        count: 100,
      });
      cursor = page.nextCursor;
      if (page.keys.length > 0) {
        await this.redis.del(...page.keys);
      }
    } while (cursor !== '0');

    this.logger.log('Cache stats reset');
  }

  // ============================================
  // CACHE WARMUP
  // ============================================

  /**
   * Precalentar cache con datos críticos
   */
  async warmup<T>(
    key: string,
    callback: () => Promise<T>,
    options: ICacheOptions = {},
  ): Promise<void> {
    this.logger.log(`Cache WARMUP: ${key}`);
    await this.set(key, await callback(), options.ttl, options.tags);
  }

  /**
   * Warmup masivo de múltiples keys (con concurrencia limitada)
   */
  async warmupBatch(
    items: Array<{ key: string; callback: () => Promise<any>; options?: ICacheOptions }>,
  ): Promise<void> {
    this.logger.log(`Cache WARMUP BATCH: ${items.length} items`);

    await this.processInChunks(
      items,
      (item) => this.warmup(item.key, item.callback, item.options || {}),
      BATCH_CONCURRENCY,
    );
  }

  // ============================================
  // HELPERS ÚTILES
  // ============================================

  /**
   * Obtener TTL configurado por tipo
   */
  getTTL(type: keyof ICacheConfig['ttlByType']): number {
    return this.config.ttlByType[type] || this.config.defaultTTL;
  }

  /**
   * Generar key con prefijo
   */
  makeKey(module: keyof ICacheConfig['prefixes'], ...parts: string[]): string {
    return `${this.config.prefixes[module]}${parts.join(':')}`;
  }

  /**
   * Contar keys por patrón (usa SCAN incremental)
   */
  async countKeys(pattern: string = '*'): Promise<number> {
    let count = 0;
    let cursor = '0';

    do {
      const page = await this.redis.scanPage(cursor, { pattern, count: 200 });
      cursor = page.nextCursor;
      count += page.keys.length;
    } while (cursor !== '0');

    return count;
  }

  /**
   * Listar keys con paginación por cursor
   */
  async listKeys(pattern: string = '*', limit: number = 100): Promise<string[]> {
    return this.redis.scan({ pattern, maxResults: limit });
  }

  /**
   * Listar keys con paginación por cursor (para endpoints)
   */
  async listKeysPaginated(
    pattern: string = '*',
    cursor: string = '0',
    count: number = 100,
  ): Promise<{ keys: string[]; nextCursor: string; hasMore: boolean }> {
    return this.redis.scanPage(cursor, { pattern, count });
  }

  /**
   * Información del cache
   */
  async info(): Promise<Record<string, any>> {
    const stats = await this.getStats();
    const totalKeys = await this.countKeys();
    const tagKeys = await this.countKeys(`${TAG_PREFIX}*`);

    return {
      stats,
      totalKeys,
      tagKeys,
      config: {
        defaultTTL: this.config.defaultTTL,
        ttlByType: this.config.ttlByType,
      },
    };
  }

  // ============================================
  // UTILIDADES INTERNAS
  // ============================================

  /**
   * Procesa items en chunks con concurrencia limitada
   */
  private async processInChunks<T>(
    items: T[],
    fn: (item: T) => Promise<any>,
    concurrency: number,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      await Promise.all(chunk.map(fn));
    }
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.SYSTEM,
      service: CacheService.name,
    });
  }

  private logError(message: string, details?: unknown): void {
    const stack = details instanceof Error ? details.stack : undefined;
    this.logger.error(message, stack);
    void this.loggerService?.error(message, {
      context: LogContext.SYSTEM,
      service: CacheService.name,
      stack,
    });
  }
}
