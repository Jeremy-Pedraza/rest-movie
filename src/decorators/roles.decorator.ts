import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@constants/roles.constant';

export const ROLES_KEY = 'roles';

/**
 * Decorator para requerir roles específicos
 * @param roles - Lista de roles permitidos (OR lógico)
 * @example
 * @Roles('admin', 'manager')
 * @Get('users')
 * getUsers() {}
 */
export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
