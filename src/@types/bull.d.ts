// src/@types/bull.d.ts

/**
 * Declaración de tipos para bull
 * Fallback en caso de que @types/bull no esté disponible
 * 
 * El módulo @nestjs/bull ya incluye tipos para la mayoría de casos de uso.
 * Este archivo existe solo como fallback para TypeScript.
 */

declare module 'bull' {
  import { EventEmitter } from 'events';
  import { Redis, RedisOptions } from 'ioredis';

  export interface QueueOptions {
    redis?: RedisOptions | string;
    prefix?: string;
    defaultJobOptions?: JobOptions;
    limiter?: RateLimiter;
    settings?: AdvancedSettings;
  }

  export interface RateLimiter {
    max: number;
    duration: number;
    bounceBack?: boolean;
  }

  export interface AdvancedSettings {
    lockDuration?: number;
    lockRenewTime?: number;
    stalledInterval?: number;
    maxStalledCount?: number;
    guardInterval?: number;
    retryProcessDelay?: number;
    backoffStrategies?: Record<string, (attemptsMade: number, err: Error) => number>;
    drainDelay?: number;
  }

  export interface JobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
    repeat?: RepeatOptions;
    backoff?: number | BackoffOptions;
    lifo?: boolean;
    timeout?: number;
    jobId?: string;
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
    stackTraceLimit?: number;
  }

  export interface RepeatOptions {
    cron?: string;
    tz?: string;
    startDate?: Date | string | number;
    endDate?: Date | string | number;
    limit?: number;
    every?: number;
    count?: number;
    prevMillis?: number;
    jobId?: string;
  }

  export interface BackoffOptions {
    type: 'fixed' | 'exponential';
    delay?: number;
  }

  export interface Job<T = unknown> {
    id: string | number;
    name: string;
    data: T;
    opts: JobOptions;
    progress(): Promise<number>;
    updateProgress(progress: number | object): Promise<void>;
    getState(): Promise<JobStatus>;
    log(row: string): Promise<void>;
    update(data: T): Promise<void>;
    remove(): Promise<void>;
    retry(): Promise<void>;
    discard(): Promise<void>;
    finished(): Promise<unknown>;
    moveToCompleted(returnValue?: string, ignoreLock?: boolean): Promise<[unknown, string]>;
    moveToFailed(err: Error, ignoreLock?: boolean): Promise<[unknown, string]>;
    promote(): Promise<void>;
    lockKey(): string;
    releaseLock(): Promise<void>;
    takeLock(): Promise<boolean>;
    extendLock(duration?: number): Promise<void>;
    attemptsMade: number;
    failedReason?: string;
    stacktrace: string[];
    returnvalue: unknown;
    finishedOn?: number;
    processedOn?: number;
    timestamp: number;
    queue: Queue<T>;
  }

  export interface Queue<T = unknown> extends EventEmitter {
    name: string;
    token: string;
    keyPrefix: string;
    client: Redis;
    clients: Redis[];
    opts: QueueOptions;
    
    add(data: T, opts?: JobOptions): Promise<Job<T>>;
    add(name: string, data: T, opts?: JobOptions): Promise<Job<T>>;
    
    process(processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
    process(concurrency: number, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
    process(name: string, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
    process(name: string, concurrency: number, processor: ProcessPromiseFunction<T> | ProcessCallbackFunction<T>): void;
    
    pause(isLocal?: boolean): Promise<void>;
    resume(isLocal?: boolean): Promise<void>;
    isPaused(isLocal?: boolean): Promise<boolean>;
    
    count(): Promise<number>;
    empty(): Promise<void>;
    close(): Promise<void>;

    getWaitingCount(): Promise<number>;
    getActiveCount(): Promise<number>;
    getCompletedCount(): Promise<number>;
    getFailedCount(): Promise<number>;
    getDelayedCount(): Promise<number>;
    getPausedCount(): Promise<number>;
    
    getJob(jobId: string | number): Promise<Job<T> | null>;
    getJobs(types: string[], start?: number, end?: number, asc?: boolean): Promise<Job<T>[]>;
    getJobCounts(): Promise<JobCounts>;
    getJobLogs(jobId: string, start?: number, end?: number): Promise<{ logs: string[]; count: number }>;
    
    getRepeatableJobs(start?: number, end?: number, asc?: boolean): Promise<RepeatableJob[]>;
    removeRepeatableByKey(key: string): Promise<void>;
    
    clean(grace: number, status?: JobStatusClean, limit?: number): Promise<Job<T>[]>;
    obliterate(opts?: { force?: boolean }): Promise<void>;
    
    on(event: 'error', callback: (error: Error) => void): this;
    on(event: 'waiting', callback: (jobId: string) => void): this;
    on(event: 'active', callback: (job: Job<T>, prev: string) => void): this;
    on(event: 'stalled', callback: (job: Job<T>) => void): this;
    on(event: 'progress', callback: (job: Job<T>, progress: number | object) => void): this;
    on(event: 'completed', callback: (job: Job<T>, result: unknown) => void): this;
    on(event: 'failed', callback: (job: Job<T>, err: Error) => void): this;
    on(event: 'paused', callback: () => void): this;
    on(event: 'resumed', callback: () => void): this;
    on(event: 'cleaned', callback: (jobs: Job<T>[], status: JobStatus) => void): this;
    on(event: 'drained', callback: () => void): this;
    on(event: 'removed', callback: (job: Job<T>) => void): this;
  }

  export type ProcessPromiseFunction<T> = (job: Job<T>) => Promise<unknown>;
  export type ProcessCallbackFunction<T> = (job: Job<T>, done: DoneCallback) => void;
  export type DoneCallback = (err?: Error | null, result?: unknown) => void;
  
  export type JobStatus = 'completed' | 'waiting' | 'active' | 'delayed' | 'failed' | 'paused';
  export type JobStatusClean = 'completed' | 'wait' | 'active' | 'delayed' | 'failed' | 'paused';

  export interface JobCounts {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }

  export interface RepeatableJob {
    key: string;
    name: string;
    id?: string;
    endDate?: number;
    tz?: string;
    cron?: string;
    every?: number;
    next: number;
  }

  export default class Queue<T = unknown> {
    constructor(queueName: string, opts?: QueueOptions);
    constructor(queueName: string, url: string, opts?: QueueOptions);
  }
}
