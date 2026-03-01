// src/app.module.ts

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Shared Modules
import { CommonModule } from '@shared/common';
import { UtilsModule } from '@shared/utils';

// Feature Modules
import { HealthModule } from '@modules/health';
import { LoggerModule } from '@modules/logger';
import { GenreModule } from '@modules/genre';
import { DirectorModule } from '@modules/director';
import { ProducerModule } from '@modules/producer';
import { TypeModule } from '@modules/type';
import { MediaModule } from '@modules/media';
import { RoleModule } from '@modules/role';
import { UserModule } from '@modules/user';
import { AuthModule } from '@modules/auth';

// Global Guards
import { JwtAuthGuard } from '@guards/jwt-auth.guard';
import { RolesGuard } from '@guards/roles.guard';

// Global Interceptors & Filters
import { LoggingInterceptor } from '@interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@interceptors/timeout.interceptor';
import { ValidationExceptionFilter } from '@filters/validation-exception.filter';
import { AllExceptionsFilter } from '@filters/all-exceptions.filter';

// Middlewares
import { RequestIdMiddleware, LoggerMiddleware } from '@middleware/index';

// Configurations
import appConfig from '@config/app.config';
import { databaseConfig, typeOrmAsyncConfig } from '@config/database';
import { throttlerConfig, jwtConfig } from '@config/security';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? ['api/.env.production', '.env.production', '.env']
          : [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [appConfig, databaseConfig, throttlerConfig, jwtConfig],
      cache: true,
      expandVariables: true,
    }),

    // TypeORM Database
    TypeOrmModule.forRootAsync(typeOrmAsyncConfig),

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

    // Shared Modules (Global)
    CommonModule,
    LoggerModule,
    UtilsModule,

    // Feature Modules
    HealthModule,
    GenreModule,
    DirectorModule,
    ProducerModule,
    TypeModule,
    MediaModule,
    RoleModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // GLOBAL EXCEPTION FILTERS
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // GLOBAL INTERCEPTORS
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },

    // GLOBAL GUARDS
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('/*path');
  }
}
