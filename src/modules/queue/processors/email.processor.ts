import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailJobDataDto } from '../dto';
import { JOB_NAMES, QUEUE_NAMES } from '../queue.constants';

/**
 * @class EmailProcessor
 * @description Processor para jobs de email
 *
 * Procesa jobs de la cola 'email-queue' con concurrencia de 5 jobs en paralelo
 *
 * Tipos de jobs soportados:
 * - send-email: Envío de email individual
 * - send-email-batch: Envío de emails en lote
 * - send-email-template: Envío de email con template
 */
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  /**
   * Procesar job de envío de email individual
   * @param job Job de Bull con datos de email
   * @returns Resultado del envío
   */
  @Process(JOB_NAMES.EMAIL.SEND)
  async processSendEmail(job: Job<EmailJobDataDto>): Promise<any> {
    this.logger.log(`📧 [${job.id}] Iniciando envío de email a ${job.data.to}`);

    try {
      // Progreso 10%
      await job.progress(10);
      this.logger.debug(`📧 [${job.id}] Validando datos del email...`);

      // Simular validación (1 segundo)
      await this.delay(1000);
      await job.progress(30);

      // Simular conexión SMTP (2 segundos)
      this.logger.debug(`📧 [${job.id}] Conectando al servidor SMTP...`);
      await this.delay(2000);
      await job.progress(50);

      // Simular envío (2 segundos)
      this.logger.debug(`📧 [${job.id}] Enviando email...`);
      await this.delay(2000);
      await job.progress(80);

      // Simular confirmación (1 segundo)
      this.logger.debug(`📧 [${job.id}] Confirmando envío...`);
      await this.delay(1000);
      await job.progress(100);

      const result = {
        success: true,
        messageId: `msg-${Date.now()}`,
        to: job.data.to,
        subject: job.data.subject,
        sentAt: new Date().toISOString(),
      };

      this.logger.log(`✅ [${job.id}] Email enviado exitosamente a ${job.data.to}`);

      return result;
    } catch (error) {
      this.logger.error(`❌ [${job.id}] Error al enviar email: ${error.message}`, error.stack);
      throw error; // Bull manejará el retry automáticamente
    }
  }

  /**
   * Procesar job de envío de emails en lote
   * @param job Job con array de emails
   * @returns Resultado del envío batch
   */
  @Process(JOB_NAMES.EMAIL.SEND_BATCH)
  async processSendEmailBatch(job: Job<{ emails: EmailJobDataDto[] }>): Promise<any> {
    const totalEmails = job.data.emails.length;
    this.logger.log(`📧 [${job.id}] Iniciando envío de lote: ${totalEmails} emails`);

    try {
      const results = [];
      let processed = 0;

      for (const emailData of job.data.emails) {
        this.logger.debug(
          `📧 [${job.id}] Enviando email ${processed + 1}/${totalEmails} a ${emailData.to}`,
        );

        // Simular envío individual (1 segundo por email)
        await this.delay(1000);

        results.push({
          success: true,
          to: emailData.to,
          messageId: `msg-${Date.now()}-${processed}`,
        });

        processed++;
        const progress = Math.floor((processed / totalEmails) * 100);
        await job.progress(progress);
      }

      this.logger.log(
        `✅ [${job.id}] Lote completado: ${processed}/${totalEmails} emails enviados`,
      );

      return {
        totalEmails,
        successful: results.length,
        failed: 0,
        results,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `❌ [${job.id}] Error al enviar lote de emails: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Procesar job de envío de email con template
   * @param job Job con datos de template
   * @returns Resultado del envío
   */
  @Process(JOB_NAMES.EMAIL.SEND_TEMPLATE)
  async processSendEmailTemplate(
    job: Job<EmailJobDataDto & { templateName: string }>,
  ): Promise<any> {
    this.logger.log(
      `📧 [${job.id}] Iniciando envío de email con template '${job.data.templateName}' a ${job.data.to}`,
    );

    try {
      // Progreso 10%
      await job.progress(10);
      this.logger.debug(`📧 [${job.id}] Cargando template '${job.data.templateName}'...`);

      // Simular carga de template (1 segundo)
      await this.delay(1000);
      await job.progress(30);

      // Simular renderizado de template (2 segundos)
      this.logger.debug(`📧 [${job.id}] Renderizando template con datos...`);
      await this.delay(2000);
      await job.progress(60);

      // Simular envío (2 segundos)
      this.logger.debug(`📧 [${job.id}] Enviando email...`);
      await this.delay(2000);
      await job.progress(100);

      const result = {
        success: true,
        messageId: `msg-${Date.now()}`,
        to: job.data.to,
        subject: job.data.subject,
        templateName: job.data.templateName,
        sentAt: new Date().toISOString(),
      };

      this.logger.log(
        `✅ [${job.id}] Email con template '${job.data.templateName}' enviado exitosamente`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ [${job.id}] Error al enviar email con template: ${error.message}`,
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
