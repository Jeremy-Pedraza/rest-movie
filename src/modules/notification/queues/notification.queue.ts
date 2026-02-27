/**
 * @fileoverview Configuración de la cola de notificaciones
 * @module modules/notification/queues
 */

import { JOB_PRIORITIES, CLEANUP_GRACE_PERIODS } from '@modules/queue/queue.constants';

/**
 * Nombre de la cola de notificaciones
 */
export const NOTIFICATION_QUEUE_NAME = 'notifications';

/**
 * Configuración de la cola de notificaciones
 */
export const NOTIFICATION_QUEUE_CONFIG = {
  /** Nombre de la cola */
  name: NOTIFICATION_QUEUE_NAME,

  /** Opciones de conexión a Redis */
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  /** Opciones por defecto de jobs */
  defaultJobOptions: {
    attempts: parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3', 10),
    backoff: {
      type: 'exponential' as const,
      delay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '1000', 10),
    },
    removeOnComplete: 100,
    removeOnFail: false,
  },

  /** Rate limiting */
  limiter: {
    max: 100, // Máximo 100 jobs
    duration: 60000, // por minuto
  },

  /** Configuración de procesamiento */
  settings: {
    lockDuration: 30000, // 30 segundos
    maxStalledCount: 1, // Reintentar 1 vez si se queda "stalled"
  },
};

// Re-export para consumidores existentes
export { JOB_PRIORITIES, CLEANUP_GRACE_PERIODS };

/**
 * Delays específicos para notificaciones programadas
 */
export const NOTIFICATION_DELAYS = {
  IMMEDIATE: 0,
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
};
