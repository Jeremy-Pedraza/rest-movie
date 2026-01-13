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
 *
 * @requires ScheduleModule - Ya registrado globalmente en app.module.ts
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Módulos requeridos para los jobs
import { AuthModule } from '@modules/auth';
import { LoggerModule } from '@modules/logger';
import { UserModule } from '@modules/user';
import { CacheModule } from '@modules/cache';

// Controller y Service
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

// Jobs
import {
  CleanupJob,
  BackupJob,
  SessionCleanupJob,
  LogCleanupJob,
  CacheWarmupJob,
} from './jobs';

@Module({
  imports: [
    ConfigModule,
    // Módulos necesarios para los jobs
    AuthModule,      // Para SessionCleanupJob y CacheWarmupJob
    LoggerModule,    // Para LogCleanupJob
    UserModule,      // Para CacheWarmupJob
    CacheModule,     // Para CacheWarmupJob
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
  ],
  exports: [
    TasksService,
    // Exportar jobs por si se necesitan ejecutar desde otros módulos
    CleanupJob,
    BackupJob,
    SessionCleanupJob,
    LogCleanupJob,
    CacheWarmupJob,
  ],
})
export class TasksModule {}
