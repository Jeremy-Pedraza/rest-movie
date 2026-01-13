import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_NAMES, JOB_NAMES, PROCESSOR_CONCURRENCY } from '../queue.constants';
import { ReportJobDataDto } from '../dto';

/**
 * @class ReportProcessor
 * @description Processor para jobs de generación de reportes
 *
 * Procesa jobs de la cola 'report-queue' con concurrencia de 2 jobs en paralelo
 * (Menor concurrencia porque los reportes son más pesados)
 *
 * Tipos de jobs soportados:
 * - generate-report: Generación de reporte
 * - schedule-report: Programar generación de reporte
 * - export-report: Exportar reporte a formato específico
 */
@Processor({
  name: QUEUE_NAMES.REPORT,
  concurrency: PROCESSOR_CONCURRENCY.REPORT,
})
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  /**
   * Procesar job de generación de reporte
   * @param job Job de Bull con datos del reporte
   * @returns Resultado de la generación
   */
  @Process(JOB_NAMES.REPORT.GENERATE)
  async processGenerateReport(job: Job<ReportJobDataDto>): Promise<any> {
    this.logger.log(
      `📊 [${job.id}] Iniciando generación de reporte '${job.data.reportType}' para usuario ${job.data.userId}`,
    );

    try {
      // Progreso 5%
      await job.progress(5);
      this.logger.debug(`📊 [${job.id}] Validando parámetros del reporte...`);

      // Simular validación de parámetros (1 segundo)
      await this.delay(1000);
      await job.progress(10);

      // Simular consulta a base de datos (5 segundos)
      this.logger.debug(`📊 [${job.id}] Consultando datos...`);
      await this.delay(5000);
      await job.progress(40);

      // Simular procesamiento de datos (5 segundos)
      this.logger.debug(`📊 [${job.id}] Procesando datos del reporte...`);
      await this.delay(5000);
      await job.progress(70);

      // Simular generación de documento (3 segundos)
      this.logger.debug(`📊 [${job.id}] Generando documento...`);
      await this.delay(3000);
      await job.progress(90);

      // Simular guardado y envío (2 segundos)
      this.logger.debug(`📊 [${job.id}] Guardando y enviando reporte...`);
      await this.delay(2000);
      await job.progress(100);

      const result = {
        success: true,
        reportId: `report-${Date.now()}`,
        reportType: job.data.reportType,
        userId: job.data.userId,
        format: job.data.format || 'pdf',
        fileUrl: `https://example.com/reports/report-${Date.now()}.pdf`,
        fileSize: Math.floor(Math.random() * 5000000) + 1000000, // 1-6 MB
        generatedAt: new Date().toISOString(),
        parameters: job.data.parameters,
      };

      this.logger.log(
        `✅ [${job.id}] Reporte '${job.data.reportType}' generado exitosamente (${(result.fileSize / 1024 / 1024).toFixed(2)} MB)`,
      );

      // Si se especificó email, simular envío
      if (job.data.emailTo) {
        this.logger.log(`📧 [${job.id}] Enviando reporte por email a ${job.data.emailTo}`);
        result['emailSent'] = true;
        result['emailTo'] = job.data.emailTo;
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ [${job.id}] Error al generar reporte: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de programación de reporte
   * @param job Job con datos de programación
   * @returns Resultado de la programación
   */
  @Process(JOB_NAMES.REPORT.SCHEDULE)
  async processScheduleReport(
    job: Job<ReportJobDataDto & { schedule: string; frequency: string }>,
  ): Promise<any> {
    this.logger.log(
      `📊 [${job.id}] Programando reporte '${job.data.reportType}' con frecuencia ${job.data.frequency}`,
    );

    try {
      // Progreso 10%
      await job.progress(10);
      this.logger.debug(`📊 [${job.id}] Validando configuración de programación...`);

      // Simular validación (1 segundo)
      await this.delay(1000);
      await job.progress(40);

      // Simular creación de schedule en sistema (2 segundos)
      this.logger.debug(`📊 [${job.id}] Creando programación en sistema...`);
      await this.delay(2000);
      await job.progress(80);

      // Simular confirmación (1 segundo)
      this.logger.debug(`📊 [${job.id}] Confirmando programación...`);
      await this.delay(1000);
      await job.progress(100);

      const result = {
        success: true,
        scheduleId: `schedule-${Date.now()}`,
        reportType: job.data.reportType,
        userId: job.data.userId,
        schedule: job.data.schedule,
        frequency: job.data.frequency,
        nextRun: this.calculateNextRun(job.data.frequency),
        createdAt: new Date().toISOString(),
      };

      this.logger.log(
        `✅ [${job.id}] Reporte '${job.data.reportType}' programado exitosamente (próxima ejecución: ${result.nextRun})`,
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ [${job.id}] Error al programar reporte: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Procesar job de exportación de reporte
   * @param job Job con datos de exportación
   * @returns Resultado de la exportación
   */
  @Process(JOB_NAMES.REPORT.EXPORT)
  async processExportReport(
    job: Job<{ reportId: string; format: string; userId: string }>,
  ): Promise<any> {
    this.logger.log(
      `📊 [${job.id}] Iniciando exportación de reporte ${job.data.reportId} a formato ${job.data.format}`,
    );

    try {
      // Progreso 10%
      await job.progress(10);
      this.logger.debug(`📊 [${job.id}] Cargando reporte original...`);

      // Simular carga de reporte (2 segundos)
      await this.delay(2000);
      await job.progress(30);

      // Simular conversión de formato (4 segundos)
      this.logger.debug(`📊 [${job.id}] Convirtiendo a formato ${job.data.format}...`);
      await this.delay(4000);
      await job.progress(70);

      // Simular optimización y guardado (2 segundos)
      this.logger.debug(`📊 [${job.id}] Optimizando y guardando...`);
      await this.delay(2000);
      await job.progress(100);

      const result = {
        success: true,
        exportId: `export-${Date.now()}`,
        reportId: job.data.reportId,
        format: job.data.format,
        fileUrl: `https://example.com/reports/export-${Date.now()}.${job.data.format}`,
        fileSize: Math.floor(Math.random() * 3000000) + 500000, // 0.5-3.5 MB
        exportedAt: new Date().toISOString(),
      };

      this.logger.log(
        `✅ [${job.id}] Reporte exportado exitosamente a ${job.data.format} (${(result.fileSize / 1024 / 1024).toFixed(2)} MB)`,
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ [${job.id}] Error al exportar reporte: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper: Calcular próxima ejecución según frecuencia
   * @param frequency Frecuencia del reporte
   * @returns Fecha de próxima ejecución
   */
  private calculateNextRun(frequency: string): string {
    const now = new Date();
    let nextRun = new Date(now);

    switch (frequency.toLowerCase()) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      default:
        nextRun.setHours(nextRun.getHours() + 1);
    }

    return nextRun.toISOString();
  }

  /**
   * Helper: Simular delay
   * @param ms Milisegundos a esperar
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
