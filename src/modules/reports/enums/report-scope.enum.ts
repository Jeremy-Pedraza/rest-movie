// src/modules/reports/enums/report-scope.enum.ts

/**
 * Enum para filtrar el alcance de reportes en consolidaciones
 *
 * @description
 * Define qué tipo de reportes incluir en las consolidaciones
 * para evitar doble conteo cuando existen reportes individuales
 * por empleado Y reportes consolidados.
 *
 * PROBLEMA QUE RESUELVE:
 * Si una tienda tiene:
 * - 3 reportes individuales (uno por empleado)
 * - 1 reporte consolidado (suma de todos)
 *
 * Sin este filtro, una consolidación sumaría los 4 reportes,
 * contando las ventas dos veces.
 *
 * SOLUCIÓN:
 * - INDIVIDUAL: Solo suma reportes por empleado (employee_id IS NOT NULL)
 * - CONSOLIDATED: Solo suma reportes consolidados (employee_id IS NULL)
 * - ALL: Suma todos (comportamiento legacy - usar con cuidado)
 *
 * @example
 * ```typescript
 * // Consolidar solo reportes individuales (evita doble conteo)
 * const dto: ConsolidateReportsDto = {
 *   consolidation_level: ConsolidationLevelEnum.COMPANY,
 *   company_id: 'uuid',
 *   date_from: '2025-01-01',
 *   date_to: '2025-01-31',
 *   report_scope: ReportScopeEnum.INDIVIDUAL,
 * };
 * ```
 */
export enum ReportScopeEnum {
  /**
   * Solo reportes individuales (por empleado)
   * Filtra: employee_id IS NOT NULL
   *
   * Usar cuando cada empleado genera su propio reporte
   * y quieres consolidar sumando los reportes de empleados.
   */
  INDIVIDUAL = 'individual',

  /**
   * Solo reportes consolidados (sin empleado)
   * Filtra: employee_id IS NULL
   *
   * Usar cuando los reportes consolidados ya existen
   * y quieres evitar sumar los individuales.
   */
  CONSOLIDATED = 'consolidated',

  /**
   * Todos los reportes (sin filtro por employee_id)
   *
   * ⚠️ ADVERTENCIA: Puede causar doble conteo si existen
   * tanto reportes individuales como consolidados para
   * el mismo día/tienda.
   *
   * Usar solo si estás seguro de que no hay duplicación.
   */
  ALL = 'all',
}
