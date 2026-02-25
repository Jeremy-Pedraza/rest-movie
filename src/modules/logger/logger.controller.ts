// src/modules/logger/logger.controller.ts

/**
 * @fileoverview Controller para logs
 * @module modules/logger
 *
 * Los errores son manejados globalmente por AllExceptionsFilter.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ROLES } from '@constants/roles.constant';
import { Roles } from '@decorators/roles.decorator';
import { Cacheable } from '@decorators/cacheable.decorator';
import { HandleErrorService, IApiResponse, IPaginatedResponse } from '@shared/common';
import { CreateLogDto, LogStatsQueryDto, QueryLogDto } from './dto';
import { LogEntity } from './entities/log.entity';
import { LoggerService } from './logger.service';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
export class LoggerController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly handleError: HandleErrorService,
  ) {}

  // ============================================
  // CRUD ENDPOINTS
  // ============================================

  /**
   * Crea un nuevo log
   */
  @Post()
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Crear un log' })
  @ApiResponse({ status: 201, description: 'Log creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(@Body() dto: CreateLogDto): Promise<IApiResponse<null>> {
    await this.loggerService.log(dto.level, dto.message, {
      context: dto.context,
      metadata: dto.metadata,
      requestId: dto.requestId,
      userId: dto.userId,
      service: dto.service,
      action: dto.action,
      errorCode: dto.errorCode,
      stack: dto.stack,
      ip: dto.ip,
      userAgent: dto.userAgent,
      method: dto.method,
      url: dto.url,
      statusCode: dto.statusCode,
      responseTime: dto.responseTime,
    });

    return {
      success: true,
      message: 'Log creado exitosamente',
      data: null,
    };
  }

  /**
   * Obtiene todos los logs con paginación
   */
  @Get()
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Listar logs con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de logs paginada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(@Query() query: QueryLogDto): Promise<IApiResponse<IPaginatedResponse<LogEntity>>> {
    const result = await this.loggerService.findAll(query);
    return {
      success: true,
      message: 'Logs obtenidos exitosamente',
      data: result,
    };
  }

  /**
   * Obtiene un log por ID
   */
  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Obtener log por ID' })
  @ApiParam({ name: 'id', description: 'ID del log', type: 'string' })
  @ApiResponse({ status: 200, description: 'Log encontrado' })
  @ApiResponse({ status: 404, description: 'Log no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<LogEntity>> {
    const log = await this.loggerService.findById(id);

    if (!log) {
      this.handleError.notFound('Log', id);
    }

    return {
      success: true,
      message: 'Log encontrado',
      data: log,
    };
  }

  // ============================================
  // TRACING ENDPOINTS
  // ============================================

  /**
   * Obtiene logs por request ID (tracing)
   */
  @Get('trace/:requestId')
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Obtener logs por request ID (tracing)' })
  @ApiParam({ name: 'requestId', description: 'ID de la petición', type: 'string' })
  @ApiResponse({ status: 200, description: 'Logs de la petición' })
  async findByRequestId(
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ): Promise<IApiResponse<LogEntity[]>> {
    const logs = await this.loggerService.findByRequestId(requestId);
    return {
      success: true,
      message: `Se encontraron ${logs.length} logs`,
      data: logs,
    };
  }

  /**
   * Obtiene logs por usuario
   */
  @Get('user/:userId')
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Obtener logs por usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'string' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Logs del usuario' })
  async findByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit') limit?: number,
  ): Promise<IApiResponse<LogEntity[]>> {
    const logs = await this.loggerService.findByUserId(userId, limit);
    return {
      success: true,
      message: `Se encontraron ${logs.length} logs`,
      data: logs,
    };
  }

  /**
   * Obtiene errores recientes
   */
  @Get('errors/recent')
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Obtener errores recientes' })
  @ApiQuery({ name: 'hours', required: false, type: 'number', description: 'Horas hacia atrás' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: 'Errores recientes' })
  async findRecentErrors(
    @Query('hours') hours?: number,
    @Query('limit') limit?: number,
  ): Promise<IApiResponse<LogEntity[]>> {
    const logs = await this.loggerService.findRecentErrors(hours, limit);
    return {
      success: true,
      message: `Se encontraron ${logs.length} errores`,
      data: logs,
    };
  }

  // ============================================
  // STATISTICS ENDPOINTS
  // ============================================

  /**
   * Obtiene estadísticas de logs
   * Cache: 30 segundos
   */
  @Get('stats/grouped')
  @Cacheable(30)
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Obtener estadísticas de logs' })
  @ApiResponse({ status: 200, description: 'Estadísticas de logs' })
  async getStats(
    @Query() query: LogStatsQueryDto,
  ): Promise<IApiResponse<Record<string, unknown>[]>> {
    const stats = await this.loggerService.getStats(query);
    return {
      success: true,
      message: 'Estadísticas obtenidas',
      data: stats,
    };
  }

  /**
   * Obtiene resumen de logs
   * Cache: 30 segundos
   */
  @Get('stats/summary')
  @Cacheable(30)
  @Roles(ROLES.ADMIN, ROLES.SYSTEM)
  @ApiOperation({ summary: 'Obtener resumen de logs' })
  @ApiResponse({ status: 200, description: 'Resumen de logs' })
  async getSummary(): Promise<IApiResponse<Record<string, unknown>>> {
    const summary = await this.loggerService.getSummary();
    return {
      success: true,
      message: 'Resumen obtenido',
      data: summary,
    };
  }

  // ============================================
  // CLEANUP ENDPOINTS
  // ============================================

  /**
   * Elimina logs antiguos
   */
  @Delete('cleanup')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar logs antiguos' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: 'number',
    description: 'Días de retención (default: 30)',
  })
  @ApiResponse({ status: 200, description: 'Logs eliminados' })
  async deleteOldLogs(@Query('days') days?: number): Promise<IApiResponse<{ deleted: number }>> {
    const deleted = await this.loggerService.deleteOldLogs(days);
    return {
      success: true,
      message: `Se eliminaron ${deleted} logs`,
      data: { deleted },
    };
  }

  /**
   * Limpia logs de debug
   */
  @Delete('cleanup/debug')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar logs de debug antiguos' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: 'number',
    description: 'Días de retención (default: 3)',
  })
  @ApiResponse({ status: 200, description: 'Logs de debug eliminados' })
  async cleanupDebugLogs(@Query('days') days?: number): Promise<IApiResponse<{ deleted: number }>> {
    const deleted = await this.loggerService.cleanupDebugLogs(days);
    return {
      success: true,
      message: `Se eliminaron ${deleted} logs de debug/verbose`,
      data: { deleted },
    };
  }

  /**
   * Fuerza el flush del buffer
   */
  @Post('flush')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forzar flush del buffer de logs' })
  @ApiResponse({ status: 200, description: 'Buffer vaciado' })
  async flush(): Promise<IApiResponse<null>> {
    await this.loggerService.flush();
    return {
      success: true,
      message: 'Buffer vaciado exitosamente',
      data: null,
    };
  }
}
