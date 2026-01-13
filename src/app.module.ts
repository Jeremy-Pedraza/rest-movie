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
import { CacheModule as CustomCacheModule } from '@modules/cache';
import { QueueModule } from '@modules/queue';
import { TasksModule } from '@modules/tasks';

// Global Interceptors & Filters
import { LoggingInterceptor } from '@interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@interceptors/timeout.interceptor';
import { AllExceptionsFilter } from '@filters/all-exceptions.filter';

// Global Guards
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';

// Middlewares
import { RequestIdMiddleware, LoggerMiddleware } from '@middleware/index';

// Configurations
import appConfig from '@config/app.config';
import { databaseConfig, typeOrmAsyncConfig } from '@config/database';
import { redisConfig, redisCacheAsyncConfig } from '@config/redis';
import { jwtConfig, throttlerConfig } from '@config/security';
import { bullConfig } from '@config/bull';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
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
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
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
        },
        defaultJobOptions: configService.get('bull.defaultJobOptions'),
      }),
    }),

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
    CustomCacheModule, // Cache inteligente con tags
    QueueModule, // Sistema de colas genérico (email, notification, report)
    TasksModule, // Tareas programadas (cleanup, backup, session-cleanup, etc.)
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Global Exception Filter (orden importa: filters primero)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // Global Timeout Interceptor (30s default, configurable via APP_REQUEST_TIMEOUT)
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },

    // Global Throttler Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global JWT Auth Guard (autenticación)
    // Usar @Public() para rutas sin autenticación
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Roles Guard (autorización)
    // Usar @Roles() para restringir por rol
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configura los middlewares globales
   * Orden: RequestId -> Logger (Logger necesita requestId)
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*'); // Aplicar a todas las rutas
  }
}
