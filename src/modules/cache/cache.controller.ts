// src/modules/cache/cache.controller.ts

/**
 * @fileoverview Controller para gestión y monitoreo de cache
 * @module modules/cache
 *
 * 🔧 ENDPOINTS:
 * - GET /cache/stats - Estadísticas de cache
 * - GET /cache/info - Información general
 * - POST /cache/invalidate/tag/:tag - Invalidar por tag
 * - POST /cache/invalidate/tags - Invalidar múltiples tags
 * - DELETE /cache/flush - Limpiar todo
 * - GET /cache/keys - Listar keys
 * - GET /cache/tags/:tag/keys - Keys de un tag
 *
 * 🔐 SEGURIDAD:
 * - Todos los endpoints requieren autenticación
 * - Stats/Info: Admin, Manager
 * - Invalidación: Solo Admin
 * - Flush: Solo Admin
 */

import {
  Controller,
  Get,
  Post,
  Delete,
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
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import { Roles } from '@decorators/roles.decorator';
import { ROLES } from '@constants/roles.constant';
import { IApiResponse } from '@shared/common';

import { CacheService } from './cache.service';
import { CacheStatsDto } from './dto';

/**
 * DTO para invalidar múltiples tags
 */
class InvalidateTagsDto {
  tags: string[];
}

@ApiTags('Cache')
@ApiBearerAuth()
@Controller('cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  // ============================================
  // ESTADÍSTICAS Y MONITOREO
  // ============================================

  /**
   * Obtiene estadísticas de cache
   */
  @Get('stats')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Obtener estadísticas de cache',
    description: 'Retorna hits, misses, hit ratio, keys totales y estadísticas por tag',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas',
    type: CacheStatsDto,
  })
  async getStats(): Promise<IApiResponse<CacheStatsDto>> {
    const stats = await this.cacheService.getStats();
    return {
      success: true,
      message: 'Estadísticas de cache obtenidas',
      data: stats,
    };
  }

  /**
   * Obtiene información general del cache
   */
  @Get('info')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Obtener información del cache',
    description: 'Retorna configuración, estadísticas y contadores',
  })
  @ApiResponse({
    status: 200,
    description: 'Información obtenida',
  })
  async getInfo(): Promise<IApiResponse<Record<string, any>>> {
    const info = await this.cacheService.info();
    return {
      success: true,
      message: 'Información de cache obtenida',
      data: info,
    };
  }

  // ============================================
  // INVALIDACIÓN
  // ============================================

  /**
   * Invalida todas las keys con un tag específico
   */
  @Post('invalidate/tag/:tag')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidar cache por tag',
    description: 'Elimina todas las keys asociadas a un tag específico',
  })
  @ApiParam({
    name: 'tag',
    description: 'Tag a invalidar',
    example: 'users',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache invalidado',
  })
  async invalidateTag(@Param('tag') tag: string): Promise<IApiResponse<{ keysInvalidated: number }>> {
    const keysInvalidated = await this.cacheService.invalidateTag(tag);
    return {
      success: true,
      message: `Tag '${tag}' invalidado: ${keysInvalidated} keys eliminadas`,
      data: { keysInvalidated },
    };
  }

  /**
   * Invalida múltiples tags
   */
  @Post('invalidate/tags')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidar múltiples tags',
    description: 'Elimina todas las keys asociadas a los tags especificados',
  })
  @ApiBody({
    description: 'Lista de tags a invalidar',
    schema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['users', 'user-stats', 'products'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tags invalidados',
  })
  async invalidateTags(
    @Body() dto: InvalidateTagsDto,
  ): Promise<IApiResponse<{ keysInvalidated: number }>> {
    const keysInvalidated = await this.cacheService.invalidateTags(dto.tags);
    return {
      success: true,
      message: `${dto.tags.length} tags invalidados: ${keysInvalidated} keys eliminadas`,
      data: { keysInvalidated },
    };
  }

  /**
   * Invalida cache por patrón
   */
  @Post('invalidate/pattern')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidar cache por patrón',
    description: 'Elimina todas las keys que coincidan con el patrón (ej: user:*)',
  })
  @ApiBody({
    description: 'Patrón de keys a invalidar',
    schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          example: 'user:*',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Keys invalidadas',
  })
  async invalidatePattern(
    @Body() body: { pattern: string },
  ): Promise<IApiResponse<{ keysInvalidated: number }>> {
    const keysInvalidated = await this.cacheService.invalidatePattern(body.pattern);
    return {
      success: true,
      message: `Patrón '${body.pattern}' invalidado: ${keysInvalidated} keys eliminadas`,
      data: { keysInvalidated },
    };
  }

  // ============================================
  // LIMPIEZA TOTAL
  // ============================================

  /**
   * Limpia todo el cache
   */
  @Delete('flush')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpiar todo el cache',
    description: '⚠️ PELIGROSO: Elimina todas las keys del cache. Solo admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache limpiado completamente',
  })
  async flush(): Promise<IApiResponse<null>> {
    await this.cacheService.flush();
    return {
      success: true,
      message: 'Cache completamente limpiado',
      data: null,
    };
  }

  /**
   * Limpia cache de un módulo específico
   */
  @Delete('flush/:module')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpiar cache de un módulo',
    description: 'Elimina todas las keys de un módulo específico (user, auth, product, stats)',
  })
  @ApiParam({
    name: 'module',
    description: 'Módulo a limpiar',
    enum: ['user', 'auth', 'product', 'stats'],
  })
  @ApiResponse({
    status: 200,
    description: 'Cache del módulo limpiado',
  })
  async flushModule(
    @Param('module') module: 'user' | 'auth' | 'product' | 'stats',
  ): Promise<IApiResponse<{ keysInvalidated: number }>> {
    const keysInvalidated = await this.cacheService.flushModule(module);
    return {
      success: true,
      message: `Cache del módulo '${module}' limpiado: ${keysInvalidated} keys eliminadas`,
      data: { keysInvalidated },
    };
  }

  // ============================================
  // CONSULTAS
  // ============================================

  /**
   * Lista keys del cache
   */
  @Get('keys')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Listar keys del cache',
    description: 'Lista todas las keys o las que coincidan con el patrón',
  })
  @ApiQuery({
    name: 'pattern',
    required: false,
    description: 'Patrón para filtrar keys (ej: user:*)',
    example: 'user:*',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de keys a retornar',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de keys',
  })
  async listKeys(
    @Query('pattern') pattern: string = '*',
    @Query('limit') limit: string = '100',
  ): Promise<IApiResponse<{ keys: string[]; total: number }>> {
    const limitNum = parseInt(limit, 10) || 100;
    const keys = await this.cacheService.listKeys(pattern, limitNum);
    return {
      success: true,
      message: `${keys.length} keys encontradas`,
      data: {
        keys,
        total: keys.length,
      },
    };
  }

  /**
   * Obtiene las keys de un tag específico
   */
  @Get('tags/:tag/keys')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Obtener keys de un tag',
    description: 'Lista todas las keys asociadas a un tag específico',
  })
  @ApiParam({
    name: 'tag',
    description: 'Tag a consultar',
    example: 'users',
  })
  @ApiResponse({
    status: 200,
    description: 'Keys del tag',
  })
  async getTagKeys(
    @Param('tag') tag: string,
  ): Promise<IApiResponse<{ keys: string[]; total: number }>> {
    const keys = await this.cacheService.getTagKeys(tag);
    return {
      success: true,
      message: `Tag '${tag}' tiene ${keys.length} keys`,
      data: {
        keys,
        total: keys.length,
      },
    };
  }

  /**
   * Cuenta keys por patrón
   */
  @Get('count')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Contar keys',
    description: 'Cuenta las keys que coincidan con el patrón',
  })
  @ApiQuery({
    name: 'pattern',
    required: false,
    description: 'Patrón para filtrar keys',
    example: 'user:*',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteo de keys',
  })
  async countKeys(
    @Query('pattern') pattern: string = '*',
  ): Promise<IApiResponse<{ count: number; pattern: string }>> {
    const count = await this.cacheService.countKeys(pattern);
    return {
      success: true,
      message: `${count} keys encontradas con patrón '${pattern}'`,
      data: {
        count,
        pattern,
      },
    };
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Resetea las estadísticas de cache
   */
  @Post('stats/reset')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resetear estadísticas',
    description: 'Reinicia los contadores de hits/misses',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas reseteadas',
  })
  async resetStats(): Promise<IApiResponse<null>> {
    await this.cacheService.resetStats();
    return {
      success: true,
      message: 'Estadísticas de cache reseteadas',
      data: null,
    };
  }
}
