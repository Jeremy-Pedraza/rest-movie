/**
 * @fileoverview Interfaces de configuración para Tasks
 * @module modules/tasks/interfaces
 *
 * Define las estructuras de configuración para jobs programados
 */

import { JobName, JobStatus, CronExpression } from '../tasks.constants';

// ============================================
// CONFIGURACIÓN DE JOBS
// ============================================

/**
 * Configuración base para un job programado
 */
export interface IJobConfig {
  /** Nombre único del job */
  name: JobName | string;
  /** Expresión cron para programación */
  cron: CronExpression | string;
  /** Si el job está habilitado */
  enabled: boolean;
  /** Descripción del job */
  description: string;
  /** Timeout máximo en milisegundos */
  timeout?: number;
  /** Número máximo de reintentos */
  maxRetries?: number;
  /** Delay entre reintentos en ms */
  retryDelay?: number;
}

/**
 * Configuración específica para cleanup job
 */
export interface ICleanupJobConfig extends IJobConfig {
  /** Días de retención antes de eliminar */
  retentionDays: number;
  /** Tablas a limpiar (si no se especifica, limpia todas con soft-delete) */
  tables?: string[];
}

/**
 * Configuración específica para backup job
 */
export interface IBackupJobConfig extends IJobConfig {
  /** Tablas a respaldar */
  tables: string[];
  /** Directorio de destino */
  outputDir?: string;
  /** Comprimir archivos de backup */
  compress?: boolean;
  /** Número de backups a mantener */
  keepBackups?: number;
}

/**
 * Configuración específica para log cleanup job
 */
export interface ILogCleanupJobConfig extends IJobConfig {
  /** Días de retención */
  retentionDays: number;
  /** Niveles de log a limpiar */
  levels: string[];
}

/**
 * Configuración específica para cache warmup job
 */
export interface ICacheWarmupJobConfig extends IJobConfig {
  /** Keys de cache a precalentar */
  cacheKeys?: string[];
  /** TTL por defecto para cache precalentado */
  defaultTtl?: number;
}

// ============================================
// OPCIONES DE EJECUCIÓN
// ============================================

/**
 * Opciones para ejecutar un job manualmente
 */
export interface IRunJobOptions {
  /** Forzar ejecución aunque esté deshabilitado */
  force?: boolean;
  /** Ejecutar en modo dry-run (sin cambios reales) */
  dryRun?: boolean;
  /** Parámetros adicionales específicos del job */
  params?: Record<string, unknown>;
  /** Timeout personalizado para esta ejecución */
  timeout?: number;
}

/**
 * Opciones para habilitar/deshabilitar un job
 */
export interface IToggleJobOptions {
  /** Razón del cambio (para auditoría) */
  reason?: string;
  /** Usuario que realizó el cambio */
  changedBy?: string;
  /** Nueva expresión cron (solo si se habilita) */
  newCron?: string;
}

// ============================================
// ESTADO DE EJECUCIÓN
// ============================================

/**
 * Contexto de ejecución de un job
 */
export interface IJobExecutionContext {
  /** ID único de la ejecución */
  executionId: string;
  /** Nombre del job */
  jobName: string;
  /** Timestamp de inicio */
  startedAt: Date;
  /** Si es una ejecución manual */
  isManual: boolean;
  /** Usuario que inició (si es manual) */
  triggeredBy?: string;
  /** Parámetros de la ejecución */
  params?: Record<string, unknown>;
}

/**
 * Resultado de una ejecución de job
 */
export interface IJobExecutionResult {
  /** Si la ejecución fue exitosa */
  success: boolean;
  /** Mensaje de resultado */
  message: string;
  /** Duración en milisegundos */
  duration: number;
  /** Datos adicionales del resultado */
  data?: Record<string, unknown>;
  /** Error si falló */
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  /** Métricas de la ejecución */
  metrics?: {
    /** Registros procesados */
    processed?: number;
    /** Registros afectados */
    affected?: number;
    /** Registros con error */
    errors?: number;
    /** Registros omitidos */
    skipped?: number;
  };
}

/**
 * Registro de historial de ejecución
 */
export interface IJobExecutionHistory {
  /** ID único de la ejecución */
  id: string;
  /** Nombre del job */
  jobName: string;
  /** Estado final */
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  /** Timestamp de inicio */
  startedAt: Date;
  /** Timestamp de finalización */
  completedAt: Date;
  /** Duración en ms */
  duration: number;
  /** Si fue ejecución manual */
  isManual: boolean;
  /** Usuario que inició (si manual) */
  triggeredBy?: string;
  /** Resultado de la ejecución */
  result?: IJobExecutionResult;
  /** Mensaje de error (si falló) */
  errorMessage?: string;
}

// ============================================
// CONFIGURACIÓN DEL MÓDULO
// ============================================

/**
 * Configuración global del módulo de tareas
 */
export interface ITasksModuleConfig {
  /** Si el módulo está habilitado globalmente */
  enabled: boolean;
  /** Configuración de cada job */
  jobs: Record<string, IJobConfig>;
  /** Configuración de historial */
  history: {
    /** Número de ejecuciones a mantener */
    limit: number;
    /** Si persistir en base de datos */
    persist: boolean;
  };
  /** Configuración de logging */
  logging: {
    /** Nivel de log para jobs */
    level: 'debug' | 'verbose' | 'log' | 'warn' | 'error';
    /** Si loggear inicio/fin de cada ejecución */
    logExecutions: boolean;
  };
}
