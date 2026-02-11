// src/shared/database/guards/cross-tenant.guard.ts

/**
 * @fileoverview Guard para validar acceso cross-tenant
 * @module shared/database/guards
 *
 * NOTA: Este guard es DIFERENTE al TenantGuard global (src/guards/tenant.guard.ts).
 *
 * - TenantGuard global: Extrae y establece request.tenant (contexto del tenant)
 * - CrossTenantGuard (este): Valida que el usuario no acceda a datos de otro tenant
 *
 * Casos de uso:
 * 1. Validar que store pertenece a la company del usuario
 * 2. Validar que el report es de una store de su company
 * 3. Prevenir acceso cross-tenant
 *
 * @example
 * ```typescript
 * @UseGuards(CrossTenantGuard)
 * @Get(':storeId/reports')
 * async getReports(@Param('storeId') storeId: string) {
 *   // El guard ya validó que storeId pertenece a la company del usuario
 * }
 * ```
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SchemaContext } from '../schema.context';
import { UserSessionDto } from '@modules/auth/interfaces';

/**
 * Metadata key para bypass del CrossTenantGuard
 */
export const SKIP_CROSS_TENANT_CHECK_KEY = 'skip_cross_tenant_check';

/**
 * Decorator para bypass del CrossTenantGuard
 *
 * @example
 * ```typescript
 * @SkipCrossTenantCheck()
 * @Get('admin/all-reports')
 * async getAllReports() {}
 * ```
 */
export const SkipCrossTenantCheck = () => SetMetadata(SKIP_CROSS_TENANT_CHECK_KEY, true);

/**
 * CrossTenantGuard - Valida que el usuario no acceda a datos de otro tenant
 *
 * Funcionalidades:
 * - Verifica que el usuario tenga company asignada
 * - Valida que el schema del contexto coincida con el del usuario
 * - Permite bypass con @SkipCrossTenantCheck() decorator
 * - Compatible con roles SUPER_ADMIN (acceso a todos los tenants)
 */
@Injectable()
export class CrossTenantGuard implements CanActivate {
  private readonly logger = new Logger(CrossTenantGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly schemaContext: SchemaContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si el endpoint tiene bypass
    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_CROSS_TENANT_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCheck) {
      this.logger.debug('CrossTenantGuard: bypass habilitado para este endpoint');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserSessionDto | undefined;

    // Si no hay usuario (ruta pública), permitir
    if (!user) {
      this.logger.debug('CrossTenantGuard: No hay usuario autenticado, permitiendo');
      return true;
    }

    // Super admin puede acceder a todos los tenants
    if (this.isSuperAdmin(user)) {
      this.logger.debug(`CrossTenantGuard: Usuario ${user.id} es SUPER_ADMIN, acceso permitido`);
      return true;
    }

    // Validar que el usuario tenga company asignada
    if (!user.companyId && !user.company?.id) {
      this.logger.warn(`CrossTenantGuard: Usuario ${user.id} no tiene company asignada`);
      throw new ForbiddenException('Acceso denegado: Usuario no pertenece a ninguna compañía');
    }

    // Validar que el schema del contexto coincida
    const contextSchema = this.schemaContext.getSchema();
    const userSchema = user.company?.schema || user.schema || 'public';

    if (contextSchema !== userSchema && contextSchema !== 'public') {
      this.logger.warn(
        `CrossTenantGuard: Intento de acceso cross-tenant detectado. ` +
          `Usuario ${user.id} (schema: ${userSchema}) intentó acceder a schema: ${contextSchema}`,
      );
      throw new ForbiddenException(
        'Acceso denegado: No tiene permisos para acceder a este recurso',
      );
    }

    this.logger.debug(
      `CrossTenantGuard: Acceso permitido para usuario ${user.id} al schema ${contextSchema}`,
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
