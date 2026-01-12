/**
 * @fileoverview DTO base para envío de notificaciones multi-canal
 * @module modules/notification/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEnum,
  IsObject,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum de canales de notificación disponibles
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

/**
 * Enum de prioridades de notificación
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * DTO para destinatarios de notificación
 */
export class RecipientDto {
  @ApiPropertyOptional({
    description: 'Email del destinatario',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString({ message: 'El email debe ser un string' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono del destinatario',
    example: '+573001234567',
  })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un string' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Token de push notification',
    example: 'fcm_token_abc123',
  })
  @IsOptional()
  @IsString({ message: 'El token debe ser un string' })
  pushToken?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario en el sistema',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString({ message: 'El userId debe ser un string' })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del destinatario',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un string' })
  name?: string;
}

/**
 * DTO base para envío de notificaciones multi-canal
 */
export class SendNotificationDto {
  @ApiProperty({
    description: 'Canales por los que enviar la notificación',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.EMAIL, NotificationChannel.SMS],
  })
  @IsArray({ message: 'Los canales deben ser un array' })
  @IsEnum(NotificationChannel, {
    each: true,
    message: 'Canal inválido. Debe ser: email, sms o push',
  })
  @IsNotEmpty({ message: 'Los canales son requeridos' })
  channels: NotificationChannel[];

  @ApiProperty({
    description: 'Destinatarios de la notificación',
    type: [RecipientDto],
    example: [
      {
        email: 'user@example.com',
        phone: '+573001234567',
        name: 'Juan Pérez',
      },
    ],
  })
  @IsArray({ message: 'Los destinatarios deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => RecipientDto)
  @IsNotEmpty({ message: 'Los destinatarios son requeridos' })
  recipients: RecipientDto[];

  @ApiProperty({
    description: 'Asunto de la notificación',
    example: 'Bienvenido a la plataforma',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'El asunto debe ser un string' })
  @MinLength(3, { message: 'El asunto debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El asunto no puede exceder 200 caracteres' })
  @IsNotEmpty({ message: 'El asunto es requerido' })
  subject: string;

  @ApiProperty({
    description: 'Mensaje de la notificación',
    example: 'Gracias por registrarte en nuestra plataforma',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString({ message: 'El mensaje debe ser un string' })
  @MinLength(10, { message: 'El mensaje debe tener al menos 10 caracteres' })
  @MaxLength(5000, { message: 'El mensaje no puede exceder 5000 caracteres' })
  @IsNotEmpty({ message: 'El mensaje es requerido' })
  message: string;

  @ApiPropertyOptional({
    description: 'Prioridad de la notificación',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
    example: NotificationPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(NotificationPriority, {
    message: 'Prioridad inválida. Debe ser: low, normal, high o urgent',
  })
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @ApiPropertyOptional({
    description: 'Nombre del template a usar (opcional)',
    example: 'welcome-email',
  })
  @IsOptional()
  @IsString({ message: 'El template debe ser un string' })
  template?: string;

  @ApiPropertyOptional({
    description: 'Datos adicionales para el template o personalización',
    example: { userName: 'Juan', activationLink: 'https://...' },
  })
  @IsOptional()
  @IsObject({ message: 'Los datos deben ser un objeto' })
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Enviar de forma asíncrona (mediante cola)',
    default: false,
    example: true,
  })
  @IsOptional()
  async?: boolean = false;

  @ApiPropertyOptional({
    description: 'Tiempo de programación para envío diferido (ISO 8601)',
    example: '2025-01-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsString({ message: 'scheduledAt debe ser un string' })
  scheduledAt?: string;
}
