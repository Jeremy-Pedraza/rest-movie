// src/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator para requerir roles específicos
 * @param roles - Lista de roles permitidos (OR lógico)
 * @example
 * @Roles(ROLES.ADMIN, ROLES.MANAGER)
 * @Get('users')
 * getUsers() {}
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
