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

export default registerAs('jwt', () => ({
  // ============================================
  // ACCESS TOKEN (Autenticación)
  // ============================================
  secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m', // 15 minutos
  issuer: process.env.JWT_ISSUER || 'mokka-api',
  audience: process.env.JWT_AUDIENCE || 'mokka-client',

  // ============================================
  // REFRESH TOKEN (Renovación de sesión)
  // ============================================
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // 7 días
  refreshLongExpiresIn: process.env.JWT_REFRESH_LONG_EXPIRES_IN || '30d', // 30 días ("remember me")

  // ============================================
  // RESET TOKEN (Recuperación de contraseña)
  // ============================================
  resetSecret: process.env.JWT_RESET_SECRET || 'default_reset_secret_change_in_production',
  resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '1h', // 1 hora
}));
