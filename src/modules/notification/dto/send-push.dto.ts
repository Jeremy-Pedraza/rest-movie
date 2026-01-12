/**
 * @fileoverview DTO para envío de Push Notifications
 * @module modules/notification/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsObject,
  IsEnum,
  MaxLength,
  MinLength,
  ArrayMinSize,
  IsUrl,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * Enum de prioridades de push notification
 */
export enum PushPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * Enum de plataformas
 */
export enum PushPlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

/**
 * DTO para envío de Push Notifications
 */
export class SendPushDto {
  @ApiProperty({
    description: 'Tokens FCM de los dispositivos destinatarios',
    type: [String],
    example: ['fcm_token_abc123', 'fcm_token_xyz789'],
  })
  @IsArray({ message: 'Los tokens deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe haber al menos un token' })
  @IsString({ each: true, message: 'Cada token debe ser un string' })
  @IsNotEmpty({ message: 'Los tokens son requeridos' })
  tokens: string[];

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nueva actualización disponible',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'El título debe ser un string' })
  @MinLength(1, { message: 'El título debe tener al menos 1 carácter' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;

  @ApiProperty({
    description: 'Cuerpo de la notificación',
    example: 'Haz clic para ver los detalles',
    minLength: 1,
    maxLength: 500,
  })
  @IsString({ message: 'El cuerpo debe ser un string' })
  @MinLength(1, { message: 'El cuerpo debe tener al menos 1 carácter' })
  @MaxLength(500, { message: 'El cuerpo no puede exceder 500 caracteres' })
  @IsNotEmpty({ message: 'El cuerpo es requerido' })
  body: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen a mostrar',
    example: 'https://example.com/images/notification.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de imagen debe ser válida' })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'URL de icono personalizado',
    example: 'https://example.com/icons/custom.png',
  })
  @IsOptional()
  @IsUrl({}, { message: 'La URL de icono debe ser válida' })
  iconUrl?: string;

  @ApiPropertyOptional({
    description: 'Acción al hacer clic (deep link)',
    example: 'app://open-profile/123',
  })
  @IsOptional()
  @IsString({ message: 'La acción debe ser un string' })
  clickAction?: string;

  @ApiPropertyOptional({
    description: 'Datos adicionales (payload)',
    example: { orderId: '12345', type: 'order-update' },
  })
  @IsOptional()
  @IsObject({ message: 'Los datos deben ser un objeto' })
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Prioridad de la notificación',
    enum: PushPriority,
    default: PushPriority.NORMAL,
    example: PushPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(PushPriority, {
    message: 'Prioridad inválida. Debe ser: low, normal o high',
  })
  priority?: PushPriority = PushPriority.NORMAL;

  @ApiPropertyOptional({
    description: 'Plataforma objetivo',
    enum: PushPlatform,
    example: PushPlatform.ANDROID,
  })
  @IsOptional()
  @IsEnum(PushPlatform, {
    message: 'Plataforma inválida. Debe ser: android, ios o web',
  })
  platform?: PushPlatform;

  @ApiPropertyOptional({
    description: 'Sonido personalizado (solo iOS)',
    example: 'default',
  })
  @IsOptional()
  @IsString({ message: 'El sonido debe ser un string' })
  sound?: string;

  @ApiPropertyOptional({
    description: 'Badge count (iOS)',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El badge debe ser un número' })
  @Min(0, { message: 'El badge no puede ser negativo' })
  badge?: number;

  @ApiPropertyOptional({
    description: 'Tag de agrupación (Android)',
    example: 'order-notifications',
  })
  @IsOptional()
  @IsString({ message: 'El tag debe ser un string' })
  tag?: string;

  @ApiPropertyOptional({
    description: 'Color del icono (Android, formato hexadecimal)',
    example: '#FF0000',
  })
  @IsOptional()
  @IsString({ message: 'El color debe ser un string' })
  color?: string;

  @ApiPropertyOptional({
    description: 'Canal de notificación (Android 8+)',
    example: 'default',
  })
  @IsOptional()
  @IsString({ message: 'El canal debe ser un string' })
  channelId?: string;

  @ApiPropertyOptional({
    description: 'Tiempo de vida del mensaje (en segundos)',
    example: 3600, // 1 hora
    minimum: 0,
    maximum: 2419200, // 28 días (máximo de FCM)
  })
  @IsOptional()
  @IsNumber({}, { message: 'El TTL debe ser un número' })
  @Min(0, { message: 'El TTL no puede ser negativo' })
  @Max(2419200, { message: 'El TTL no puede exceder 28 días' })
  timeToLive?: number;

  @ApiPropertyOptional({
    description: 'Mostrar notificación aunque la app esté en foreground',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'showInForeground debe ser un booleano' })
  showInForeground?: boolean = true;

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
