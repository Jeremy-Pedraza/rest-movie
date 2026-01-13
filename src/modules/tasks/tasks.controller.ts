/**
 * @fileoverview Controller para gestión de tareas programadas
 * @module modules/tasks
 *
 * ⚠️ REGLAS:
 * - NO usar try-catch (AllExceptionsFilter lo maneja)
 * - SIEMPRE usar decoradores Swagger
 * - SIEMPRE retornar IApiResponse<T>
 * - @Roles(ADMIN) en todos los endpoints (excepto los marcados)
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

// Decoradores globales
import { Roles } from '@decorators/roles.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { Cacheable } from '@decorators/cacheable.decorator';

// Constants
import { ROLES } from '@constants/roles.constant';

// Shared interfaces
import { IApiResponse } from '@shared/common';

// Local imports
import { TasksService } from './tasks.service';
import { QueryTaskDto, QueryTaskHistoryDto, RunTaskDto } from './dto';
import {
  ITaskListResponse,
  ITaskDetailResponse,
  IRunTaskResponse,
  IToggleTaskResponse,
  ITasksStatsResponse,
  INextRunsResponse,
  ITaskHistoryResponse,
} from './interfaces';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ============================================
  // LISTAR TAREAS
  // ============================================

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Listar todas las tareas programadas' })
  @ApiResponse({ status: 200, description: 'Lista de tareas' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async listTasks(@Query() query: QueryTaskDto): Promise<IApiResponse<ITaskListResponse>> {
    const data = await this.tasksService.listTasks(query);
    return {
      success: true,
      message: 'Tareas obtenidas exitosamente',
      data,
    };
  }

  @Get('stats')
  @Cacheable(60)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Estadísticas globales de tareas' })
  @ApiResponse({ status: 200, description: 'Estadísticas de tareas' })
  async getStats(): Promise<IApiResponse<ITasksStatsResponse>> {
    const data = await this.tasksService.getStats();
    return {
      success: true,
      message: 'Estadísticas obtenidas',
      data,
    };
  }

  @Get('next-runs')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Próximas ejecuciones programadas' })
  @ApiResponse({ status: 200, description: 'Próximas ejecuciones' })
  async getNextRuns(): Promise<IApiResponse<INextRunsResponse>> {
    const data = await this.tasksService.getNextRuns();
    return {
      success: true,
      message: 'Próximas ejecuciones obtenidas',
      data,
    };
  }

  // ============================================
  // DETALLE DE TAREA
  // ============================================

  @Get(':name')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Obtener detalle de una tarea' })
  @ApiParam({ name: 'name', description: 'Nombre de la tarea', example: 'cleanup' })
  @ApiResponse({ status: 200, description: 'Detalle de la tarea' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async getTask(@Param('name') name: string): Promise<IApiResponse<ITaskDetailResponse>> {
    const data = await this.tasksService.getTask(name);
    return {
      success: true,
      message: `Tarea '${name}' encontrada`,
      data,
    };
  }

  @Get(':name/history')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({ summary: 'Historial de ejecuciones de una tarea' })
  @ApiParam({ name: 'name', description: 'Nombre de la tarea', example: 'cleanup' })
  @ApiResponse({ status: 200, description: 'Historial de ejecuciones' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async getTaskHistory(
    @Param('name') name: string,
    @Query() query: QueryTaskHistoryDto,
  ): Promise<IApiResponse<ITaskHistoryResponse>> {
    const data = await this.tasksService.getTaskHistory(name, query);
    return {
      success: true,
      message: `Historial de '${name}' obtenido`,
      data,
    };
  }

  // ============================================
  // EJECUTAR TAREA
  // ============================================

  @Post(':name/run')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Ejecutar tarea manualmente' })
  @ApiParam({ name: 'name', description: 'Nombre de la tarea', example: 'cleanup' })
  @ApiResponse({ status: 200, description: 'Tarea ejecutada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  @ApiResponse({ status: 409, description: 'Tarea ya en ejecución' })
  async runTask(
    @Param('name') name: string,
    @Body() dto: RunTaskDto,
    @CurrentUser() user: { id: string; email: string },
  ): Promise<IApiResponse<IRunTaskResponse>> {
    const data = await this.tasksService.runTask(name, dto, user?.email);
    return {
      success: true,
      message: data.result?.success
        ? `Tarea '${name}' ejecutada exitosamente`
        : `Tarea '${name}' ejecutada con errores`,
      data,
    };
  }

  // ============================================
  // HABILITAR / DESHABILITAR
  // ============================================

  @Post(':name/enable')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Habilitar tarea' })
  @ApiParam({ name: 'name', description: 'Nombre de la tarea', example: 'cleanup' })
  @ApiResponse({ status: 200, description: 'Tarea habilitada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async enableTask(
    @Param('name') name: string,
    @Body('reason') reason?: string,
  ): Promise<IApiResponse<IToggleTaskResponse>> {
    const data = await this.tasksService.enableTask(name, reason);
    return {
      success: true,
      message: data.message,
      data,
    };
  }

  @Post(':name/disable')
  @HttpCode(HttpStatus.OK)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Deshabilitar tarea' })
  @ApiParam({ name: 'name', description: 'Nombre de la tarea', example: 'cleanup' })
  @ApiResponse({ status: 200, description: 'Tarea deshabilitada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async disableTask(
    @Param('name') name: string,
    @Body('reason') reason?: string,
  ): Promise<IApiResponse<IToggleTaskResponse>> {
    const data = await this.tasksService.disableTask(name, reason);
    return {
      success: true,
      message: data.message,
      data,
    };
  }
}
