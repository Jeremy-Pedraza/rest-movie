/**
 * @fileoverview Módulo de tareas programadas
 * @module modules/tasks
 *
 * Proporciona tareas programadas automáticas para:
 * - Limpieza de datos soft-deleted
 * - Backup de tablas críticas
 * - Limpieza de sesiones expiradas
 * - Limpieza de logs antiguos
 * - Precalentamiento de cache
 * - Limpieza de Redis (Bull jobs fallidos + cache orphans)
 *
 * @requires ScheduleModule - Ya registrado globalmente en app.module.ts
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Módulos requeridos para los jobs
import { AuthModule } from '@modules/auth';
import { CacheModule } from '@modules/cache';
import { LoggerModule } from '@modules/logger';
import { QueueModule } from '@modules/queue';
import { UserModule } from '@modules/user';

// Controller y Service
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

// Jobs
import {
  BackupJob,
  CacheWarmupJob,
  CleanupJob,
  LogCleanupJob,
  RedisCleanupJob,
  SessionCleanupJob,
} from './jobs';

@Module({
  imports: [
    ConfigModule,
    // Módulos necesarios para los jobs
    AuthModule, // Para SessionCleanupJob y CacheWarmupJob
    LoggerModule, // Para LogCleanupJob
    QueueModule, // Para RedisCleanupJob
    UserModule, // Para CacheWarmupJob
    CacheModule, // Para CacheWarmupJob
  ],
  controllers: [TasksController],
  providers: [
    // Service principal
    TasksService,

    // Jobs programados (registrados automáticamente con @Cron)
    CleanupJob,
    BackupJob,
    SessionCleanupJob,
    LogCleanupJob,
    CacheWarmupJob,
    RedisCleanupJob,
  ],
  exports: [
    TasksService,
    // Exportar jobs por si se necesitan ejecutar desde otros módulos
    CleanupJob,
    BackupJob,
    SessionCleanupJob,
    LogCleanupJob,
    CacheWarmupJob,
    RedisCleanupJob,
  ],
})
export class TasksModule {}
