// src/modules/logger/entities/log.entity.ts

/**
 * @fileoverview Entidad para logs persistentes
 * @module modules/logger/entities
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Niveles de log
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Contextos de log
 */
export enum LogContext {
  HTTP = 'http',
  DATABASE = 'database',
  AUTH = 'auth',
  BUSINESS = 'business',
  SYSTEM = 'system',
  QUEUE = 'queue',
  CACHE = 'cache',
  EXTERNAL = 'external',
}

@Entity({ name: 'logs', schema: 'public' })
@Index(['level', 'createdAt'])
@Index(['context', 'createdAt'])
@Index(['userId', 'createdAt'])
@Index(['requestId'])
export class LogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nivel de log
   */
  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  @Index()
  level: LogLevel;

  /**
   * Contexto/módulo que genera el log
   */
  @Column({
    type: 'enum',
    enum: LogContext,
    default: LogContext.SYSTEM,
  })
  context: LogContext;

  /**
   * Mensaje principal del log
   */
  @Column({ type: 'text' })
  message: string;

  /**
   * Datos adicionales estructurados
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /**
   * Stack trace (para errores)
   */
  @Column({ type: 'text', nullable: true })
  stack: string | null;

  /**
   * ID de la petición HTTP (correlación)
   */
  @Column({ type: 'uuid', nullable: true })
  requestId: string | null;

  /**
   * ID del usuario (si está autenticado)
   */
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /**
   * IP del cliente
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  /**
   * User Agent del cliente
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  /**
   * Método HTTP
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  /**
   * URL de la petición
   */
  @Column({ type: 'varchar', length: 2048, nullable: true })
  url: string | null;

  /**
   * Código de estado HTTP
   */
  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  /**
   * Tiempo de respuesta en ms
   */
  @Column({ type: 'int', nullable: true })
  responseTime: number | null;

  /**
   * Nombre del servicio/clase que genera el log
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  service: string | null;

  /**
   * Nombre de la acción/método
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  action: string | null;

  /**
   * Código de error (si aplica)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  errorCode: string | null;

  /**
   * Fecha de creación
   */
  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;
}
