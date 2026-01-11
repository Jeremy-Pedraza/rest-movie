// src/shared/router/router.service.ts

/**
 * @fileoverview Servicio principal de Router (Facade)
 * @module shared/router
 * @description Provee acceso unificado a HttpClient y ApiService
 */

import { Injectable } from '@nestjs/common';

import { HttpClientService } from './api/http-client.service';
import { ApiService } from './api/api.service';
import {
  HttpRequestConfig,
  HttpResult,
  ExternalPaginationParams,
  ExternalPaginatedResponse,
  CacheConfig,
  RequestStats,
} from './dto';

@Injectable()
export class RouterService {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly apiService: ApiService,
  ) {}

  // ============================================
  // HTTP CLIENT METHODS
  // ============================================

  /**
   * GET request
   */
  async get<T = unknown>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResult<T>> {
    return this.httpClient.get<T>(url, config);
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.httpClient.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.httpClient.put<T>(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.httpClient.patch<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.httpClient.delete<T>(url, config);
  }

  /**
   * Request genérico
   */
  async request<T = unknown>(config: HttpRequestConfig): Promise<HttpResult<T>> {
    return this.httpClient.request<T>(config);
  }

  /**
   * Request con reintentos automáticos
   */
  async requestWithRetry<T = unknown>(
    config: HttpRequestConfig,
    maxRetries?: number,
  ): Promise<HttpResult<T>> {
    return this.httpClient.requestWithRetry<T>(config, maxRetries);
  }

  /**
   * Múltiples requests en paralelo
   */
  async parallel<T = unknown>(requests: HttpRequestConfig[]): Promise<HttpResult<T>[]> {
    return this.httpClient.parallel<T>(requests);
  }

  /**
   * Múltiples requests en secuencia
   */
  async sequential<T = unknown>(requests: HttpRequestConfig[]): Promise<HttpResult<T>[]> {
    return this.httpClient.sequential<T>(requests);
  }

  // ============================================
  // API SERVICE METHODS
  // ============================================

  /**
   * GET con cache
   */
  async getWithCache<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>,
    cache?: CacheConfig,
  ): Promise<HttpResult<T>> {
    return this.apiService.getWithCache<T>(url, config, cache);
  }

  /**
   * Invalida cache
   */
  async invalidateCache(keyOrPattern: string): Promise<number> {
    return this.apiService.invalidateCache(keyOrPattern);
  }

  /**
   * GET con paginación
   */
  async getPaginated<T = unknown>(
    url: string,
    pagination?: ExternalPaginationParams,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<ExternalPaginatedResponse<T>>> {
    return this.apiService.getPaginated<T>(url, pagination, config);
  }

  /**
   * Obtiene todos los items paginados
   */
  async getAllPaginated<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>,
    maxPages?: number,
  ): Promise<HttpResult<T[]>> {
    return this.apiService.getAllPaginated<T>(url, config, maxPages);
  }

  /**
   * Crea un cliente para un servicio externo
   */
  createServiceClient(config: {
    baseUrl: string;
    version?: string;
    timeout?: number;
    headers?: Record<string, string>;
    authToken?: string;
  }) {
    return this.apiService.createServiceClient(config);
  }

  /**
   * Health check de un servicio
   */
  async healthCheck(url: string, timeout?: number): Promise<boolean> {
    return this.apiService.healthCheck(url, timeout);
  }

  /**
   * Ping a un servicio
   */
  async ping(url: string): Promise<number | null> {
    return this.apiService.ping(url);
  }

  /**
   * Ejecuta requests en carrera (retorna el primero exitoso)
   */
  async race<T = unknown>(requests: HttpRequestConfig[]): Promise<HttpResult<T>> {
    return this.apiService.race<T>(requests);
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Obtiene estadísticas de requests
   */
  getStats(): RequestStats {
    return this.httpClient.getStats();
  }

  /**
   * Reinicia estadísticas
   */
  resetStats(): void {
    this.httpClient.resetStats();
  }
}
