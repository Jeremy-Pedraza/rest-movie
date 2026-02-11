// src/config/security/jwt.config.ts

/**
 * @fileoverview Configuración JWT
 * @module config/security
 *
 * Configuración de JSON Web Tokens para autenticación:
 * - Access Token: Token de corta duración para autenticación (15 min)
 * - Refresh Token: Token de larga duración para renovar access tokens (7 días)
 * - Reset Token: Token de reset de contraseña (1 hora)
 */

import { registerAs } from '@nestjs/config';

/**
 * Convierte strings de tiempo (15m, 7d, 1h) a segundos
 */
function parseTimeToSeconds(timeStr: string): number {
  const regex = /^(\d+)([smhd])$/;
  const match = timeStr.match(regex);

  if (!match) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] as 's' | 'm' | 'h' | 'd'; // ✅ FIX: Type assertion

  const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
    // ✅ FIX: Tipo explícito
    s: 1, // segundos
    m: 60, // minutos
    h: 3600, // horas
    d: 86400, // días
  };

  return value * multipliers[unit];
}

export default registerAs('jwt', () => {
  // ============================================
  // VALIDACIÓN OBLIGATORIA DE SECRETS
  // ============================================
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const resetSecret = process.env.JWT_RESET_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required. Set it as an environment variable.');
  }
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is required. Set it as an environment variable.');
  }
  if (!resetSecret) {
    throw new Error('JWT_RESET_SECRET is required. Set it as an environment variable.');
  }

  return {
    // ============================================
    // ACCESS TOKEN (Autenticación)
    // ============================================
    secret,
    expiresIn: parseTimeToSeconds(process.env.JWT_EXPIRES_IN || '15m'),
    expiresInString: process.env.JWT_EXPIRES_IN || '15m',
    issuer: process.env.JWT_ISSUER || 'Rest-api',
    audience: process.env.JWT_AUDIENCE || 'Rest-client',

    // ============================================
    // REFRESH TOKEN (Renovación de sesión)
    // ============================================
    refreshSecret,
    refreshExpiresIn: parseTimeToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
    refreshExpiresInString: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshLongExpiresIn: parseTimeToSeconds(process.env.JWT_REFRESH_LONG_EXPIRES_IN || '30d'),

    // ============================================
    // RESET TOKEN (Recuperación de contraseña)
    // ============================================
    resetSecret,
    resetExpiresIn: parseTimeToSeconds(process.env.JWT_RESET_EXPIRES_IN || '1h'),
    resetExpiresInString: process.env.JWT_RESET_EXPIRES_IN || '1h',
  };
});
