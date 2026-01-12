/**
 * @fileoverview Barrel export para módulo Notification
 * @module modules/notification
 */

export * from './dto';
export * from './interfaces';
export * from './channels';
export * from './templates';
export * from './processors';
export * from './producers';
export * from './queues';
export * from './notification.service';
export * from './notification.controller';
export * from './notification.module';

// Exportar también tipos de enums para facilitar su uso
export { NotificationChannel, NotificationPriority } from './dto/send-notification.dto';
export { EmailPriority } from './dto/send-email.dto';
export { SmsType } from './dto/send-sms.dto';
export { PushPriority, PushPlatform } from './dto/send-push.dto';
export { NotificationStatus } from './interfaces/notification-channel.interface';
export { NotificationEmailType } from './templates/notification-email.template';
