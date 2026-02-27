// src/constants/cache.constant.ts

/**
 * @fileoverview Constantes de cache y prefijos Redis
 * @module constants
 *
 * Single source of truth para prefijos de Redis usados en
 * CacheService, RedisCleanupJob y CacheInterceptor.
 */

/** Prefijo para keys de tags de cache */
export const CACHE_TAG_PREFIX = 'cache:tag:';

/** Prefijo para keys de stats de cache */
export const CACHE_STATS_PREFIX = 'cache:stats:';

/** Prefijo para índice inverso key->tags */
export const CACHE_KEY_TAGS_PREFIX = 'cache:keytags:';

/** Prefijo base para cache HTTP */
export const HTTP_CACHE_PREFIX = 'cache';
