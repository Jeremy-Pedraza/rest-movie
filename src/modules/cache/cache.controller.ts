// src/modules/cache/cache.controller.ts

/**
 * @fileoverview Controller para gestión y monitoreo de cache
 * @module modules/cache
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ROLES } from '@constants/roles.constant';
import { Roles } from '@decorators/roles.decorator';
import { ERROR_CODES } from '@constants/error-codes.constant';
import { HandleErrorService, IApiResponse } from '@shared/common';

import { CacheService } from './cache.service';
import {
  CacheModuleName,
  CacheStatsDto,
  CountKeysQueryDto,
  InvalidatePatternDto,
  InvalidateTagsDto,
  ListKeysQueryDto,
} from './dto';

@ApiTags('Cache')
@ApiBearerAuth()
@Controller('cache')
export class CacheController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly handleError: HandleErrorService,
  ) {}

  // ============================================
  // ESTADÍSTICAS Y MONITOREO
  // ============================================

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
  async invalidateTag(
    @Param('tag') tag: string,
  ): Promise<IApiResponse<{ keysInvalidated: number }>> {
    this.validateTagParam(tag);
    const keysInvalidated = await this.cacheService.invalidateTag(tag);
    return {
      success: true,
      message: `Tag '${tag}' invalidado: ${keysInvalidated} keys eliminadas`,
      data: { keysInvalidated },
    };
  }

  @Post('invalidate/tags')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidar múltiples tags',
    description: 'Elimina todas las keys asociadas a los tags especificados',
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

  @Post('invalidate/pattern')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidar cache por patrón',
    description: 'Elimina todas las keys que coincidan con el patrón (ej: user:*)',
  })
  @ApiResponse({
    status: 200,
    description: 'Keys invalidadas',
  })
  async invalidatePattern(
    @Body() dto: InvalidatePatternDto,
  ): Promise<IApiResponse<{ keysInvalidated: number }>> {
    const keysInvalidated = await this.cacheService.invalidatePattern(dto.pattern);
    return {
      success: true,
      message: `Patrón '${dto.pattern}' invalidado: ${keysInvalidated} keys eliminadas`,
      data: { keysInvalidated },
    };
  }

  // ============================================
  // LIMPIEZA TOTAL
  // ============================================

  @Delete('flush')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpiar todo el cache',
    description:
      'Elimina todas las keys del cache. Solo admin. Bloqueado en producción si CACHE_FLUSH_ENABLED != true.',
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
    enum: CacheModuleName,
  })
  @ApiResponse({
    status: 200,
    description: 'Cache del módulo limpiado',
  })
  async flushModule(
    @Param('module', new ParseEnumPipe(CacheModuleName)) module: CacheModuleName,
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

  @Get('keys')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Listar keys del cache (paginado)',
    description:
      'Lista keys con paginación por cursor usando SCAN. Enviar cursor=0 para la primera página.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de keys paginada',
  })
  async listKeys(
    @Query() query: ListKeysQueryDto,
  ): Promise<IApiResponse<{ keys: string[]; nextCursor: string; hasMore: boolean }>> {
    const pattern = query.pattern || '*';
    const cursor = query.cursor || '0';
    const countNum = Math.min(parseInt(query.count || '100', 10) || 100, 500);
    const result = await this.cacheService.listKeysPaginated(pattern, cursor, countNum);
    return {
      success: true,
      message: `${result.keys.length} keys encontradas`,
      data: result,
    };
  }

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
    this.validateTagParam(tag);
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

  @Get('count')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Contar keys',
    description: 'Cuenta las keys que coincidan con el patrón',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteo de keys',
  })
  async countKeys(
    @Query() query: CountKeysQueryDto,
  ): Promise<IApiResponse<{ count: number; pattern: string }>> {
    const pattern = query.pattern || '*';
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

  // ============================================
  // VALIDACIÓN HELPERS
  // ============================================

  private validateTagParam(tag: string): void {
    if (!tag || tag.length > 100 || !/^[a-zA-Z0-9_:\-\.]+$/.test(tag)) {
      this.handleError.badRequest(
        'El tag solo puede contener letras, números, _, :, - y . (máx 100 caracteres)',
        { field: 'tag', maxLength: 100 },
        ERROR_CODES.VALIDATION_INVALID_FORMAT,
      );
    }
  }
}
