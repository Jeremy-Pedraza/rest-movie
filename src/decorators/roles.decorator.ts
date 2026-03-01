import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir roles requeridos en un endpoint o controller
 * @example
 * @Roles(ROLES.ADMINISTRADOR)
 * @Get('admin')
 * getAdmin() {}
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
