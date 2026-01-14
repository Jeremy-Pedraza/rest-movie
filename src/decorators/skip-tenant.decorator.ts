// src/decorators/skip-tenant.decorator.ts

/**
 * @fileoverview Decorador para skipear TenantGuard
 * @module decorators
 */

import { SetMetadata } from '@nestjs/common';
import { SKIP_TENANT_KEY } from '@guards/tenant.guard';

/**
 * Decorator para skipear TenantGuard en rutas específicas
 *
 * Usar este decorator en endpoints que NO requieren contexto de tenant:
 * - Health checks
 * - Login/Register (antes de autenticación)
 * - Endpoints públicos sin tenant
 * - Webhooks externos
 *
 * IMPORTANTE:
 * - Este decorator NO afecta a JwtAuthGuard (autenticación)
 * - Si necesitas skipear autenticación, usa @Public()
 * - Puedes combinar @Public() y @SkipTenant() si necesitas ambos
 *
 * @example
 * ```typescript
 * // Health check sin tenant
 * @SkipTenant()
 * @Get('health')
 * health() {
 *   return { status: 'ok' };
 * }
 *
 * // Login público sin tenant
 * @Public()
 * @SkipTenant()
 * @Post('auth/login')
 * login(@Body() dto: LoginDto) {
 *   return this.authService.login(dto);
 * }
 *
 * // Endpoint autenticado pero sin tenant
 * // (usuario puede no tener company asignada)
 * @SkipTenant()
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
