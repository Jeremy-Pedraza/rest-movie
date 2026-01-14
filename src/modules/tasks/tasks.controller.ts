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

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

// Decoradores globales
import { Cacheable } from '@decorators/cacheable.decorator';
import { CurrentUser } from '@decorators/current-user.decorator';
import { Roles } from '@decorators/roles.decorator';

// Constants
import { ROLES } from '@constants/roles.constant';

// Shared interfaces
import { IApiResponse } from '@shared/common';

// Local imports
import { QueryTaskDto, QueryTaskHistoryDto, RunTaskDto } from './dto';
import {
  INextRunsResponse,
  IRunTaskResponse,
  ITaskDetailResponse,
  ITaskHistoryResponse,
  ITaskListResponse,
  ITasksStatsResponse,
  IToggleTaskResponse,
} from './interfaces';
import { TasksService } from './tasks.service';

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
  listTasks(@Query() query: QueryTaskDto): IApiResponse<ITaskListResponse> {
    const data = this.tasksService.listTasks(query);
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
  getStats(): IApiResponse<ITasksStatsResponse> {
    const data = this.tasksService.getStats();
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
  getNextRuns(): IApiResponse<INextRunsResponse> {
    const data = this.tasksService.getNextRuns();
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
  getTask(@Param('name') name: string): IApiResponse<ITaskDetailResponse> {
    const data = this.tasksService.getTask(name);
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
  getTaskHistory(
    @Param('name') name: string,
    @Query() query: QueryTaskHistoryDto,
  ): IApiResponse<ITaskHistoryResponse> {
    const data = this.tasksService.getTaskHistory(name, query);
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
  enableTask(
    @Param('name') name: string,
    @Body('reason') reason?: string,
  ): IApiResponse<IToggleTaskResponse> {
    const data = this.tasksService.enableTask(name, reason);
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
  disableTask(
    @Param('name') name: string,
    @Body('reason') reason?: string,
  ): IApiResponse<IToggleTaskResponse> {
    const data = this.tasksService.disableTask(name, reason);
    return {
      success: true,
      message: data.message,
      data,
    };
  }
}
