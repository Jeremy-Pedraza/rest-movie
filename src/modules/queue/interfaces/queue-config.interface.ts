/**
 * @module QueueConfigInterfaces
 * @description Interfaces de configuración para colas y jobs
 */

/**
 * @interface IQueueConfig
 * @description Configuración de una cola Bull
 */
export interface IQueueConfig {
  name: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions?: IJobOptions;
  limiter?: {
    max: number;
    duration: number;
  };
  settings?: {
    stalledInterval?: number;
    maxStalledCount?: number;
    guardInterval?: number;
    retryProcessDelay?: number;
  };
}

/**
 * @interface IJobOptions
 * @description Opciones para un job en Bull
 */
export interface IJobOptions {
  attempts?: number;
  priority?: number;
  delay?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  timeout?: number;
  jobId?: string | number;
  repeat?: {
    cron?: string;
    tz?: string;
    startDate?: Date | string | number;
    endDate?: Date | string | number;
    limit?: number;
    every?: number;
    count?: number;
  };
}

/**
 * @interface IProcessorConfig
 * @description Configuración de un processor
 */
export interface IProcessorConfig {
  name: string;
  concurrency?: number;
  processor: (job: any) => Promise<any>;
}

/**
 * @interface IQueueNames
 * @description Nombres de las colas disponibles
 */
export interface IQueueNames {
  EMAIL: string;
  NOTIFICATION: string;
  REPORT: string;
}

/**
 * @interface IJobNames
 * @description Nombres de los jobs por cola
 */
export interface IJobNames {
  EMAIL: {
    SEND: string;
    SEND_BATCH: string;
    SEND_TEMPLATE: string;
  };
  NOTIFICATION: {
    SEND: string;
    SEND_MULTI: string;
    SEND_BATCH: string;
  };
  REPORT: {
    GENERATE: string;
    SCHEDULE: string;
    EXPORT: string;
  };
}
