/**
 * @module QueueConstants
 * @description Constantes del módulo Queue
 */

import { IJobNames, IQueueNames } from './interfaces';

/**
 * @constant QUEUE_NAMES
 * @description Nombres de las colas disponibles
 */
export const QUEUE_NAMES: IQueueNames = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  REPORT: 'report-queue',
};

/**
 * @constant JOB_NAMES
 * @description Nombres de los jobs organizados por cola
 */
export const JOB_NAMES: IJobNames = {
  EMAIL: {
    SEND: 'send-email',
    SEND_BATCH: 'send-email-batch',
    SEND_TEMPLATE: 'send-email-template',
  },
  NOTIFICATION: {
    SEND: 'send-notification',
    SEND_MULTI: 'send-notification-multi',
    SEND_BATCH: 'send-notification-batch',
  },
  REPORT: {
    GENERATE: 'generate-report',
    SCHEDULE: 'schedule-report',
    EXPORT: 'export-report',
  },
};

/**
 * @constant JOB_PRIORITIES
 * @description Prioridades predefinidas para jobs
 */
export const JOB_PRIORITIES = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 8,
  URGENT: 10,
} as const;

/**
 * @constant JOB_DELAYS
 * @description Delays predefinidos en milisegundos
 */
export const JOB_DELAYS = {
  IMMEDIATE: 0,
  SHORT: 5000, // 5 segundos
  MEDIUM: 30000, // 30 segundos
  LONG: 300000, // 5 minutos
  VERY_LONG: 3600000, // 1 hora
} as const;

/**
 * @constant DEFAULT_JOB_OPTIONS
 * @description Opciones por defecto para jobs
 */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  priority: JOB_PRIORITIES.NORMAL,
  delay: JOB_DELAYS.IMMEDIATE,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  // Bull 4.x soporta KeepJobsOptions { age, count } en runtime,
  // pero los tipos de @nestjs/bull no lo exponen correctamente
  removeOnComplete: { age: 3600, count: 200 } as any, // Max 200 completados, expiran en 1h
  removeOnFail: { age: 604800, count: 1000 } as any, // Max 1000 fallidos, expiran en 7 dias
  timeout: 30000, // 30 segundos
};

/**
 * @constant QUEUE_RATE_LIMITS
 * @description Rate limits por cola
 */
export const QUEUE_RATE_LIMITS = {
  EMAIL: {
    max: 100, // 100 emails
    duration: 60000, // por minuto
  },
  NOTIFICATION: {
    max: 200, // 200 notificaciones
    duration: 60000, // por minuto
  },
  REPORT: {
    max: 10, // 10 reportes
    duration: 60000, // por minuto
  },
};

/**
 * @constant PROCESSOR_CONCURRENCY
 * @description Concurrencia por processor
 */
export const PROCESSOR_CONCURRENCY = {
  EMAIL: 5, // 5 emails en paralelo
  NOTIFICATION: 10, // 10 notificaciones en paralelo
  REPORT: 2, // 2 reportes en paralelo
};

/**
 * @constant CLEANUP_GRACE_PERIODS
 * @description Períodos de gracia para limpieza (en milisegundos)
 */
export const CLEANUP_GRACE_PERIODS = {
  COMPLETED: 3600000, // 1 hora
  FAILED: 86400000, // 24 horas
  ACTIVE: 300000, // 5 minutos
};

/**
 * @constant JOB_TIMEOUT
 * @description Timeouts por tipo de job (en milisegundos)
 */
export const JOB_TIMEOUT = {
  EMAIL: 30000, // 30 segundos
  NOTIFICATION: 20000, // 20 segundos
  REPORT: 300000, // 5 minutos
};

/**
 * @constant STALLED_JOB_CONFIG
 * @description Configuración para jobs estancados
 */
export const STALLED_JOB_CONFIG = {
  interval: 30000, // Revisar cada 30 segundos
  maxCount: 2, // Máximo 2 intentos de recuperación
};
