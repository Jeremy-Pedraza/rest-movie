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

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '@shared/redis';
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
 * Key para estadísticas globales
 */
const GLOBAL_STATS_KEY = `${STATS_PREFIX}global`;

/**
 * TTL por defecto (1 hora)
 */
const DEFAULT_TTL = 3600;

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);

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

  constructor(private readonly redis: RedisService) {}

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

    // MISS - Ejecutar callback
    await this.incrementMiss(tags);
    this.logger.debug(`Cache MISS: ${key}`);

    const value = await callback();

    // No cachear null/undefined si skipNull=true
    if (skipNull && (value === null || value === undefined)) {
      return value;
    }

    // Guardar en cache
    await this.set(key, value, ttl, tags);

    return value;
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
      this.logger.error(`Error setting cache: ${key}`, error);
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
      this.logger.error(`Error getting cache: ${key}`, error);
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
   * Eliminar key específica
   */
  async forget(key: string): Promise<void> {
    await this.redis.del(key);
    this.logger.debug(`Cache FORGET: ${key}`);
  }

  /**
   * Invalidar todas las keys con un tag
   */
  async invalidateTag(tag: string): Promise<number> {
    const tagKey = `${TAG_PREFIX}${tag}`;
    const keys = await this.redis.sMembers(tagKey);

    if (keys.length === 0) {
      return 0;
    }

    // Eliminar todas las keys
    await Promise.all(keys.map((key: string) => this.redis.del(key)));

    // Eliminar el tag
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
   * Invalidar por patrón
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await Promise.all(keys.map((key) => this.redis.del(key)));

    this.logger.log(`Cache INVALIDATE PATTERN: ${pattern} (${keys.length} keys)`);
    return keys.length;
  }

  /**
   * Limpiar todo el cache
   */
  async flush(): Promise<void> {
    await this.redis.flushDb();
    await this.initializeStats();
    this.logger.warn('Cache FLUSH: All keys deleted');
  }

  /**
   * Limpiar cache de un módulo específico
   */
  async flushModule(module: keyof ICacheConfig['prefixes']): Promise<number> {
    const prefix = this.config.prefixes[module];
    return await this.invalidatePattern(`${prefix}*`);
  }

  // ============================================
  // TAGS MANAGEMENT
  // ============================================

  /**
   * Asociar tags a una key
   */
  private async associateTags(key: string, tags: string[], ttl: number): Promise<void> {
    for (const tag of tags) {
      const tagKey = `${TAG_PREFIX}${tag}`;
      await this.redis.sAdd(tagKey, key);
      // El tag expira un poco después que la key
      await this.redis.expire(tagKey, ttl + 300);
    }
  }

  /**
   * Obtener tags de una key
   */
  private async getKeyTags(key: string): Promise<string[]> {
    // Buscar en todos los tags (esto es costoso, solo para debug)
    const tagKeys = await this.redis.keys(`${TAG_PREFIX}*`);
    const tags: string[] = [];

    for (const tagKey of tagKeys) {
      const isMember = await this.redis.sIsMember(tagKey, key);
      if (isMember) {
        tags.push(tagKey.replace(TAG_PREFIX, ''));
      }
    }

    return tags;
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
   * Inicializar estadísticas
   */
  private async initializeStats(): Promise<void> {
    const exists = await this.redis.exists(GLOBAL_STATS_KEY);
    if (!exists) {
      const initialStats: ICacheStats = {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        totalKeys: 0,
        byTag: {},
        lastUpdated: new Date(),
      };
      await this.redis.set(GLOBAL_STATS_KEY, JSON.stringify(initialStats));
    }
  }

  /**
   * Incrementar hit
   */
  private async incrementHit(tags: string[]): Promise<void> {
    await this.incrementStat('hits', tags);
  }

  /**
   * Incrementar miss
   */
  private async incrementMiss(tags: string[]): Promise<void> {
    await this.incrementStat('misses', tags);
  }

  /**
   * Incrementar estadística
   */
  private async incrementStat(stat: 'hits' | 'misses', tags: string[]): Promise<void> {
    try {
      const statsStr = await this.redis.get(GLOBAL_STATS_KEY);
      if (!statsStr) return;

      const stats: ICacheStats = JSON.parse(statsStr);
      stats[stat]++;

      // Actualizar ratio
      const total = stats.hits + stats.misses;
      stats.hitRatio = total > 0 ? stats.hits / total : 0;
      stats.lastUpdated = new Date();

      // Actualizar stats por tag
      for (const tag of tags) {
        if (!stats.byTag) stats.byTag = {};
        if (!stats.byTag[tag]) {
          stats.byTag[tag] = { hits: 0, misses: 0, keys: 0 };
        }
        stats.byTag[tag][stat]++;
      }

      await this.redis.set(GLOBAL_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      this.logger.error('Error updating stats', error);
    }
  }

  /**
   * Obtener estadísticas
   */
  async getStats(): Promise<CacheStatsDto> {
    const statsStr = await this.redis.get(GLOBAL_STATS_KEY);
    if (!statsStr) {
      return {
        hits: 0,
        misses: 0,
        hitRatio: 0,
        totalKeys: 0,
        lastUpdated: new Date(),
      };
    }

    const stats: ICacheStats = JSON.parse(statsStr);

    // Contar keys actuales
    const allKeys = await this.redis.keys('*');
    stats.totalKeys = allKeys.filter(
      (k) => !k.startsWith(STATS_PREFIX) && !k.startsWith(TAG_PREFIX),
    ).length;

    // Contar keys por tag
    if (stats.byTag) {
      for (const tag of Object.keys(stats.byTag)) {
        const tagKeys = await this.getTagKeys(tag);
        stats.byTag[tag].keys = tagKeys.length;

        // Calcular hit ratio del tag
        const tagTotal = stats.byTag[tag].hits + stats.byTag[tag].misses;
        (stats.byTag[tag] as any).hitRatio = tagTotal > 0 ? stats.byTag[tag].hits / tagTotal : 0;
      }
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
   * Resetear estadísticas
   */
  async resetStats(): Promise<void> {
    await this.initializeStats();
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
   * Warmup masivo de múltiples keys
   */
  async warmupBatch(
    items: Array<{ key: string; callback: () => Promise<any>; options?: ICacheOptions }>,
  ): Promise<void> {
    this.logger.log(`Cache WARMUP BATCH: ${items.length} items`);

    await Promise.all(
      items.map((item) => this.warmup(item.key, item.callback, item.options || {})),
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
   * Contar keys por patrón
   */
  async countKeys(pattern: string = '*'): Promise<number> {
    const keys = await this.redis.keys(pattern);
    return keys.length;
  }

  /**
   * Listar todas las keys (cuidado en producción)
   */
  async listKeys(pattern: string = '*', limit: number = 100): Promise<string[]> {
    const keys = await this.redis.keys(pattern);
    return keys.slice(0, limit);
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
}
