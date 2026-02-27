// src/constants/auth.constant.ts

/**
 * @fileoverview Constantes de autenticación y sesiones
 * @module constants
 *
 * Single source of truth para TTLs, prefijos Redis y límites de sesión
 * usados en AuthService, JwtStrategy y SessionCleanupJob.
 */

/** TTL del cache de usuario autenticado y sesión JWT: 55 minutos (3300s) */
export const AUTH_CACHE_TTL = 3300;

/** Prefijo para cache de usuario autenticado */
export const AUTH_CACHE_PREFIX = 'auth';

/** Prefijo para cache de sesión JWT (usado en JwtStrategy) */
export const SESSION_CACHE_PREFIX = 'session';

/** Prefijo para timestamp de revocación por usuario */
export const REVOKED_AT_PREFIX = 'auth:revoked_at';

/** Máximo de sesiones activas por usuario (default) */
export const DEFAULT_MAX_ACTIVE_SESSIONS = 5;
