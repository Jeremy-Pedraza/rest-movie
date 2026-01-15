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
@Index(['level', 'created_at'])
@Index(['context', 'created_at'])
@Index(['user_id', 'created_at'])
@Index(['request_id'])
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
    name: 'level',
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
    name: 'context',
  })
  context: LogContext;

  /**
   * Mensaje principal del log
   */
  @Column({ type: 'text', name: 'message' })
  message: string;

  /**
   * Datos adicionales estructurados
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, unknown> | null;

  /**
   * Stack trace (para errores)
   */
  @Column({ type: 'text', nullable: true, name: 'stack' })
  stack: string | null;

  /**
   * ID de la petición HTTP (correlación)
   */
  @Column({ type: 'uuid', nullable: true, name: 'request_id' })
  request_id: string | null;

  /**
   * ID del usuario (si está autenticado)
   */
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  user_id: string | null;

  /**
   * IP del cliente
   */
  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip' })
  ip: string | null;

  /**
   * User Agent del cliente
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  user_agent: string | null;

  /**
   * Método HTTP
   */
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'method' })
  method: string | null;

  /**
   * URL de la petición
   */
  @Column({ type: 'varchar', length: 2048, nullable: true, name: 'url' })
  url: string | null;

  /**
   * Código de estado HTTP
   */
  @Column({ type: 'int', nullable: true, name: 'status_code' })
  status_code: number | null;

  /**
   * Tiempo de respuesta en ms
   */
  @Column({ type: 'int', nullable: true, name: 'response_time' })
  response_time: number | null;

  /**
   * Nombre del servicio/clase que genera el log
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'service' })
  service: string | null;

  /**
   * Nombre de la acción/método
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'action' })
  action: string | null;

  /**
   * Código de error (si aplica)
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  error_code: string | null;

  /**
   * Fecha de creación
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  @Index()
  created_at: Date;
}
