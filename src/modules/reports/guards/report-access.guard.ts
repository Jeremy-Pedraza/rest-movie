// src/modules/reports/guards/report-access.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES } from '@constants/roles.constant';
import { ConsolidationLevelEnum } from '../enums';

/**
 * ReportAccessGuard
 *
 * @description
 * Guard personalizado para validar permisos de acceso a reportes
 * según el rol del usuario y el nivel de consolidación solicitado.
 *
 * Reglas de acceso:
 * - SUPER_ADMIN/ADMIN: Acceso completo a todos los niveles y todas las tiendas/compañías
 * - MANAGER: Acceso a niveles 'store' y 'company' solo de su compañía
 * - USER: Acceso solo a nivel 'store' de sus tiendas asignadas
 *
 * Se aplica automáticamente en endpoints de reportes que usan
 * el decorador @UseGuards(ReportAccessGuard).
 *
 * @example
 * ```typescript
 * @UseGuards(ReportAccessGuard)
 * @Get('consolidated')
 * async getConsolidated(@Query() query: ConsolidateReportsDto) {
 *   // Guard valida automáticamente permisos
 * }
 * ```
 */
@Injectable()
export class ReportAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Extraer parámetros de la request
    const { level, company_id, store_id } = request.query || request.body || {};
    const userRoles = user.roles || [];

    // SUPER_ADMIN y ADMIN tienen acceso completo
    if (userRoles.includes(ROLES.SUPER_ADMIN) || userRoles.includes(ROLES.ADMIN)) {
      return true;
    }

    // MANAGER puede acceder a niveles 'store' y 'company' solo de su compañía
    if (userRoles.includes(ROLES.MANAGER)) {
      // Validar que solo acceda a su compañía
      if (company_id && company_id !== user.company_id) {
        throw new ForbiddenException('No tiene permisos para acceder a reportes de otra compañía');
      }

      // MANAGER no puede acceder a nivel 'all_companies'
      if (level === ConsolidationLevelEnum.ALL_COMPANIES) {
        throw new ForbiddenException(
          'No tiene permisos para acceder a reportes consolidados de todas las compañías',
        );
      }

      return true;
    }

    // USER solo puede acceder a nivel 'store' de sus tiendas asignadas
    if (userRoles.includes(ROLES.USER)) {
      // USER no puede acceder a niveles 'company' o 'all_companies'
      if (
        level === ConsolidationLevelEnum.COMPANY ||
        level === ConsolidationLevelEnum.ALL_COMPANIES
      ) {
        throw new ForbiddenException('No tiene permisos para acceder a reportes consolidados');
      }

      // Validar que solo acceda a sus tiendas asignadas
      if (store_id) {
        const userStoreIds = user.assigned_stores?.map((s: any) => s.id) || [];
        if (!userStoreIds.includes(store_id)) {
          throw new ForbiddenException('No tiene permisos para acceder a reportes de esta tienda');
        }
      }

      return true;
    }

    // Si no tiene ningún rol válido, denegar acceso
    throw new ForbiddenException('No tiene permisos para acceder a reportes');
  }
}
