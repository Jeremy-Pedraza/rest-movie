/**
 * @fileoverview Controller para gestión de notificaciones
 * @module modules/notification
 *
 * ⚠️ REGLAS:
 * - NO usar try-catch (AllExceptionsFilter lo maneja)
 * - SIEMPRE usar decoradores Swagger
 * - SIEMPRE retornar IApiResponse<T> con message personalizado
 * - NO usamos TransformInterceptor global (controllers formatean manualmente)
 */

import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Decoradores globales
import { Public } from '@decorators/public.decorator';
import { Roles } from '@decorators/roles.decorator';

// Constants
import { ROLES } from '@constants/roles.constant';

// Shared interfaces
import { IApiResponse } from '@shared/common';

// Local imports
import {
  NotificationChannel,
  SendEmailDto,
  SendNotificationDto,
  SendPushDto,
  SendSmsDto,
} from './dto';
import { IEmailResponse, IMultiChannelResponse, IPushResponse, ISmsResponse } from './interfaces';
import { NotificationService } from './notification.service';

/**
 * Controller para gestión de notificaciones multi-canal
 *
 * Endpoints:
 * - POST /notifications/email - Enviar email
 * - POST /notifications/sms - Enviar SMS
 * - POST /notifications/push - Enviar push notification
 * - POST /notifications/multi - Enviar por múltiples canales
 * - GET /notifications/channels - Ver canales disponibles
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // ============================================
  // ENVÍO POR CANAL INDIVIDUAL
  // ============================================

  /**
   * Enviar notificación por email
   */
  @Post('email')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar notificación por email',
    description: 'Envía un email a uno o más destinatarios con soporte para HTML, adjuntos, CC/BCC',
  })
  @ApiResponse({
    status: 200,
    description: 'Email enviado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al enviar email',
  })
  async sendEmail(@Body() dto: SendEmailDto): Promise<IApiResponse<IEmailResponse>> {
    const data = await this.notificationService.sendEmail(dto);
    return {
      success: true,
      message: `Email enviado exitosamente a ${dto.to.length} destinatario(s)`,
      data,
    };
  }

  /**
   * Enviar notificación por SMS
   */
  @Post('sms')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar notificación por SMS',
    description: 'Envía un SMS a uno o más números de teléfono (formato E.164)',
  })
  @ApiResponse({
    status: 200,
    description: 'SMS enviado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al enviar SMS',
  })
  async sendSms(@Body() dto: SendSmsDto): Promise<IApiResponse<ISmsResponse>> {
    const data = await this.notificationService.sendSms(dto);
    return {
      success: true,
      message: `SMS enviado exitosamente a ${dto.to.length} destinatario(s)`,
      data,
    };
  }

  /**
   * Enviar push notification
   */
  @Post('push')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar push notification',
    description: 'Envía una push notification a uno o más tokens de dispositivos (FCM)',
  })
  @ApiResponse({
    status: 200,
    description: 'Push notification enviada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al enviar push notification',
  })
  async sendPush(@Body() dto: SendPushDto): Promise<IApiResponse<IPushResponse>> {
    const data = await this.notificationService.sendPush(dto);
    return {
      success: true,
      message: `Push notification enviada a ${dto.tokens.length} dispositivo(s)`,
      data,
    };
  }

  // ============================================
  // ENVÍO MULTI-CANAL
  // ============================================

  /**
   * Enviar notificación por múltiples canales
   */
  @Post('multi')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar notificación por múltiples canales',
    description: 'Envía una notificación por uno o más canales simultáneamente (email, SMS, push)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación enviada',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos',
  })
  @ApiResponse({
    status: 500,
    description: 'Error al enviar notificación',
  })
  async sendMultiChannel(
    @Body() dto: SendNotificationDto,
  ): Promise<IApiResponse<IMultiChannelResponse>> {
    const data = await this.notificationService.sendMultiChannel(dto);

    const successCount = data.successfulChannels.length;
    const failedCount = data.failedChannels.length;
    const totalChannels = dto.channels.length;

    let message = `Notificación procesada: ${successCount} de ${totalChannels} canales exitosos`;
    if (failedCount > 0) {
      message += ` (${failedCount} fallidos: ${data.failedChannels.join(', ')})`;
    }

    return {
      success: data.success,
      message,
      data,
    };
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtener estado de canales disponibles
   */
  @Get('channels')
  @Public() // Público para que cualquiera pueda verificar canales disponibles
  @ApiOperation({
    summary: 'Obtener estado de canales disponibles',
    description: 'Verifica qué canales de notificación están configurados y disponibles',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de canales obtenido',
  })
  async getChannelsStatus(): Promise<IApiResponse<Record<string, boolean>>> {
    const data = await this.notificationService.getChannelsStatus();
    return {
      success: true,
      message: 'Estado de canales obtenido exitosamente',
      data,
    };
  }

  /**
   * Verificar disponibilidad de un canal específico
   */
  @Get('channels/check')
  @Public()
  @ApiOperation({
    summary: 'Verificar disponibilidad de un canal específico',
    description: 'Verifica si un canal específico está configurado y disponible',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
  })
  @ApiResponse({
    status: 400,
    description: 'Canal inválido',
  })
  async checkChannel(
    @Query('channel') channel: string,
  ): Promise<IApiResponse<{ channel: string; available: boolean }>> {
    const available = await this.notificationService.isChannelAvailable(
      channel as NotificationChannel,
    );

    return {
      success: true,
      message: available
        ? `Canal ${channel} está disponible`
        : `Canal ${channel} no está disponible`,
      data: {
        channel,
        available,
      },
    };
  }
}
