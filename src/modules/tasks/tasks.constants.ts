/**
 * @fileoverview Constantes del módulo Tasks
 * @module modules/tasks
 *
 * Define expresiones cron, nombres de jobs y configuraciones por defecto
 * para las tareas programadas del sistema.
 */

// ============================================
// NOMBRES DE JOBS
// ============================================

/**
 * Nombres únicos para cada job programado
 * Usados para identificar, habilitar/deshabilitar y ejecutar jobs
 */
export const JOB_NAMES = {
  /** Limpieza de registros soft-deleted antiguos */
  CLEANUP: 'cleanup',
  /** Backup de datos críticos a JSON */
  BACKUP: 'backup',
  /** Limpieza de sesiones expiradas */
  SESSION_CLEANUP: 'session-cleanup',
  /** Limpieza de logs antiguos */
  LOG_CLEANUP: 'log-cleanup',
  /** Precalentamiento de cache */
  CACHE_WARMUP: 'cache-warmup',
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

// ============================================
// EXPRESIONES CRON
// ============================================

/**
 * Expresiones cron predefinidas para tareas comunes
 *
 * Formato: segundo minuto hora díaMes mes díaSemana
 * - * = cualquier valor
 * - /n = cada n unidades
 * - n-m = rango de n a m
 *
 * @example
 * '0 3 * * *' = 3:00 AM todos los días
 * '0 2 * * 0' = 2:00 AM cada domingo
 * '* /15 * * * *' = cada 15 minutos
 */
export const CRON_EXPRESSIONS = {
  /** Cada minuto (para testing) */
  EVERY_MINUTE: '* * * * *',
  /** Cada 5 minutos */
  EVERY_5_MINUTES: '*/5 * * * *',
  /** Cada 15 minutos */
  EVERY_15_MINUTES: '*/15 * * * *',
  /** Cada 30 minutos */
  EVERY_30_MINUTES: '*/30 * * * *',
  /** Cada hora (minuto 0) */
  EVERY_HOUR: '0 * * * *',
  /** Cada 6 horas */
  EVERY_6_HOURS: '0 */6 * * *',
  /** Cada 12 horas */
  EVERY_12_HOURS: '0 */12 * * *',
  /** Diario a medianoche */
  DAILY_MIDNIGHT: '0 0 * * *',
  /** Diario a las 2 AM */
  DAILY_2AM: '0 2 * * *',
  /** Diario a las 3 AM */
  DAILY_3AM: '0 3 * * *',
  /** Diario a las 4 AM */
  DAILY_4AM: '0 4 * * *',
  /** Diario a las 6 AM */
  DAILY_6AM: '0 6 * * *',
  /** Semanal - Domingo a las 2 AM */
  WEEKLY_SUNDAY_2AM: '0 2 * * 0',
  /** Semanal - Lunes a las 6 AM */
  WEEKLY_MONDAY_6AM: '0 6 * * 1',
  /** Mensual - Día 1 a las 3 AM */
  MONTHLY_FIRST_DAY: '0 3 1 * *',
} as const;

export type CronExpression = (typeof CRON_EXPRESSIONS)[keyof typeof CRON_EXPRESSIONS];

// ============================================
// CONFIGURACIÓN POR DEFECTO DE JOBS
// ============================================

/**
 * Configuración por defecto para cada job
 * Puede ser sobrescrita por variables de entorno
 */
export const DEFAULT_JOB_CONFIG = {
  [JOB_NAMES.CLEANUP]: {
    enabled: true,
    cron: CRON_EXPRESSIONS.DAILY_3AM,
    description: 'Limpieza de registros soft-deleted mayores a 30 días',
    retentionDays: 30,
  },
  [JOB_NAMES.BACKUP]: {
    enabled: true,
    cron: CRON_EXPRESSIONS.WEEKLY_SUNDAY_2AM,
    description: 'Backup de tablas críticas a archivos JSON',
    tables: ['users', 'roles', 'permissions'],
  },
  [JOB_NAMES.SESSION_CLEANUP]: {
    enabled: true,
    cron: CRON_EXPRESSIONS.EVERY_15_MINUTES,
    description: 'Eliminación de sesiones expiradas',
  },
  [JOB_NAMES.LOG_CLEANUP]: {
    enabled: true,
    cron: CRON_EXPRESSIONS.DAILY_4AM,
    description: 'Eliminación de logs de nivel debug mayores a 7 días',
    retentionDays: 7,
    levels: ['debug', 'verbose'],
  },
  [JOB_NAMES.CACHE_WARMUP]: {
    enabled: true,
    cron: CRON_EXPRESSIONS.DAILY_6AM,
    description: 'Precalentamiento de cache con datos frecuentes',
  },
} as const;

// ============================================
// ESTADOS DE JOBS
// ============================================

/**
 * Estados posibles de un job
 */
export const JOB_STATUS = {
  /** Job activo y programado */
  ACTIVE: 'active',
  /** Job deshabilitado */
  DISABLED: 'disabled',
  /** Job ejecutándose actualmente */
  RUNNING: 'running',
  /** Job pausado temporalmente */
  PAUSED: 'paused',
  /** Job completado (última ejecución exitosa) */
  COMPLETED: 'completed',
  /** Job fallido (última ejecución con error) */
  FAILED: 'failed',
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

// ============================================
// LÍMITES Y CONFIGURACIÓN GENERAL
// ============================================

/**
 * Configuración general del módulo de tareas
 */
export const TASKS_CONFIG = {
  /** Tiempo máximo de ejecución de un job (ms) */
  MAX_EXECUTION_TIME: 5 * 60 * 1000, // 5 minutos
  /** Número máximo de reintentos en caso de fallo */
  MAX_RETRIES: 3,
  /** Delay entre reintentos (ms) */
  RETRY_DELAY: 5000,
  /** Número de ejecuciones a mantener en historial */
  HISTORY_LIMIT: 100,
  /** Directorio para backups */
  BACKUP_DIR: 'backups',
  /** Formato de fecha para nombres de archivos */
  DATE_FORMAT: 'YYYY-MM-DD_HH-mm-ss',
} as const;

// ============================================
// VARIABLES DE ENTORNO
// ============================================

/**
 * Nombres de variables de entorno para configuración
 */
export const ENV_KEYS = {
  /** Habilitar/deshabilitar todo el módulo */
  TASKS_ENABLED: 'TASKS_ENABLED',
  /** Prefijo para variables de jobs individuales */
  PREFIX: 'TASKS_',
  /** Sufijo para habilitar/deshabilitar */
  ENABLED_SUFFIX: '_ENABLED',
  /** Sufijo para expresión cron */
  CRON_SUFFIX: '_CRON',
} as const;

/**
 * Helper para obtener el nombre de variable de entorno de un job
 * @param jobName Nombre del job
 * @param type Tipo de configuración (enabled o cron)
 * @returns Nombre de la variable de entorno
 *
 * @example
 * getEnvKey('cleanup', 'enabled') // 'TASKS_CLEANUP_ENABLED'
 * getEnvKey('session-cleanup', 'cron') // 'TASKS_SESSION_CLEANUP_CRON'
 */
export function getEnvKey(jobName: string, type: 'enabled' | 'cron'): string {
  const normalizedName = jobName.toUpperCase().replace(/-/g, '_');
  const suffix = type === 'enabled' ? ENV_KEYS.ENABLED_SUFFIX : ENV_KEYS.CRON_SUFFIX;
  return `${ENV_KEYS.PREFIX}${normalizedName}${suffix}`;
}
