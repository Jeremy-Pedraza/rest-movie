// src/modules/logger/logger.controller.ts

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
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '@decorators/public.decorator';
import { IApiResponse, IPaginatedResponse } from '@shared/common';
import { CreateLogDto, LogStatsQueryDto, QueryLogDto } from './dto';
import { LogEntity } from './entities/log.entity';
import { LoggerService } from './logger.service';

@ApiTags('Logs')
@Controller('logs')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Crear un log' })
  @ApiResponse({ status: 201, description: 'Log creado' })
  @ApiResponse({ status: 400, description: 'Datos invalidos' })
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

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar logs con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de logs paginada' })
  async findAll(@Query() query: QueryLogDto): Promise<IApiResponse<IPaginatedResponse<LogEntity>>> {
    const result = await this.loggerService.findAll(query);
    return {
      success: true,
      message: 'Logs obtenidos exitosamente',
      data: result,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener log por ID' })
  @ApiParam({ name: 'id', description: 'ID del log', type: 'string' })
  @ApiResponse({ status: 200, description: 'Log encontrado' })
  @ApiResponse({ status: 404, description: 'Log no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<IApiResponse<LogEntity>> {
    const log = await this.loggerService.findByIdOrFail(id);

    return {
      success: true,
      message: 'Log encontrado',
      data: log,
    };
  }

  @Public()
  @Get('trace/:requestId')
  @ApiOperation({ summary: 'Obtener logs por request ID (tracing)' })
  @ApiParam({ name: 'requestId', description: 'ID de la peticion', type: 'string' })
  @ApiResponse({ status: 200, description: 'Logs de la peticion' })
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

  @Public()
  @Get('user/:userId')
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

  @Public()
  @Get('errors/recent')
  @ApiOperation({ summary: 'Obtener errores recientes' })
  @ApiQuery({ name: 'hours', required: false, type: 'number', description: 'Horas hacia atras' })
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

  @Public()
  @Get('stats/grouped')
  @ApiOperation({ summary: 'Obtener estadisticas de logs' })
  @ApiResponse({ status: 200, description: 'Estadisticas de logs' })
  async getStats(
    @Query() query: LogStatsQueryDto,
  ): Promise<IApiResponse<Record<string, unknown>[]>> {
    const stats = await this.loggerService.getStats(query);
    return {
      success: true,
      message: 'Estadisticas obtenidas',
      data: stats,
    };
  }

  @Public()
  @Get('stats/summary')
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

  @Public()
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar logs antiguos' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: 'number',
    description: 'Dias de retencion (default: 30)',
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

  @Public()
  @Delete('cleanup/debug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar logs de debug antiguos' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: 'number',
    description: 'Dias de retencion (default: 3)',
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

  @Public()
  @Post('flush')
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
