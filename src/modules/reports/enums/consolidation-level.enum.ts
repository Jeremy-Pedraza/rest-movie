// src/modules/reports/enums/consolidation-level.enum.ts

/**
 * Niveles de consolidación de reportes
 *
 * @description
 * Define los diferentes niveles en los que se pueden consolidar reportes.
 * Cada nivel representa un scope diferente de datos.
 *
 * Permisos por rol:
 * - SUPER_ADMIN: Acceso a todos los niveles (store, company, all_companies)
 * - ADMIN: Acceso a todos los niveles (store, company, all_companies)
 * - MANAGER: Solo niveles 'store' y 'company' de su compañía
 * - USER: Solo nivel 'store' de sus tiendas asignadas
 *
 * @example
 * ```typescript
 * const level = ConsolidationLevelEnum.COMPANY;
 * ```
 */
export enum ConsolidationLevelEnum {
  /**
   * Consolidación a nivel de tienda individual
   * Muestra datos de una sola tienda
   *
   * Permisos:
   * - SUPER_ADMIN/ADMIN: Cualquier tienda
   * - MANAGER: Tiendas de su compañía
   * - USER: Solo sus tiendas asignadas
   */
  STORE = 'store',

  /**
   * Consolidación a nivel de compañía
   * Agrega datos de todas las tiendas de una compañía
   *
   * Permisos:
   * - SUPER_ADMIN/ADMIN: Cualquier compañía
   * - MANAGER: Solo su compañía
   * - USER: Sin acceso
   */
  COMPANY = 'company',

  /**
   * Consolidación de todas las compañías
   * Agrega datos de todas las tiendas de todas las compañías
   *
   * Permisos:
   * - SUPER_ADMIN/ADMIN: Acceso completo
   * - MANAGER/USER: Sin acceso
   */
  ALL_COMPANIES = 'all_companies',
}
