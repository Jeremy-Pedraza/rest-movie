// src/modules/reports/enums/report-type.enum.ts

/**
 * Tipos de reportes disponibles en el sistema
 *
 * @description
 * Define los diferentes tipos de reportes que se pueden generar.
 * Cada tipo tiene una frecuencia y nivel de consolidación específico.
 *
 * @example
 * ```typescript
 * const reportType = ReportTypeEnum.DAILY;
 * ```
 */
export enum ReportTypeEnum {
  /**
   * Reporte diario (generado cada día)
   * Base para todos los demás tipos de reportes
   */
  DAILY = 'daily',

  /**
   * Reporte semanal (consolidación de reportes diarios)
   * Consolida 7 días de datos
   */
  WEEKLY = 'weekly',

  /**
   * Reporte mensual (consolidación de reportes diarios)
   * Consolida 30 días de datos
   */
  MONTHLY = 'monthly',
}
