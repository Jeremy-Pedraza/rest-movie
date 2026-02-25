// src/guards/report-access.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ROLES } from '@constants/roles.constant';
import { HandleErrorService } from '@shared/common';
import { ConsolidationLevelEnum } from '@modules/reports/enums';

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
  constructor(private readonly handleError: HandleErrorService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.handleError.forbidden('Usuario no autenticado');
    }

    // Extraer parámetros de la request
    const { level, company_id, storeId } = request.query || request.body || {};
    const userRoles = user.roles || [];

    // SUPER_ADMIN, ADMIN y SYSTEM tienen acceso completo
    if (
      userRoles.includes(ROLES.SUPER_ADMIN) ||
      userRoles.includes(ROLES.ADMIN) ||
      userRoles.includes(ROLES.SYSTEM)
    ) {
      return true;
    }

    // MANAGER puede acceder a niveles 'store' y 'company' solo de su compañía
    if (userRoles.includes(ROLES.MANAGER)) {
      // Validar que solo acceda a su compañía
      // Nota: user viene de UserSessionDto que usa camelCase (companyId)
      if (company_id && company_id !== user.companyId) {
        this.handleError.forbidden('No tiene permisos para acceder a reportes de otra compañía');
      }

      // MANAGER no puede acceder a nivel 'all_companies'
      if (level === ConsolidationLevelEnum.ALL_COMPANIES) {
        this.handleError.forbidden(
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
        this.handleError.forbidden('No tiene permisos para acceder a reportes consolidados');
      }

      // Validar que solo acceda a sus tiendas asignadas
      if (storeId) {
        const userStoreIds = user.assigned_stores?.map((s: any) => s.id) || [];
        if (!userStoreIds.includes(storeId)) {
          this.handleError.forbidden('No tiene permisos para acceder a reportes de esta tienda');
        }
      }

      return true;
    }

    // Si no tiene ningún rol válido, denegar acceso
    this.handleError.forbidden('No tiene permisos para acceder a reportes');
  }
}
