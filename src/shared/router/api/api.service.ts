// src/shared/router/api/api.service.ts

/**
 * @fileoverview Servicio de API de alto nivel
 * @module shared/router/api
 * @description Wrapper sobre HttpClientService con funcionalidades adicionales
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HttpClientService } from './http-client.service';
import {
  HttpRequestConfig,
  HttpResult,
  ExternalPaginationParams,
  ExternalPaginatedResponse,
  CacheConfig,
} from '../dto';
import { buildFullUrl, TIMEOUT_CONFIG } from '../gateway';
import { RedisService } from '@shared/redis';

/**
 * Configuración de endpoint de API
 */
interface ApiEndpointConfig {
  /** URL base del servicio */
  baseUrl: string;
  /** Versión de la API */
  version?: string;
  /** Timeout por defecto (ms) */
  timeout?: number;
  /** Headers por defecto */
  headers?: Record<string, string>;
  /** Token de autenticación */
  authToken?: string;
}

@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);
  private readonly defaultCacheTTL: number;

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.defaultCacheTTL = this.configService.get<number>('redis.ttl') || 3600;
  }

  // ============================================
  // MÉTODOS DE PETICIÓN CON CACHE
  // ============================================

  /**
   * GET con soporte de cache
   * @param url - URL del endpoint
   * @param config - Configuración
   * @param cache - Configuración de cache
   * @returns Resultado de la petición
   */
  async getWithCache<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>,
    cache?: CacheConfig,
  ): Promise<HttpResult<T>> {
    const cacheKey = cache?.key || `api:get:${this.hashUrl(url, config?.params)}`;

    // Intentar obtener de cache si está habilitado
    if (cache?.enabled && !cache?.invalidate) {
      const cached = await this.redisService.getJson<T>(cacheKey);
      if (cached !== null) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return {
          success: true,
          data: cached,
          status: 200,
        };
      }
      this.logger.debug(`Cache MISS: ${cacheKey}`);
    }

    // Realizar petición
    const result = await this.httpClient.get<T>(url, config);

    // Guardar en cache si fue exitoso
    if (result.success && cache?.enabled && result.data) {
      await this.redisService.setJson(cacheKey, result.data, {
        ttl: cache.ttl || this.defaultCacheTTL,
      });
      this.logger.debug(`Cache SET: ${cacheKey}`);
    }

    return result;
  }

  /**
   * Invalida cache por clave o patrón
   * @param keyOrPattern - Clave exacta o patrón (con *)
   * @returns Número de claves invalidadas
   */
  async invalidateCache(keyOrPattern: string): Promise<number> {
    if (keyOrPattern.includes('*')) {
      return this.redisService.invalidatePattern(keyOrPattern);
    }
    const deleted = await this.redisService.del(keyOrPattern);
    return deleted;
  }

  // ============================================
  // MÉTODOS PARA APIS EXTERNAS
  // ============================================

  /**
   * Crea un cliente para un servicio externo específico
   * @param config - Configuración del endpoint
   * @returns Objeto con métodos para interactuar con el servicio
   */
  createServiceClient(config: ApiEndpointConfig) {
    const baseUrl = config.version ? `${config.baseUrl}/${config.version}` : config.baseUrl;

    const defaultConfig: Partial<HttpRequestConfig> = {
      baseURL: baseUrl,
      timeout: config.timeout || TIMEOUT_CONFIG.DEFAULT,
      headers: config.headers,
      authToken: config.authToken,
    };

    return {
      /**
       * GET request al servicio
       */
      get: <T = unknown>(
        endpoint: string,
        params?: Record<string, string | number>,
        queryParams?: Record<string, string | number | boolean | undefined>,
      ): Promise<HttpResult<T>> => {
        const url = buildFullUrl(baseUrl, endpoint, params, queryParams);
        return this.httpClient.get<T>(url, defaultConfig);
      },

      /**
       * POST request al servicio
       */
      post: <T = unknown>(
        endpoint: string,
        data?: unknown,
        params?: Record<string, string | number>,
      ): Promise<HttpResult<T>> => {
        const url = buildFullUrl(baseUrl, endpoint, params);
        return this.httpClient.post<T>(url, data, defaultConfig);
      },

      /**
       * PUT request al servicio
       */
      put: <T = unknown>(
        endpoint: string,
        data?: unknown,
        params?: Record<string, string | number>,
      ): Promise<HttpResult<T>> => {
        const url = buildFullUrl(baseUrl, endpoint, params);
        return this.httpClient.put<T>(url, data, defaultConfig);
      },

      /**
       * PATCH request al servicio
       */
      patch: <T = unknown>(
        endpoint: string,
        data?: unknown,
        params?: Record<string, string | number>,
      ): Promise<HttpResult<T>> => {
        const url = buildFullUrl(baseUrl, endpoint, params);
        return this.httpClient.patch<T>(url, data, defaultConfig);
      },

      /**
       * DELETE request al servicio
       */
      delete: <T = unknown>(
        endpoint: string,
        params?: Record<string, string | number>,
      ): Promise<HttpResult<T>> => {
        const url = buildFullUrl(baseUrl, endpoint, params);
        return this.httpClient.delete<T>(url, defaultConfig);
      },
    };
  }

  // ============================================
  // MÉTODOS DE PAGINACIÓN
  // ============================================

  /**
   * GET con paginación automática
   * @param url - URL del endpoint
   * @param pagination - Parámetros de paginación
   * @param config - Configuración adicional
   * @returns Respuesta paginada
   */
  async getPaginated<T = unknown>(
    url: string,
    pagination: ExternalPaginationParams = {},
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<ExternalPaginatedResponse<T>>> {
    const { page = 1, limit = 10, offset, sortBy, sortOrder } = pagination;

    const params: Record<string, string | number | undefined> = {
      ...config?.params,
      page,
      limit,
      offset,
      sortBy,
      sortOrder,
    };

    // Limpiar undefined
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined),
    ) as Record<string, string | number>;

    const result = await this.httpClient.get<ExternalPaginatedResponse<T>>(url, {
      ...config,
      params: cleanParams,
    });

    return result;
  }

  /**
   * Obtiene todos los items de un endpoint paginado
   * @param url - URL del endpoint
   * @param config - Configuración adicional
   * @param maxPages - Máximo de páginas a obtener (default: 100)
   * @returns Todos los items combinados
   */
  async getAllPaginated<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>,
    maxPages: number = 100,
  ): Promise<HttpResult<T[]>> {
    const allItems: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const result = await this.getPaginated<T>(url, { page, limit: 100 }, config);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          status: result.status,
        };
      }

      if (result.data) {
        allItems.push(...result.data.items);
        hasMore = result.data.pagination.hasNext;
        page++;
      } else {
        hasMore = false;
      }
    }

    this.logger.debug(`Fetched ${allItems.length} items from ${page - 1} pages`);

    return {
      success: true,
      data: allItems,
      status: 200,
    };
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  /**
   * Health check de un servicio externo
   * @param url - URL del servicio o endpoint de health
   * @param timeout - Timeout en ms
   * @returns true si el servicio está disponible
   */
  async healthCheck(url: string, timeout: number = TIMEOUT_CONFIG.SHORT): Promise<boolean> {
    const result = await this.httpClient.get(url, { timeout });
    return result.success;
  }

  /**
   * Ping a un servicio externo
   * @param url - URL del servicio
   * @returns Tiempo de respuesta en ms o null si falla
   */
  async ping(url: string): Promise<number | null> {
    const result = await this.httpClient.head(url, { timeout: TIMEOUT_CONFIG.SHORT });
    return result.success ? result.duration || null : null;
  }

  /**
   * Ejecuta múltiples requests y retorna el primero exitoso
   * @param requests - Array de configuraciones
   * @returns Primer resultado exitoso o el último fallido
   */
  async race<T = unknown>(requests: HttpRequestConfig[]): Promise<HttpResult<T>> {
    for (const config of requests) {
      const result = await this.httpClient.request<T>(config);
      if (result.success) {
        return result;
      }
    }

    // Si ninguno fue exitoso, retornar el último error
    return this.httpClient.request<T>(requests[requests.length - 1]);
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Genera un hash para una URL con parámetros
   */
  private hashUrl(
    url: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${url}:${paramsStr}`.replace(/[^a-zA-Z0-9:]/g, '_');
  }
}
