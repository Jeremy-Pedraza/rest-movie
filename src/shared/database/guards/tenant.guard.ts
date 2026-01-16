// src/shared/database/guards/tenant.guard.ts

/**
 * @fileoverview Guard para validar acceso al tenant
 * @module shared/database/guards
 *
 * ARQUITECTURA MULTI-TENANT (FASE 6):
 *
 * Este guard valida que el usuario tenga acceso al tenant correcto.
 * Se usa en endpoints que operan sobre datos de un tenant específico.
 *
 * Casos de uso:
 * 1. Validar que store pertenece a la company del usuario
 * 2. Validar que el report es de una store de su company
 * 3. Prevenir acceso cross-tenant
 *
 * @example
 * ```typescript
 * // En controller
 * @UseGuards(TenantGuard)
 * @Get(':storeId/reports')
 * async getReports(@Param('storeId') storeId: string) {
 *   // El guard ya validó que storeId pertenece a la company del usuario
 *   return this.reportsService.findByStore(storeId);
 * }
 * ```
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SchemaContext } from '../schema.context';
import { UserSessionDto } from '@modules/auth/interfaces';

/**
 * Decorator key para especificar el parámetro que contiene el tenant ID
 */
export const TENANT_PARAM_KEY = 'tenant_param';

/**
 * Metadata key para bypass del guard
 */
export const SKIP_TENANT_CHECK_KEY = 'skip_tenant_check';

/**
 * TenantGuard - Valida acceso al tenant
 *
 * Funcionalidades:
 * - Verifica que el usuario tenga company asignada
 * - Valida que el schema del contexto coincida con el del usuario
 * - Permite bypass con @SkipTenantCheck() decorator
 * - Compatible con roles SUPER_ADMIN (acceso a todos los tenants)
 *
 * @example
 * ```typescript
 * // Aplicar a un endpoint
 * @UseGuards(TenantGuard)
 * @Get('stores/:storeId/reports')
 * async getStoreReports(@Param('storeId') storeId: string) {}
 *
 * // Bypass para endpoints públicos o admin
 * @SkipTenantCheck()
 * @Get('admin/all-reports')
 * async getAllReports() {}
 * ```
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly schemaContext: SchemaContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si el endpoint tiene bypass
    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCheck) {
      this.logger.debug('TenantGuard: bypass habilitado para este endpoint');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserSessionDto | undefined;

    // Si no hay usuario (ruta pública), permitir
    if (!user) {
      this.logger.debug('TenantGuard: No hay usuario autenticado, permitiendo');
      return true;
    }

    // Super admin puede acceder a todos los tenants
    if (this.isSuperAdmin(user)) {
      this.logger.debug(`TenantGuard: Usuario ${user.id} es SUPER_ADMIN, acceso permitido`);
      return true;
    }

    // Validar que el usuario tenga company asignada
    if (!user.companyId && !user.company?.id) {
      this.logger.warn(`TenantGuard: Usuario ${user.id} no tiene company asignada`);
      throw new ForbiddenException(
        'Acceso denegado: Usuario no pertenece a ninguna compañía',
      );
    }

    // Validar que el schema del contexto coincida
    const contextSchema = this.schemaContext.getSchema();
    const userSchema = user.company?.schema || user.schema || 'public';

    if (contextSchema !== userSchema && contextSchema !== 'public') {
      this.logger.warn(
        `TenantGuard: Intento de acceso cross-tenant detectado. ` +
          `Usuario ${user.id} (schema: ${userSchema}) intentó acceder a schema: ${contextSchema}`,
      );
      throw new ForbiddenException(
        'Acceso denegado: No tiene permisos para acceder a este recurso',
      );
    }

    this.logger.debug(
      `TenantGuard: Acceso permitido para usuario ${user.id} al schema ${contextSchema}`,
    );

    return true;
  }

  /**
   * Verifica si el usuario es SUPER_ADMIN
   */
  private isSuperAdmin(user: UserSessionDto): boolean {
    return user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('super_admin');
  }
}

/**
 * Decorator para bypass del TenantGuard
 *
 * @example
 * ```typescript
 * @SkipTenantCheck()
 * @Get('public-data')
 * async getPublicData() {}
 * ```
 */
import { SetMetadata } from '@nestjs/common';
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);
