// src/guards/roles.guard.ts

/**
 * @fileoverview Guard para autorización basada en roles
 * @module guards
 *
 * Valida que el usuario tenga alguno de los roles requeridos.
 * Usar @Roles(ROLES.ADMIN, ROLES.MANAGER) para especificar roles permitidos.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '@decorators/roles.decorator';
import { ERROR_CODES } from '@constants/error-codes.constant';
import { RESPONSE_MESSAGES } from '@constants/response-messages.constant';
import { hasRoleAccess, RoleType } from '@constants/roles.constant';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener usuario del request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        message: RESPONSE_MESSAGES.AUTH.UNAUTHORIZED,
        error: 'Forbidden',
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
      });
    }

    // Verificar acceso por jerarquía de roles (OR lógico):
    // si alguno de los roles del usuario cubre alguno de los roles requeridos, pasa.
    const userRoles: string[] = user.roles || [];
    const hasRole = userRoles.some((userRole) =>
      requiredRoles.some((requiredRole) => {
        // Si el rol no está en jerarquía conocida, fallback a comparación exacta.
        const hierarchicalAccess = hasRoleAccess(userRole as RoleType, requiredRole as RoleType);
        return hierarchicalAccess || userRole === requiredRole;
      }),
    );

    if (!hasRole) {
      throw new ForbiddenException({
        success: false,
        statusCode: 403,
        message: `${RESPONSE_MESSAGES.AUTH.FORBIDDEN}. Roles requeridos: ${requiredRoles.join(', ')}`,
        error: 'Forbidden',
        code: ERROR_CODES.AUTH_FORBIDDEN,
        requiredRoles,
        userRoles,
      });
    }

    return true;
  }
}
