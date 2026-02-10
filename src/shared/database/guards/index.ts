// src/shared/database/guards/index.ts

/**
 * @fileoverview Re-export de guards de tenant
 * @module shared/database/guards
 *
 * Los guards de tenant están en src/guards/ (globales)
 * Este archivo re-exporta para acceso conveniente
 */

export { TenantGuard, SKIP_TENANT_KEY } from '@guards/tenant.guard';
