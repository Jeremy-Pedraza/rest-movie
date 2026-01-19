import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationJobDataDto } from '../dto';
import { JOB_NAMES, QUEUE_NAMES } from '../queue.constants';

/**
 * @class NotificationProcessor
 * @description Processor para jobs de notificaciones
 *
 * Procesa jobs de la cola 'notification-queue' con concurrencia de 10 jobs en paralelo
 *
 * Tipos de jobs soportados:
 * - send-notification: Envío de notificación individual
 * - send-notification-multi: Envío multi-canal (email + push + sms)
 * - send-notification-batch: Envío de notificaciones en lote
 */
@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  /**
   * Procesar job de envío de notificación individual
   * @param job Job de Bull con datos de notificación
   * @returns Resultado del envío
   */
  @Process(JOB_NAMES.NOTIFICATION.SEND)
  async processSendNotification(job: Job<NotificationJobDataDto>): Promise<any> {
    this.logger.log(
      `🔔 [${job.id}] Iniciando envío de notificación '${job.data.type}' a usuario ${job.data.recipientId}`,
    );

    try {
      // Progreso 10%
      await job.updateProgress(10);
      this.logger.debug(`🔔 [${job.id}] Validando destinatario...`);

      // Simular validación de destinatario (500ms)
      await this.delay(500);
      await job.updateProgress(30);

      // Simular preparación de notificación (1 segundo)
      this.logger.debug(`🔔 [${job.id}] Preparando notificación...`);
      await this.delay(1000);
      await job.updateProgress(60);

      // Simular envío (1 segundo)
      this.logger.debug(`🔔 [${job.id}] Enviando notificación...`);
      await this.delay(1000);
      await job.updateProgress(100);

      const result = {
        success: true,
        notificationId: `notif-${Date.now()}`,
        type: job.data.type,
        recipientId: job.data.recipientId,
        title: job.data.title,
        sentAt: new Date().toISOString(),
      };

      this.logger.log(`✅ [${job.id}] Notificación '${job.data.type}' enviada exitosamente`);

      return result;
    } catch (error) {
      this.logger.error(
        `❌ [${job.id}] Error al enviar notificación: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Procesar job de envío multi-canal
   * @param job Job con datos de notificación multi-canal
   * @returns Resultado del envío por cada canal
   */
  @Process(JOB_NAMES.NOTIFICATION.SEND_MULTI)
  async processSendNotificationMulti(
    job: Job<NotificationJobDataDto & { channels: string[] }>,
  ): Promise<any> {
    const channels = job.data.channels || ['email', 'push'];
    this.logger.log(
      `🔔 [${job.id}] Iniciando envío multi-canal (${channels.join(', ')}) a usuario ${job.data.recipientId}`,
    );

    try {
      const results: any = {};
      let processed = 0;
      const totalChannels = channels.length;

      for (const channel of channels) {
        this.logger.debug(
          `🔔 [${job.id}] Enviando por canal '${channel}' (${processed + 1}/${totalChannels})`,
        );

        // Simular envío por canal (1 segundo por canal)
        await this.delay(1000);

        results[channel] = {
          success: true,
          sentAt: new Date().toISOString(),
          messageId: `${channel}-${Date.now()}`,
        };

        processed++;
        const progress = Math.floor((processed / totalChannels) * 100);
        await job.updateProgress(progress);
      }

      this.logger.log(
        `✅ [${job.id}] Notificación multi-canal enviada exitosamente por ${processed} canales`,
      );

      return {
        success: true,
        notificationId: `multi-${Date.now()}`,
        type: job.data.type,
        recipientId: job.data.recipientId,
        channels: results,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `❌ [${job.id}] Error al enviar notificación multi-canal: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Procesar job de envío de notificaciones en lote
   * @param job Job con array de notificaciones
   * @returns Resultado del envío batch
   */
  @Process(JOB_NAMES.NOTIFICATION.SEND_BATCH)
  async processSendNotificationBatch(
    job: Job<{ notifications: NotificationJobDataDto[] }>,
  ): Promise<any> {
    const totalNotifications = job.data.notifications.length;
    this.logger.log(`🔔 [${job.id}] Iniciando envío de lote: ${totalNotifications} notificaciones`);

    try {
      const results = [];
      let processed = 0;

      for (const notificationData of job.data.notifications) {
        this.logger.debug(
          `🔔 [${job.id}] Enviando notificación ${processed + 1}/${totalNotifications} a usuario ${notificationData.recipientId}`,
        );

        // Simular envío individual (500ms por notificación)
        await this.delay(500);

        results.push({
          success: true,
          recipientId: notificationData.recipientId,
          type: notificationData.type,
          notificationId: `notif-${Date.now()}-${processed}`,
        });

        processed++;
        const progress = Math.floor((processed / totalNotifications) * 100);
        await job.updateProgress(progress);
      }

      this.logger.log(
        `✅ [${job.id}] Lote completado: ${processed}/${totalNotifications} notificaciones enviadas`,
      );

      return {
        totalNotifications,
        successful: results.length,
        failed: 0,
        results,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `❌ [${job.id}] Error al enviar lote de notificaciones: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Helper: Simular delay
   * @param ms Milisegundos a esperar
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
