import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * @class EmailJobDataDto
 * @description DTO para datos de job de email
 */
export class EmailJobDataDto {
  @ApiProperty({
    description: 'Email destinatario',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  to: string;

  @ApiProperty({
    description: 'Asunto del email',
    example: 'Welcome to our platform',
  })
  @IsString({ message: 'El asunto debe ser un string' })
  @IsNotEmpty({ message: 'El asunto es requerido' })
  @MinLength(3, { message: 'El asunto debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El asunto no puede tener más de 200 caracteres' })
  subject: string;

  @ApiProperty({
    description: 'Contenido del email (HTML o texto plano)',
    example: '<h1>Welcome!</h1><p>Thanks for joining us.</p>',
  })
  @IsString({ message: 'El contenido debe ser un string' })
  @IsNotEmpty({ message: 'El contenido es requerido' })
  @MinLength(10, { message: 'El contenido debe tener al menos 10 caracteres' })
  content: string;

  @ApiPropertyOptional({
    description: 'Datos adicionales del template',
    example: { userName: 'John Doe', activationUrl: 'https://example.com/activate' },
  })
  @IsOptional()
  @IsObject({ message: 'Los datos adicionales deben ser un objeto' })
  templateData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Email para responder (Reply-To)',
    example: 'support@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email de respuesta inválido' })
  replyTo?: string;

  @ApiPropertyOptional({
    description: 'Emails en copia (CC)',
    example: ['manager@example.com'],
  })
  @IsOptional()
  cc?: string[];

  @ApiPropertyOptional({
    description: 'Emails en copia oculta (BCC)',
    example: ['admin@example.com'],
  })
  @IsOptional()
  bcc?: string[];
}

/**
 * @class NotificationJobDataDto
 * @description DTO para datos de job de notificación
 */
export class NotificationJobDataDto {
  @ApiProperty({
    description: 'Tipo de notificación',
    example: 'user_registered',
  })
  @IsString({ message: 'El tipo debe ser un string' })
  @IsNotEmpty({ message: 'El tipo es requerido' })
  type: string;

  @ApiProperty({
    description: 'ID del destinatario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'El ID del destinatario debe ser un string' })
  @IsNotEmpty({ message: 'El ID del destinatario es requerido' })
  recipientId: string;

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Welcome to our platform!',
  })
  @IsString({ message: 'El título debe ser un string' })
  @IsNotEmpty({ message: 'El título es requerido' })
  @MaxLength(100, { message: 'El título no puede tener más de 100 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Mensaje de la notificación',
    example: 'Your account has been created successfully.',
  })
  @IsString({ message: 'El mensaje debe ser un string' })
  @IsNotEmpty({ message: 'El mensaje es requerido' })
  @MaxLength(500, { message: 'El mensaje no puede tener más de 500 caracteres' })
  message: string;

  @ApiPropertyOptional({
    description: 'Datos adicionales de la notificación',
    example: { userId: '123', action: 'view_profile' },
  })
  @IsOptional()
  @IsObject({ message: 'Los datos adicionales deben ser un objeto' })
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Canales para enviar',
    example: ['email', 'push'],
  })
  @IsOptional()
  channels?: string[];
}

/**
 * @class ReportJobDataDto
 * @description DTO para datos de job de generación de reportes
 */
export class ReportJobDataDto {
  @ApiProperty({
    description: 'Tipo de reporte',
    example: 'monthly_sales',
  })
  @IsString({ message: 'El tipo debe ser un string' })
  @IsNotEmpty({ message: 'El tipo es requerido' })
  reportType: string;

  @ApiProperty({
    description: 'ID del usuario que solicitó el reporte',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'El ID del usuario debe ser un string' })
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  userId: string;

  @ApiProperty({
    description: 'Parámetros del reporte',
    example: { startDate: '2025-01-01', endDate: '2025-01-31', format: 'pdf' },
  })
  @IsObject({ message: 'Los parámetros deben ser un objeto' })
  @IsNotEmpty({ message: 'Los parámetros son requeridos' })
  parameters: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Email para enviar el reporte',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  emailTo?: string;

  @ApiPropertyOptional({
    description: 'Formato del reporte',
    example: 'pdf',
  })
  @IsOptional()
  @IsString({ message: 'El formato debe ser un string' })
  format?: string;
}
