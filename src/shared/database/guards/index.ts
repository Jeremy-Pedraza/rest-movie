// src/shared/database/guards/index.ts

/**
 * @fileoverview Re-export de guards de tenant
 * @module shared/database/guards
 *
 * Guards disponibles:
 * - TenantGuard (global): Extrae y establece request.tenant
 * - CrossTenantGuard: Valida que el usuario no acceda a datos de otro tenant
 */

// Guard global de extracción de tenant
export { TenantGuard, SKIP_TENANT_KEY } from '@guards/tenant.guard';

// Guard de validación cross-tenant
export { CrossTenantGuard, SKIP_CROSS_TENANT_CHECK_KEY, SkipCrossTenantCheck } from '@guards/cross-tenant.guard';
