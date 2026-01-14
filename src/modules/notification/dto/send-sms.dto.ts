/**
 * @fileoverview DTO para envío de SMS
 * @module modules/notification/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsPhoneNumber,
  MaxLength,
  MinLength,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';

/**
 * Enum de tipos de SMS
 */
export enum SmsType {
  TRANSACTIONAL = 'transactional', // SMS transaccionales (OTP, confirmaciones)
  PROMOTIONAL = 'promotional', // SMS promocionales (marketing)
  ALERT = 'alert', // SMS de alertas/urgentes
}

/**
 * DTO para envío de SMS
 */
export class SendSmsDto {
  @ApiProperty({
    description: 'Número(s) de teléfono del destinatario (formato E.164)',
    type: [String],
    example: ['+573001234567'],
  })
  @IsArray({ message: 'Los destinatarios deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe haber al menos un destinatario' })
  @IsPhoneNumber(undefined, {
    each: true,
    message: 'Cada destinatario debe ser un número de teléfono válido (formato E.164)',
  })
  @IsNotEmpty({ message: 'Los destinatarios son requeridos' })
  to: string[];

  @ApiProperty({
    description: 'Mensaje del SMS',
    example: 'Tu código de verificación es: 123456',
    minLength: 1,
    maxLength: 1600, // Límite estándar para SMS (máximo 10 SMS concatenados de 160 caracteres)
  })
  @IsString({ message: 'El mensaje debe ser un string' })
  @MinLength(1, { message: 'El mensaje debe tener al menos 1 carácter' })
  @MaxLength(1600, { message: 'El mensaje no puede exceder 1600 caracteres' })
  @IsNotEmpty({ message: 'El mensaje es requerido' })
  message: string;

  @ApiPropertyOptional({
    description: 'Tipo de SMS',
    enum: SmsType,
    default: SmsType.TRANSACTIONAL,
    example: SmsType.TRANSACTIONAL,
  })
  @IsOptional()
  @IsEnum(SmsType, {
    message: 'Tipo de SMS inválido. Debe ser: transactional, promotional o alert',
  })
  type?: SmsType = SmsType.TRANSACTIONAL;

  @ApiPropertyOptional({
    description: 'Número de teléfono remitente (si el proveedor lo permite)',
    example: '+573009876543',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message: 'El número remitente debe ser un teléfono válido (formato E.164)',
  })
  from?: string;

  @ApiPropertyOptional({
    description: 'ID de campaña o categoría (para tracking)',
    example: 'registration-otp',
  })
  @IsOptional()
  @IsString({ message: 'El campaignId debe ser un string' })
  campaignId?: string;

  @ApiPropertyOptional({
    description: 'URL de callback para recibir estado de entrega',
    example: 'https://api.example.com/webhooks/sms-status',
  })
  @IsOptional()
  @IsString({ message: 'La URL de callback debe ser un string' })
  callbackUrl?: string;

  @ApiPropertyOptional({
    description: 'Tiempo de validez del mensaje (en segundos)',
    example: 300, // 5 minutos
  })
  @IsOptional()
  validityPeriod?: number;

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
