/**
 * @fileoverview Interfaces de respuesta para Tasks
 * @module modules/tasks/interfaces
 *
 * Define las estructuras de respuesta para los endpoints del TasksController
 */

import { JobStatus } from '../tasks.constants';
import { IJobExecutionHistory, IJobExecutionResult } from './task-config.interface';

// ============================================
// RESPUESTAS DE TAREAS
// ============================================

/**
 * Información básica de una tarea programada
 */
export interface ITaskInfo {
  /** Nombre único del job */
  name: string;
  /** Descripción del job */
  description: string;
  /** Estado actual */
  status: JobStatus;
  /** Expresión cron configurada */
  cron: string;
  /** Cron en formato legible */
  cronHuman: string;
  /** Si está habilitado */
  enabled: boolean;
  /** Próxima ejecución programada */
  nextRun: Date | null;
  /** Última ejecución */
  lastRun: Date | null;
  /** Resultado de la última ejecución */
  lastRunStatus: 'success' | 'failed' | 'never' | null;
}

/**
 * Respuesta detallada de una tarea
 */
export interface ITaskDetailResponse extends ITaskInfo {
  /** Configuración del job */
  config: {
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    [key: string]: unknown;
  };
  /** Estadísticas */
  stats: {
    /** Total de ejecuciones */
    totalExecutions: number;
    /** Ejecuciones exitosas */
    successfulExecutions: number;
    /** Ejecuciones fallidas */
    failedExecutions: number;
    /** Tasa de éxito (%) */
    successRate: number;
    /** Duración promedio (ms) */
    averageDuration: number;
    /** Duración máxima (ms) */
    maxDuration: number;
    /** Duración mínima (ms) */
    minDuration: number;
  };
  /** Últimas ejecuciones */
  recentExecutions: IJobExecutionHistory[];
}

/**
 * Respuesta de listado de tareas
 */
export interface ITaskListResponse {
  /** Lista de tareas */
  tasks: ITaskInfo[];
  /** Resumen */
  summary: {
    /** Total de tareas */
    total: number;
    /** Tareas activas */
    active: number;
    /** Tareas deshabilitadas */
    disabled: number;
    /** Tareas ejecutándose */
    running: number;
  };
}

// ============================================
// RESPUESTAS DE EJECUCIÓN
// ============================================

/**
 * Respuesta al ejecutar una tarea manualmente
 */
export interface IRunTaskResponse {
  /** ID de la ejecución */
  executionId: string;
  /** Nombre del job */
  jobName: string;
  /** Si se inició correctamente */
  started: boolean;
  /** Mensaje */
  message: string;
  /** Timestamp de inicio */
  startedAt: Date;
  /** Si es dry-run */
  isDryRun: boolean;
  /** Resultado (si la ejecución fue síncrona) */
  result?: IJobExecutionResult;
}

/**
 * Respuesta de toggle (habilitar/deshabilitar)
 */
export interface IToggleTaskResponse {
  /** Nombre del job */
  jobName: string;
  /** Nuevo estado */
  enabled: boolean;
  /** Estado anterior */
  previousState: boolean;
  /** Mensaje */
  message: string;
  /** Próxima ejecución (si se habilitó) */
  nextRun: Date | null;
}

// ============================================
// RESPUESTAS DE ESTADÍSTICAS
// ============================================

/**
 * Estadísticas globales de tareas
 */
export interface ITasksStatsResponse {
  /** Estadísticas por tarea */
  byTask: Record<
    string,
    {
      totalExecutions: number;
      successfulExecutions: number;
      failedExecutions: number;
      successRate: number;
      lastRun: Date | null;
      lastStatus: string | null;
    }
  >;
  /** Totales globales */
  totals: {
    /** Total de ejecuciones (todas las tareas) */
    totalExecutions: number;
    /** Total exitosas */
    totalSuccessful: number;
    /** Total fallidas */
    totalFailed: number;
    /** Tasa de éxito global */
    overallSuccessRate: number;
  };
  /** Ejecuciones por período */
  byPeriod: {
    /** Últimas 24 horas */
    last24Hours: number;
    /** Última semana */
    lastWeek: number;
    /** Último mes */
    lastMonth: number;
  };
  /** Timestamp de las estadísticas */
  generatedAt: Date;
}

/**
 * Próximas ejecuciones programadas
 */
export interface INextRunsResponse {
  /** Lista de próximas ejecuciones */
  nextRuns: Array<{
    /** Nombre del job */
    jobName: string;
    /** Descripción */
    description: string;
    /** Próxima ejecución */
    nextRun: Date;
    /** Tiempo restante en ms */
    timeUntil: number;
    /** Tiempo restante en formato legible */
    timeUntilHuman: string;
    /** Cron expression */
    cron: string;
  }>;
  /** Timestamp de la consulta */
  checkedAt: Date;
}

// ============================================
// RESPUESTAS DE HISTORIAL
// ============================================

/**
 * Respuesta de historial de ejecuciones
 */
export interface ITaskHistoryResponse {
  /** Nombre del job */
  jobName: string;
  /** Historial de ejecuciones */
  executions: IJobExecutionHistory[];
  /** Paginación */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// RESPUESTAS DE ERROR
// ============================================

/**
 * Respuesta cuando un job no existe
 */
export interface ITaskNotFoundResponse {
  /** Nombre buscado */
  jobName: string;
  /** Mensaje de error */
  message: string;
  /** Jobs disponibles */
  availableJobs: string[];
}
