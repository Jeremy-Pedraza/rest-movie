// src/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '@decorators/public.decorator';
import { ROLES_KEY } from '@decorators/roles.decorator';
import { HandleErrorService } from '@shared/common';
import { RoleRepository } from '@modules/role/role.repository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private handleError: HandleErrorService,
    private roleRepository: RoleRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      this.handleError.forbidden();
    }

    // Verificar que al menos un rol del usuario esté activo en BD
    const userRoleNames: string[] = user.roles;
    const activeRoles: string[] = [];

    for (const roleName of userRoleNames) {
      const role = await this.roleRepository.findByName(roleName);
      if (role && role.isActive) {
        activeRoles.push(role.name);
      }
    }

    if (activeRoles.length === 0) {
      this.handleError.forbidden('Todos tus roles están inactivos');
    }

    // Verificar roles requeridos del endpoint
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRequired = requiredRoles.some((role) => activeRoles.includes(role));
    if (!hasRequired) {
      this.handleError.forbidden();
    }

    return true;
  }
}
