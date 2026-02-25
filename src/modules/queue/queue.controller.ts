import { ROLES } from '@constants/roles.constant';
import { Roles } from '@decorators/roles.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Inject,
  Optional,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse as ApiSwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LoggerService, LogContext } from '@modules/logger';
import { IApiResponse } from '@shared/common/interfaces';
import { AddJobDto, CleanJobsDto, QueryJobDto } from './dto';
import {
  IAllQueuesStatsResponse,
  ICleanJobsResponse,
  IJobDetailResponse,
  IJobResponse,
  IJobsListResponse,
  IPauseQueueResponse,
  IQueueHealthResponse,
  IQueueMetrics,
  IQueueStats,
  IRemoveJobResponse,
  IRetryJobResponse,
} from './interfaces';
import { QueueService } from './queue.service';

/**
 * @class QueueController
 * @description Controller para gestión de colas Bull
 *
 * Endpoints organizados en 4 categorías:
 * 1. Gestión de Jobs (agregar, listar, obtener, eliminar, reintentar)
 * 2. Estadísticas y Métricas (stats globales, por cola, métricas avanzadas)
 * 3. Control de Colas (pausar, reanudar, limpiar, vaciar)
 * 4. Health Checks (verificar salud de las colas)
 *
 * Requiere roles: ADMIN, MANAGER
 */
@ApiTags('Queue Management')
@Controller('queue')
@Roles(ROLES.ADMIN, ROLES.MANAGER)
export class QueueController {
  private readonly logger = new Logger(QueueController.name);

  constructor(
    private readonly queueService: QueueService,
    @Optional()
    @Inject(LoggerService)
    private readonly loggerService?: LoggerService,
  ) {}

  // ========================================
  // 📋 GESTIÓN DE JOBS
  // ========================================

  /**
   * Agregar un job a una cola
   * POST /queue/:queueName/jobs
   */
  @Post(':queueName/jobs')
  @ApiOperation({ summary: 'Agregar job a la cola' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 201, description: 'Job agregado exitosamente' })
  @ApiSwaggerResponse({ status: 400, description: 'Datos inválidos' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async addJob(
    @Param('queueName') queueName: string,
    @Body() dto: AddJobDto,
  ): Promise<IApiResponse<IJobResponse>> {
    const data = await this.queueService.addJob(queueName, dto);
    return {
      success: true,
      message: `Job agregado exitosamente a la cola ${queueName}`,
      data,
    };
  }

  /**
   * Listar jobs de una cola con filtros
   * GET /queue/:queueName/jobs
   */
  @Get(':queueName/jobs')
  @ApiOperation({ summary: 'Listar jobs de la cola con filtros' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Lista de jobs obtenida' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async listJobs(
    @Param('queueName') queueName: string,
    @Query() query: QueryJobDto,
  ): Promise<IApiResponse<IJobsListResponse>> {
    const data = await this.queueService.listJobs(queueName, query);
    return {
      success: true,
      message: `Jobs de la cola ${queueName} obtenidos exitosamente`,
      data,
    };
  }

  /**
   * Obtener detalles de un job específico
   * GET /queue/:queueName/jobs/:jobId
   */
  @Get(':queueName/jobs/:jobId')
  @ApiOperation({ summary: 'Obtener detalles de un job' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiParam({ name: 'jobId', description: 'ID del job', example: '123' })
  @ApiSwaggerResponse({ status: 200, description: 'Detalles del job obtenidos' })
  @ApiSwaggerResponse({ status: 404, description: 'Job no encontrado' })
  async getJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<IApiResponse<IJobDetailResponse>> {
    const data = await this.queueService.getJob(queueName, jobId);
    return {
      success: true,
      message: `Detalles del job ${jobId} obtenidos exitosamente`,
      data,
    };
  }

  /**
   * Eliminar un job
   * DELETE /queue/:queueName/jobs/:jobId
   */
  @Delete(':queueName/jobs/:jobId')
  @ApiOperation({ summary: 'Eliminar un job' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiParam({ name: 'jobId', description: 'ID del job', example: '123' })
  @ApiSwaggerResponse({ status: 200, description: 'Job eliminado exitosamente' })
  @ApiSwaggerResponse({ status: 404, description: 'Job no encontrado' })
  async removeJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<IApiResponse<IRemoveJobResponse>> {
    const data = await this.queueService.removeJob(queueName, jobId);
    return {
      success: true,
      message: `Job ${jobId} eliminado exitosamente`,
      data,
    };
  }

  /**
   * Reintentar un job fallido
   * POST /queue/:queueName/jobs/:jobId/retry
   */
  @Post(':queueName/jobs/:jobId/retry')
  @ApiOperation({ summary: 'Reintentar un job fallido' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiParam({ name: 'jobId', description: 'ID del job', example: '123' })
  @ApiSwaggerResponse({ status: 200, description: 'Job reintentado exitosamente' })
  @ApiSwaggerResponse({ status: 400, description: 'Job no está en estado fallido' })
  @ApiSwaggerResponse({ status: 404, description: 'Job no encontrado' })
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<IApiResponse<IRetryJobResponse>> {
    const data = await this.queueService.retryJob(queueName, jobId);
    return {
      success: true,
      message: `Job ${jobId} reintentado exitosamente`,
      data,
    };
  }

  // ========================================
  // 📊 ESTADÍSTICAS Y MÉTRICAS
  // ========================================

  /**
   * Obtener estadísticas de todas las colas
   * GET /queue/stats
   */
  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de todas las colas' })
  @ApiSwaggerResponse({ status: 200, description: 'Estadísticas obtenidas' })
  async getAllQueuesStats(): Promise<IApiResponse<IAllQueuesStatsResponse>> {
    const data = await this.queueService.getAllQueuesStats();
    return {
      success: true,
      message: 'Estadísticas de todas las colas obtenidas exitosamente',
      data,
    };
  }

  /**
   * Obtener estadísticas de una cola específica
   * GET /queue/:queueName/stats
   */
  @Get(':queueName/stats')
  @ApiOperation({ summary: 'Obtener estadísticas de una cola' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Estadísticas obtenidas' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async getQueueStats(@Param('queueName') queueName: string): Promise<IApiResponse<IQueueStats>> {
    const data = await this.queueService.getQueueStats(queueName);
    return {
      success: true,
      message: `Estadísticas de la cola ${queueName} obtenidas exitosamente`,
      data,
    };
  }

  /**
   * Obtener métricas avanzadas de una cola
   * GET /queue/:queueName/metrics
   */
  @Get(':queueName/metrics')
  @ApiOperation({ summary: 'Obtener métricas avanzadas de una cola' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Métricas obtenidas' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async getMetrics(@Param('queueName') queueName: string): Promise<IApiResponse<IQueueMetrics>> {
    const data = await this.queueService.getMetrics(queueName);
    return {
      success: true,
      message: `Métricas de la cola ${queueName} obtenidas exitosamente`,
      data,
    };
  }

  // ========================================
  // 🎛️ CONTROL DE COLAS
  // ========================================

  /**
   * Pausar una cola
   * POST /queue/:queueName/pause
   */
  @Post(':queueName/pause')
  @ApiOperation({ summary: 'Pausar procesamiento de la cola' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Cola pausada exitosamente' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async pauseQueue(
    @Param('queueName') queueName: string,
  ): Promise<IApiResponse<IPauseQueueResponse>> {
    const data = await this.queueService.pauseQueue(queueName);
    this.logWarn(`⏸️ Cola ${queueName} pausada por administrador`);
    return {
      success: true,
      message: `Cola ${queueName} pausada exitosamente`,
      data,
    };
  }

  /**
   * Reanudar una cola pausada
   * POST /queue/:queueName/resume
   */
  @Post(':queueName/resume')
  @ApiOperation({ summary: 'Reanudar procesamiento de la cola' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Cola reanudada exitosamente' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async resumeQueue(
    @Param('queueName') queueName: string,
  ): Promise<IApiResponse<IPauseQueueResponse>> {
    const data = await this.queueService.resumeQueue(queueName);
    this.logger.log(`▶️ Cola ${queueName} reanudada por administrador`);
    return {
      success: true,
      message: `Cola ${queueName} reanudada exitosamente`,
      data,
    };
  }

  /**
   * Limpiar jobs de una cola
   * POST /queue/:queueName/clean
   */
  @Post(':queueName/clean')
  @ApiOperation({ summary: 'Limpiar jobs de la cola' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Jobs limpiados exitosamente' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async cleanJobs(
    @Param('queueName') queueName: string,
    @Body() dto: CleanJobsDto,
  ): Promise<IApiResponse<ICleanJobsResponse>> {
    const data = await this.queueService.cleanJobs(queueName, dto);
    this.logger.log(`🧹 Cola ${queueName} limpiada: ${data.cleaned} jobs eliminados`);
    return {
      success: true,
      message: `${data.cleaned} jobs limpiados exitosamente de la cola ${queueName}`,
      data,
    };
  }

  /**
   * Vaciar una cola (eliminar todos los jobs)
   * POST /queue/:queueName/empty
   */
  @Post(':queueName/empty')
  @ApiOperation({ summary: 'Vaciar cola completamente (⚠️ destructivo)' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Cola vaciada exitosamente' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async emptyQueue(
    @Param('queueName') queueName: string,
  ): Promise<IApiResponse<{ queueName: string; emptied: boolean }>> {
    const data = await this.queueService.emptyQueue(queueName);
    this.logWarn(`🗑️ Cola ${queueName} vaciada completamente por administrador`);
    return {
      success: true,
      message: `Cola ${queueName} vaciada exitosamente`,
      data,
    };
  }

  // ========================================
  // 💚 HEALTH CHECKS
  // ========================================

  /**
   * Health check de una cola
   * GET /queue/:queueName/health
   */
  @Get(':queueName/health')
  @ApiOperation({ summary: 'Verificar salud de la cola' })
  @ApiParam({ name: 'queueName', description: 'Nombre de la cola', example: 'email-queue' })
  @ApiSwaggerResponse({ status: 200, description: 'Health check completado' })
  @ApiSwaggerResponse({ status: 404, description: 'Cola no encontrada' })
  async checkHealth(
    @Param('queueName') queueName: string,
  ): Promise<IApiResponse<IQueueHealthResponse>> {
    const data = await this.queueService.checkHealth(queueName);
    return {
      success: true,
      message: `Health check de la cola ${queueName} completado`,
      data,
    };
  }

  private logWarn(message: string): void {
    this.logger.warn(message);
    void this.loggerService?.warn(message, {
      context: LogContext.QUEUE,
      service: QueueController.name,
    });
  }

  private logError(message: string): void {
    this.logger.error(message);
    void this.loggerService?.error(message, {
      context: LogContext.QUEUE,
      service: QueueController.name,
    });
  }
}

