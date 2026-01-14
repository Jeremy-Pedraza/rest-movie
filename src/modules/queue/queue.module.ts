import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from '@shared/common/common.module';
import { EmailProcessor, NotificationProcessor, ReportProcessor } from './processors';
import { EmailProducer, NotificationProducer, ReportProducer } from './producers';
import { QUEUE_NAMES, QUEUE_RATE_LIMITS, STALLED_JOB_CONFIG } from './queue.constants';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

/**
 * @module QueueModule
 * @description Módulo central de gestión de colas con Bull
 *
 * Características:
 * - 3 colas configuradas (email, notification, report)
 * - 3 processors con concurrencia configurada
 * - 3 producers exportados para uso en otros módulos
 * - 1 service centralizado con 16 métodos
 * - 1 controller con 15 endpoints REST
 * - Rate limiting por cola
 * - Configuración de jobs estancados
 * - Health checks integrados
 *
 * Uso en otros módulos:
 * ```typescript
 * import { QueueModule } from '@modules/queue';
 * import { EmailProducer } from '@modules/queue';
 *
 * @Module({
 *   imports: [QueueModule],
 * })
 * export class MiModule {
 *   constructor(private readonly emailProducer: EmailProducer) {}
 * }
 * ```
 */
@Module({
  imports: [
    // Importar ConfigModule para variables de entorno
    ConfigModule,

    // Importar CommonModule para SanitizerService y HandleErrorService
    CommonModule,

    // Registrar cola de emails
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.EMAIL,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host:
            configService.get('BULL_REDIS_HOST') || configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('BULL_REDIS_PORT') || configService.get('REDIS_PORT') || 6379,
          password: configService.get('BULL_REDIS_PASSWORD') || configService.get('REDIS_PASSWORD'),
          db: configService.get('BULL_REDIS_DB') || 0,
        },
        limiter: QUEUE_RATE_LIMITS.EMAIL,
        settings: {
          stalledInterval: STALLED_JOB_CONFIG.interval,
          maxStalledCount: STALLED_JOB_CONFIG.maxCount,
        },
      }),
      inject: [ConfigService],
    }),

    // Registrar cola de notificaciones
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.NOTIFICATION,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host:
            configService.get('BULL_REDIS_HOST') || configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('BULL_REDIS_PORT') || configService.get('REDIS_PORT') || 6379,
          password: configService.get('BULL_REDIS_PASSWORD') || configService.get('REDIS_PASSWORD'),
          db: configService.get('BULL_REDIS_DB') || 0,
        },
        limiter: QUEUE_RATE_LIMITS.NOTIFICATION,
        settings: {
          stalledInterval: STALLED_JOB_CONFIG.interval,
          maxStalledCount: STALLED_JOB_CONFIG.maxCount,
        },
      }),
      inject: [ConfigService],
    }),

    // Registrar cola de reportes
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.REPORT,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host:
            configService.get('BULL_REDIS_HOST') || configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('BULL_REDIS_PORT') || configService.get('REDIS_PORT') || 6379,
          password: configService.get('BULL_REDIS_PASSWORD') || configService.get('REDIS_PASSWORD'),
          db: configService.get('BULL_REDIS_DB') || 0,
        },
        limiter: QUEUE_RATE_LIMITS.REPORT,
        settings: {
          stalledInterval: STALLED_JOB_CONFIG.interval,
          maxStalledCount: STALLED_JOB_CONFIG.maxCount,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [QueueController],
  providers: [
    // Service principal
    QueueService,

    // Processors (procesadores de jobs)
    EmailProcessor,
    NotificationProcessor,
    ReportProcessor,

    // Producers (encoladores de jobs)
    EmailProducer,
    NotificationProducer,
    ReportProducer,
  ],
  exports: [
    // Exportar producers para uso en otros módulos
    EmailProducer,
    NotificationProducer,
    ReportProducer,

    // Exportar service para gestión avanzada
    QueueService,
  ],
})
export class QueueModule {}
