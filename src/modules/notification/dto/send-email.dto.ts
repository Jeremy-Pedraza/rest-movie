/**
 * @fileoverview DTO para envío de emails
 * @module modules/notification/dto
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsEmail,
  IsEnum,
  IsObject,
  MaxLength,
  MinLength,
  ArrayMinSize,
} from 'class-validator';

/**
 * Enum de prioridades de email
 */
export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * DTO para envío de emails
 */
export class SendEmailDto {
  @ApiProperty({
    description: 'Email(s) del destinatario',
    type: [String],
    example: ['user@example.com'],
  })
  @IsArray({ message: 'Los destinatarios deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe haber al menos un destinatario' })
  @IsEmail({}, { each: true, message: 'Cada destinatario debe ser un email válido' })
  @IsNotEmpty({ message: 'Los destinatarios son requeridos' })
  to: string[];

  @ApiPropertyOptional({
    description: 'Emails en copia (CC)',
    type: [String],
    example: ['manager@example.com'],
  })
  @IsOptional()
  @IsArray({ message: 'Los CC deben ser un array' })
  @IsEmail({}, { each: true, message: 'Cada CC debe ser un email válido' })
  cc?: string[];

  @ApiPropertyOptional({
    description: 'Emails en copia oculta (BCC)',
    type: [String],
    example: ['admin@example.com'],
  })
  @IsOptional()
  @IsArray({ message: 'Los BCC deben ser un array' })
  @IsEmail({}, { each: true, message: 'Cada BCC debe ser un email válido' })
  bcc?: string[];

  @ApiPropertyOptional({
    description: 'Email de respuesta (Reply-To)',
    example: 'support@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email de respuesta debe ser válido' })
  replyTo?: string;

  @ApiProperty({
    description: 'Asunto del email',
    example: 'Bienvenido a la plataforma',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'El asunto debe ser un string' })
  @MinLength(3, { message: 'El asunto debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El asunto no puede exceder 200 caracteres' })
  @IsNotEmpty({ message: 'El asunto es requerido' })
  subject: string;

  @ApiPropertyOptional({
    description: 'Contenido del email en texto plano',
    example: 'Gracias por registrarte en nuestra plataforma',
  })
  @IsOptional()
  @IsString({ message: 'El texto debe ser un string' })
  text?: string;

  @ApiPropertyOptional({
    description: 'Contenido del email en HTML',
    example: '<h1>Bienvenido</h1><p>Gracias por registrarte</p>',
  })
  @IsOptional()
  @IsString({ message: 'El HTML debe ser un string' })
  html?: string;

  @ApiPropertyOptional({
    description: 'Nombre del template a usar',
    example: 'welcome-email',
  })
  @IsOptional()
  @IsString({ message: 'El template debe ser un string' })
  template?: string;

  @ApiPropertyOptional({
    description: 'Datos para el template',
    example: { userName: 'Juan', activationLink: 'https://...' },
  })
  @IsOptional()
  @IsObject({ message: 'Los datos deben ser un objeto' })
  templateData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Archivos adjuntos',
    type: [Object],
    example: [
      {
        filename: 'document.pdf',
        path: '/path/to/file.pdf',
      },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'Los adjuntos deben ser un array' })
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Prioridad del email',
    enum: EmailPriority,
    default: EmailPriority.NORMAL,
    example: EmailPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(EmailPriority, {
    message: 'Prioridad inválida. Debe ser: low, normal o high',
  })
  priority?: EmailPriority = EmailPriority.NORMAL;

  @ApiPropertyOptional({
    description: 'Headers personalizados',
    example: { 'X-Custom-Header': 'value' },
  })
  @IsOptional()
  @IsObject({ message: 'Los headers deben ser un objeto' })
  headers?: Record<string, string>;

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
