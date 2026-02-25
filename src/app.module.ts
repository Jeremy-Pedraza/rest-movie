// src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Shared Modules
import { CommonModule } from '@shared/common';
import { DatabaseModule } from '@shared/database';
import { UtilsModule } from '@shared/utils';
import { RedisModule } from '@shared/redis';
import { RouterModule } from '@shared/router';

// Feature Modules
import { HealthModule } from '@modules/health';
import { LoggerModule } from '@modules/logger';
import { UserModule } from '@modules/user';
import { AuthModule } from '@modules/auth';
import { CompanyModule } from '@modules/company'; // ✅ FASE 1
import { StoreModule } from '@modules/store'; // ✅ FASE 2 AGREGADO
import { ReportsModule } from '@modules/reports'; // ✅ FASE 4 AGREGADO
import { GeographyModule } from '@modules/geography'; // ✅ Catálogo geográfico (público)
import { CacheModule as CustomCacheModule } from '@modules/cache';
import { QueueModule } from '@modules/queue';
import { TasksModule } from '@modules/tasks';
import { NotificationModule } from '@modules/notification';

// Global Interceptors & Filters
import { LoggingInterceptor } from '@interceptors/logging.interceptor';
import { TenantInterceptor } from '@interceptors/tenant.interceptor';
import { TimeoutInterceptor } from '@interceptors/timeout.interceptor';
import { ValidationExceptionFilter } from '@filters/validation-exception.filter';
import { AllExceptionsFilter } from '@filters/all-exceptions.filter';

// Global Guards
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { TenantGuard } from '@guards/tenant.guard';
import { RolesGuard } from '@guards/roles.guard';

// Middlewares
import {
  RequestIdMiddleware,
  LoggerMiddleware,
  DomainValidationMiddleware,
} from '@middleware/index';

// Configurations
import appConfig from '@config/app.config';
import { databaseConfig, typeOrmAsyncConfig } from '@config/database';
import { redisConfig, redisCacheAsyncConfig } from '@config/redis';
import { jwtConfig, throttlerConfig, SecurityConfigModule } from '@config/security';
import { bullConfig } from '@config/bull';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? [
              'api/.env.production', // Primera opción
              '.env.production', // Fallback en raiz
              '.env', // Ultimo fallback
            ]
          : [
              `.env.${process.env.NODE_ENV}`, // Ambiente específico
              '.env', // Fallback general
            ],
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, throttlerConfig, bullConfig],
      cache: true,
      expandVariables: true,
    }),

    // TypeORM Database
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),

    // Cache with Redis
    CacheModule.registerAsync(redisCacheAsyncConfig),

    // Throttler (Rate Limiting)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: (configService.get<number>('throttler.ttl') || 60) * 1000,
            limit: configService.get<number>('throttler.limit') || 10,
          },
        ],
      }),
    }),

    // Event Emitter
    // verboseMemoryLeak solo en no-producción para evitar ruido en logs productivos
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: process.env.NODE_ENV !== 'production',
      ignoreErrors: false,
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('bull.redis.host'),
          port: configService.get<number>('bull.redis.port'),
          password: configService.get<string>('bull.redis.password') || undefined,
          db: configService.get<number>('bull.redis.db') || 0,
        },
        defaultJobOptions: configService.get('bull.defaultJobOptions'),
      }),
    }),

    // ✅ Security Config Module (Global - debe estar antes de shared modules)
    SecurityConfigModule,

    // Shared Modules (Global)
    CommonModule,
    DatabaseModule,
    UtilsModule,
    RedisModule,
    RouterModule,

    // Feature Modules
    HealthModule,
    LoggerModule,
    UserModule,
    AuthModule, // JWT Strategy + Passport
    CompanyModule, // ✅ FASE 1 - Gestión de compañías
    StoreModule, // ✅ FASE 2 AGREGADO - Gestión de tiendas/sucursales
    ReportsModule, // ✅ FASE 4 AGREGADO - Sistema de reportes multi-nivel
    GeographyModule, // ✅ Catálogo geográfico (endpoints públicos)
    CustomCacheModule, // Cache inteligente con tags
    QueueModule, // Sistema de colas genérico (email, notification, report)
    TasksModule, // Tareas programadas (cleanup, backup, session-cleanup, etc.)
    NotificationModule, // ✅ Notificaciones multi-canal (email, SMS, push)
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // ============================================
    // GLOBAL EXCEPTION FILTERS (ORDEN CRÍTICO)
    // ============================================
    // El orden de ejecución es FIFO (First In, First Out)
    // Los filters más específicos deben ir primero
    //
    // Orden de ejecución:
    // 1. ValidationExceptionFilter → Captura BadRequestException (errores de validación)
    //    - Agrupa errores por campo para mejor UX en frontend
    //    - Retorna formato especial con campo "errors"
    //
    // 2. AllExceptionsFilter → Captura TODO lo demás (catchall)
    //    - HttpException (401, 403, 404, 409, etc.)
    //    - QueryFailedError (errores de PostgreSQL)
    //    - Error genérico de JavaScript
    //    - Maneja 10+ códigos de PostgreSQL

    // 1. Validation Exception Filter (Específico - BadRequestException)
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },

    // 2. All Exceptions Filter (Catchall - Todo lo demás)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // ============================================
    // GLOBAL INTERCEPTORS (ORDEN IMPORTA)
    // ============================================
    // El orden de ejecución de interceptors es:
    // 1. LoggingInterceptor  → Log entrada del request
    // 2. TenantInterceptor   → Inyecta SchemaContext para multi-tenant
    // 3. TimeoutInterceptor  → Timeout de 30s

    // 1. Global Logging Interceptor
    // Registra entrada/salida de requests
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // 2. Global Tenant Interceptor (Multi-Tenant)
    // Inyecta request.tenant en SchemaContext (AsyncLocalStorage)
    // Hace que el schema esté disponible en toda la app sin pasar parámetros
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },

    // 3. Global Timeout Interceptor
    // Timeout de 30s (configurable via APP_REQUEST_TIMEOUT)
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },

    // ============================================
    // GLOBAL GUARDS (ORDEN IMPORTA)
    // ============================================
    // El orden de ejecución de guards es crítico para el funcionamiento correcto
    // del sistema de autenticación, multi-tenant y autorización.
    //
    // Orden de ejecución:
    // 1. ThrottlerGuard    → Rate limiting (protección DDoS)
    // 2. JwtAuthGuard      → Autenticación (valida JWT, establece request.user)
    // 3. TenantGuard       → Multi-tenant (extrae tenant, establece request.tenant)
    // 4. RolesGuard        → Autorización (valida roles del usuario)

    // 1. Global Throttler Guard (Rate Limiting)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // 2. Global JWT Auth Guard (Autenticación)
    // Valida el token JWT y establece request.user
    // Usar @Public() para rutas sin autenticación
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // 3. Global Tenant Guard (Multi-Tenant)
    // Extrae información del tenant desde el usuario autenticado
    // Establece request.tenant con { schema, companyId, userId }
    // Usar @SkipTenant() para rutas que no requieren tenant
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },

    // 4. Global Roles Guard (Autorización)
    // Valida que el usuario tenga los roles requeridos
    // Usar @Roles() para restringir por rol
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configura los middlewares globales.
   *
   * Orden de ejecución:
   * 1. RequestIdMiddleware  → Genera/valida x-request-id
   * 2. LoggerMiddleware     → Registra _startTime + log DEBUG de entrada
   * 3. DomainValidationMiddleware → Valida origen contra whitelist
   *
   * NOTA: El logging principal de request/response se consolida en
   * LoggingInterceptor (APP_INTERCEPTOR). LoggerMiddleware es ligero
   * y solo registra el timestamp de entrada para medición de latencia.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, LoggerMiddleware, DomainValidationMiddleware)
      .forRoutes('/*path'); // Aplicar a todas las rutas
  }
}

