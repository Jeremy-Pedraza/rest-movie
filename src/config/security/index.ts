// src/config/security/index.ts

/**
 * @fileoverview Barrel export para configuraciones de seguridad
 * @module config/security
 */

// === Configuraciones de seguridad ===
export { default as jwtConfig } from './jwt.config';
export { getCorsOptionsWithSecurity } from './cors.config';
export { helmetConfig } from './helmet.config';
export { default as throttlerConfig } from './throttler.config';

// === Sistema de whitelist multi-tenant ===
export { SecurityConfigModule } from './security-config.module';
export { SecurityConfigService } from './security-config.service';
export type { ISecurityValidationResult } from './security-config.service';

// === Configuración de whitelist (TypeScript) ===
export {
  SECURITY_WHITELIST,
  AllowedSchema,
  getAllSchemas,
  isValidSchema,
} from './security-whitelist.config';
export type { ISecurityConfig, ISecurityWhitelist } from './security-whitelist.config';
