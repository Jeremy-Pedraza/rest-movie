// src/constants/roles.constant.ts

/**
 * @fileoverview Constantes de roles del sistema
 * @module constants
 */

export const ROLES = {
  /** Super administrador - acceso total */
  SUPER_ADMIN: 'super_admin',
  /** Administrador - gestión completa */
  ADMIN: 'admin',
  /** Sistema - operaciones internas/automatizadas */
  SYSTEM: 'system',
  /** Manager - gestión limitada */
  MANAGER: 'manager',
  /** Usuario estándar */
  USER: 'user',
  /** Invitado - solo lectura */
  GUEST: 'guest',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

/**
 * Jerarquía de roles - cada rol puede hacer lo que hacen los roles inferiores
 */
export const ROLES_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.SYSTEM,
    ROLES.MANAGER,
    ROLES.USER,
    ROLES.GUEST,
  ],
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.SYSTEM, ROLES.MANAGER, ROLES.USER, ROLES.GUEST],
  [ROLES.SYSTEM]: [ROLES.SYSTEM, ROLES.MANAGER, ROLES.USER, ROLES.GUEST],
  [ROLES.MANAGER]: [ROLES.MANAGER, ROLES.USER, ROLES.GUEST],
  [ROLES.USER]: [ROLES.USER, ROLES.GUEST],
  [ROLES.GUEST]: [ROLES.GUEST],
} as const;

/**
 * Roles que pueden acceder al panel de administración
 */
export const ADMIN_ROLES: RoleType[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

/**
 * Roles que pueden gestionar usuarios
 */
export const USER_MANAGEMENT_ROLES: RoleType[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER];

/**
 * Roles del sistema (para operaciones internas)
 */
export const SYSTEM_ROLES: RoleType[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SYSTEM];

/**
 * Verifica si un rol tiene acceso a otro rol según la jerarquía
 * @param userRole - Rol del usuario
 * @param requiredRole - Rol requerido
 * @returns true si tiene acceso
 */
export function hasRoleAccess(userRole: RoleType, requiredRole: RoleType): boolean {
  const hierarchy = ROLES_HIERARCHY[userRole] as readonly string[];
  return hierarchy ? hierarchy.includes(requiredRole) : false;
}
