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

    // Verificar si el usuario tiene alguno de los roles requeridos (OR lógico)
    const userRoles: string[] = user.roles || [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

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
