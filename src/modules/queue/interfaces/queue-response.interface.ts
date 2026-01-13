/**
 * @module QueueInterfaces
 * @description Interfaces de respuesta para el módulo Queue
 */

/**
 * @interface IJobInfo
 * @description Información básica de un job
 */
export interface IJobInfo {
  id: string | number;
  name: string;
  data: any;
  opts: any;
  timestamp: number;
  attemptsMade: number;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: any;
  finishedOn?: number;
  processedOn?: number;
}

/**
 * @interface IQueueStats
 * @description Estadísticas de una cola
 */
export interface IQueueStats {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
  lastUpdate: string;
}

/**
 * @interface IJobResponse
 * @description Respuesta al agregar un job
 */
export interface IJobResponse {
  jobId: string | number;
  jobName: string;
  queueName: string;
  status: string;
  addedAt: string;
  priority?: number;
  delay?: number;
  attempts?: number;
}

/**
 * @interface IJobDetailResponse
 * @description Respuesta detallada de un job
 */
export interface IJobDetailResponse extends IJobInfo {
  queueName: string;
  state: string;
  progress: number;
  delay?: number;
  priority?: number;
}

/**
 * @interface ICleanJobsResponse
 * @description Respuesta al limpiar jobs
 */
export interface ICleanJobsResponse {
  queueName: string;
  status: string;
  cleaned: number;
  grace: number;
  timestamp: string;
}

/**
 * @interface IPauseQueueResponse
 * @description Respuesta al pausar/reanudar cola
 */
export interface IPauseQueueResponse {
  queueName: string;
  action: 'paused' | 'resumed';
  timestamp: string;
  isPaused: boolean;
}

/**
 * @interface IQueueHealthResponse
 * @description Respuesta de health check de una cola
 */
export interface IQueueHealthResponse {
  queueName: string;
  isHealthy: boolean;
  redis: {
    connected: boolean;
    host: string;
    port: number;
  };
  stats: IQueueStats;
  lastCheck: string;
}

/**
 * @interface IAllQueuesStatsResponse
 * @description Estadísticas de todas las colas
 */
export interface IAllQueuesStatsResponse {
  totalQueues: number;
  queues: IQueueStats[];
  summary: {
    totalWaiting: number;
    totalActive: number;
    totalCompleted: number;
    totalFailed: number;
    totalDelayed: number;
  };
  timestamp: string;
}

/**
 * @interface IJobsListResponse
 * @description Respuesta paginada de lista de jobs
 */
export interface IJobsListResponse {
  jobs: IJobDetailResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * @interface IRetryJobResponse
 * @description Respuesta al reintentar un job fallido
 */
export interface IRetryJobResponse {
  jobId: string | number;
  queueName: string;
  status: 'retrying';
  retriedAt: string;
  newAttempt: number;
}

/**
 * @interface IRemoveJobResponse
 * @description Respuesta al eliminar un job
 */
export interface IRemoveJobResponse {
  jobId: string | number;
  queueName: string;
  removed: boolean;
  timestamp: string;
}

/**
 * @interface IQueueMetrics
 * @description Métricas avanzadas de una cola
 */
export interface IQueueMetrics {
  queueName: string;
  throughput: {
    lastHour: number;
    lastDay: number;
    average: number;
  };
  performance: {
    averageProcessingTime: number;
    medianProcessingTime: number;
    slowestJob: {
      id: string | number;
      duration: number;
    };
    fastestJob: {
      id: string | number;
      duration: number;
    };
  };
  reliability: {
    successRate: number;
    failureRate: number;
    retryRate: number;
  };
  timestamp: string;
}
