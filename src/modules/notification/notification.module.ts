/**
 * @fileoverview Módulo de Notificaciones
 * @module modules/notification
 *
 * Este módulo gestiona el envío de notificaciones multi-canal:
 * - Email (Nodemailer)
 * - SMS (Twilio)
 * - Push Notifications (Firebase Cloud Messaging)
 *
 * Características:
 * - Envío síncrono y asíncrono (mediante colas)
 * - Templates reutilizables
 * - Retry automático con backoff exponencial
 * - Rate limiting por canal
 * - Tracking y estadísticas
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

// Shared modules
import { CommonModule } from '@shared/common';

// Channels
import { EmailChannel, SmsChannel, PushChannel } from './channels';

// Service
import { NotificationService } from './notification.service';

// Controller
import { NotificationController } from './notification.controller';

// Queue
import { NotificationProcessor } from './processors/notification.processor';
import { NotificationProducer } from './producers/notification.producer';
import { NOTIFICATION_QUEUE_CONFIG } from './queues/notification.queue';

@Module({
  imports: [
    ConfigModule, // Para acceder a variables de entorno
    CommonModule, // SanitizerService, HandleErrorService
    // Bull Queue
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_CONFIG.name,
      redis: NOTIFICATION_QUEUE_CONFIG.redis,
      defaultJobOptions: NOTIFICATION_QUEUE_CONFIG.defaultJobOptions,
      limiter: NOTIFICATION_QUEUE_CONFIG.limiter,
      settings: NOTIFICATION_QUEUE_CONFIG.settings,
    }),
  ],
  controllers: [
    NotificationController, // ✅ Registrado
  ],
  providers: [
    // Canales de notificación
    EmailChannel,
    SmsChannel,
    PushChannel,
    // Service
    NotificationService, // ✅ Registrado
    // Queue
    NotificationProcessor, // ✅ Registrado
    NotificationProducer,  // ✅ Registrado
  ],
  exports: [
    // Canales (para uso directo si se necesita)
    EmailChannel,
    SmsChannel,
    PushChannel,
    // Service (para uso en otros módulos)
    NotificationService, // ✅ Exportado
    // Producer (para encolar jobs desde otros módulos)
    NotificationProducer,  // ✅ Exportado
  ],
})
export class NotificationModule {}
