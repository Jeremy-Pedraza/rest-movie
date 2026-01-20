// src/shared/utils/helpers/role.helper.ts

/**
 * @fileoverview Helper functions para validación de roles
 * @module shared/utils/helpers
 *
 * Funciones utilitarias para validar roles de usuario.
 * Diseñadas para trabajar con UserSessionDto (array de strings)
 * en lugar de UserEntity (que tiene métodos de instancia).
 */

/**
 * Verifica si el usuario tiene un rol específico
 *
 * @param roles - Array de nombres de roles del usuario
 * @param roleName - Nombre del rol a verificar
 * @returns true si el usuario tiene el rol
 *
 * @example
 * ```typescript
 * if (hasRole(user.roles, ROLES.ADMIN)) {
 *   // Usuario es admin
 * }
 * ```
 */
export function hasRole(roles: string[], roleName: string): boolean {
  return roles.includes(roleName);
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 *
 * @param roles - Array de nombres de roles del usuario
 * @param roleNames - Array de nombres de roles a verificar
 * @returns true si el usuario tiene al menos uno de los roles
 *
 * @example
 * ```typescript
 * if (hasAnyRole(user.roles, [ROLES.SUPER_ADMIN, ROLES.ADMIN])) {
 *   // Usuario es super_admin o admin
 * }
 * ```
 */
export function hasAnyRole(roles: string[], roleNames: string[]): boolean {
  return roleNames.some((role) => roles.includes(role));
}

/**
 * Verifica si el usuario tiene todos los roles especificados
 *
 * @param roles - Array de nombres de roles del usuario
 * @param roleNames - Array de nombres de roles requeridos
 * @returns true si el usuario tiene todos los roles
 *
 * @example
 * ```typescript
 * if (hasAllRoles(user.roles, [ROLES.MANAGER, ROLES.REPORTER])) {
 *   // Usuario tiene ambos roles
 * }
 * ```
 */
export function hasAllRoles(roles: string[], roleNames: string[]): boolean {
  return roleNames.every((role) => roles.includes(role));
}
