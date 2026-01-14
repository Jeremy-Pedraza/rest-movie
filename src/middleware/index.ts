// src/middleware/index.ts

/**
 * @fileoverview Barrel export para middlewares globales
 * @module middleware
 */

export * from './request-id.middleware';
export * from './logger.middleware';
export * from './raw-body.middleware';
export * from './domain-validation.middleware';

// Note: cors.middleware.ts fue removido
// CORS ahora se maneja con app.enableCors() en main.ts
// usando getCorsOptionsWithSecurity() de @config/security
