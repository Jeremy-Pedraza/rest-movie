// src/shared/router/api/http-client.service.ts

/**
 * @fileoverview Cliente HTTP base usando Axios
 * @module shared/router/api
 */

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';

import {
  HttpRequestConfig,
  HttpError,
  HttpResult,
  AdvancedRequestOptions,
  RequestStats,
} from '../dto';
import { RETRY_CONFIG, TIMEOUT_CONFIG, HTTP_ERROR_MESSAGES } from '../gateway';

/** Campos sensibles que deben redactarse en logs */
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'authorization',
  'secret',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'creditcard',
  'credit_card',
  'cvv',
  'ssn',
]);

/** Rangos de IP privadas / link-local / metadata para protección SSRF */
const BLOCKED_HOST_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
  /^fd/i,
];

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private stats: RequestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
  };

  constructor(private readonly httpService: HttpService) {}

  // ============================================
  // MÉTODOS HTTP PRINCIPALES
  // ============================================

  /**
   * Realiza una petición GET
   * @param url - URL del endpoint
   * @param config - Configuración opcional
   * @returns Resultado de la petición
   */
  async get<T = unknown>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResult<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  /**
   * Realiza una petición POST
   * @param url - URL del endpoint
   * @param data - Datos a enviar
   * @param config - Configuración opcional
   * @returns Resultado de la petición
   */
  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  /**
   * Realiza una petición PUT
   * @param url - URL del endpoint
   * @param data - Datos a enviar
   * @param config - Configuración opcional
   * @returns Resultado de la petición
   */
  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  /**
   * Realiza una petición PATCH
   * @param url - URL del endpoint
   * @param data - Datos a enviar
   * @param config - Configuración opcional
   * @returns Resultado de la petición
   */
  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  /**
   * Realiza una petición DELETE
   * @param url - URL del endpoint
   * @param config - Configuración opcional
   * @returns Resultado de la petición
   */
  async delete<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  /**
   * Realiza una petición HEAD
   * @param url - URL del endpoint
   * @param config - Configuración opcional
   * @returns Resultado de la petición
   */
  async head<T = unknown>(
    url: string,
    config?: Partial<HttpRequestConfig>,
  ): Promise<HttpResult<T>> {
    return this.request<T>({ ...config, url, method: 'HEAD' });
  }

  // ============================================
  // MÉTODO REQUEST PRINCIPAL
  // ============================================

  /**
   * Realiza una petición HTTP genérica
   * @param config - Configuración completa de la petición
   * @returns Resultado de la petición
   */
  async request<T = unknown>(config: HttpRequestConfig): Promise<HttpResult<T>> {
    const startTime = Date.now();
    this.stats.totalRequests++;
    this.stats.lastRequestAt = new Date();

    // Validación SSRF: bloquear destinos internos
    this.validateDestination(config.url, config.baseURL);

    const axiosConfig = this.buildAxiosConfig(config);

    try {
      this.logger.debug(
        `HTTP ${config.method || 'GET'} ${config.url}`,
        config.data ? { bodySize: JSON.stringify(config.data).length } : undefined,
      );

      const response = await firstValueFrom(
        this.httpService.request<T>(axiosConfig).pipe(
          timeout(config.timeout || TIMEOUT_CONFIG.DEFAULT),
          catchError((error: AxiosError) => {
            throw error;
          }),
        ),
      );

      const duration = Date.now() - startTime;
      this.updateStats(true, duration);

      this.logger.debug(`HTTP ${response.status} ${config.url} (${duration}ms)`);

      return {
        success: true,
        data: response.data,
        status: response.status,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const httpError = this.handleError(error as AxiosError, config);
      this.updateStats(false, duration, httpError);

      this.logger.error(
        `HTTP Error ${httpError.status || 'N/A'} ${config.url}: ${httpError.message}`,
      );

      return {
        success: false,
        error: httpError,
        status: httpError.status,
        duration,
      };
    }
  }

  /**
   * Realiza una petición con opciones avanzadas
   * @param options - Opciones avanzadas
   * @returns Resultado de la petición
   */
  async requestAdvanced<T = unknown>(options: AdvancedRequestOptions): Promise<HttpResult<T>> {
    // Usar ruta con soporte signal/progress si se necesita, sino request normal
    const result = (options.signal || options.onProgress)
      ? await this.requestWithSignalAndProgress<T>(options)
      : await this.request<T>(options);

    // Aplicar transformación si se especificó
    if (result.success && options.transformResponse && result.data) {
      result.data = options.transformResponse(result.data) as T;
    }

    // Validar respuesta si se especificó
    if (result.success && options.validateResponse && result.data) {
      const isValid = options.validateResponse(result.data);
      if (!isValid) {
        return {
          success: false,
          error: {
            message: 'La respuesta no pasó la validación',
            code: 'VALIDATION_FAILED',
          },
          status: result.status,
          duration: result.duration,
        };
      }
    }

    return result;
  }

  /**
   * Request interno con soporte de signal y onProgress
   */
  private async requestWithSignalAndProgress<T = unknown>(
    options: AdvancedRequestOptions,
  ): Promise<HttpResult<T>> {
    const startTime = Date.now();
    this.stats.totalRequests++;
    this.stats.lastRequestAt = new Date();

    this.validateDestination(options.url, options.baseURL);

    const axiosConfig = this.buildAxiosConfig(options);

    // Aplicar AbortSignal
    if (options.signal) {
      const controller = new AbortController();
      axiosConfig.signal = controller.signal;

      options.signal.addEventListener('abort', () => controller.abort(), { once: true });

      if (options.signal.aborted) {
        return {
          success: false,
          error: { message: 'La petición fue cancelada', code: 'CANCELLED', isCancelled: true },
          duration: 0,
        };
      }
    }

    // Aplicar callbacks de progreso
    if (options.onProgress) {
      const progressCb = options.onProgress;
      axiosConfig.onUploadProgress = (event) => {
        if (event.total) {
          progressCb({ loaded: event.loaded, total: event.total, percent: Math.round((event.loaded / event.total) * 100) });
        }
      };
      axiosConfig.onDownloadProgress = (event) => {
        if (event.total) {
          progressCb({ loaded: event.loaded, total: event.total, percent: Math.round((event.loaded / event.total) * 100) });
        }
      };
    }

    try {
      this.logger.debug(
        `HTTP Advanced ${options.method || 'GET'} ${options.url}`,
        options.data ? { bodySize: JSON.stringify(options.data).length } : undefined,
      );

      const response = await firstValueFrom(
        this.httpService.request<T>(axiosConfig).pipe(
          timeout(options.timeout || TIMEOUT_CONFIG.DEFAULT),
          catchError((error: AxiosError) => {
            throw error;
          }),
        ),
      );

      const duration = Date.now() - startTime;
      this.updateStats(true, duration);

      return {
        success: true,
        data: response.data,
        status: response.status,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const httpError = this.handleError(error as AxiosError, options);
      this.updateStats(false, duration, httpError);

      this.logger.error(
        `HTTP Advanced Error ${httpError.status || 'N/A'} ${options.url}: ${httpError.message}`,
      );

      return {
        success: false,
        error: httpError,
        status: httpError.status,
        duration,
      };
    }
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  /**
   * Realiza múltiples peticiones en paralelo
   * @param requests - Array de configuraciones de petición
   * @returns Array de resultados
   */
  async parallel<T = unknown>(requests: HttpRequestConfig[]): Promise<HttpResult<T>[]> {
    return Promise.all(requests.map((config) => this.request<T>(config)));
  }

  /**
   * Realiza múltiples peticiones en secuencia
   * @param requests - Array de configuraciones de petición
   * @returns Array de resultados
   */
  async sequential<T = unknown>(requests: HttpRequestConfig[]): Promise<HttpResult<T>[]> {
    const results: HttpResult<T>[] = [];

    for (const config of requests) {
      const result = await this.request<T>(config);
      results.push(result);

      // Si falla, continuar o detener según preferencia
      if (!result.success) {
        this.logger.warn(`Request failed in sequence: ${config.url}`);
      }
    }

    return results;
  }

  /**
   * Realiza una petición con reintento automático con backoff exponencial
   * @param config - Configuración de la petición
   * @param maxRetries - Número máximo de reintentos
   * @returns Resultado de la petición
   */
  async requestWithRetry<T = unknown>(
    config: HttpRequestConfig,
    maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
  ): Promise<HttpResult<T>> {
    let lastResult: HttpResult<T> | null = null;
    let delay: number = RETRY_CONFIG.INITIAL_DELAY;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      lastResult = await this.request<T>(config);

      if (lastResult.success) {
        return lastResult;
      }

      // Verificar si el error es reintentable
      const status = lastResult.status;
      const retryableCodes: readonly number[] = RETRY_CONFIG.RETRYABLE_STATUS_CODES;
      if (status && !retryableCodes.includes(status)) {
        this.logger.warn(`Non-retryable status code: ${status}`);
        return lastResult;
      }

      if (attempt < maxRetries) {
        // Añadir jitter ±25% para evitar thundering herd
        const jitter = delay * 0.25 * (Math.random() * 2 - 1);
        const actualDelay = Math.round(delay + jitter);
        this.logger.warn(
          `Request failed, retrying in ${actualDelay}ms (attempt ${attempt + 1}/${maxRetries})`,
        );
        await this.sleep(actualDelay);
        delay = Math.min(delay * RETRY_CONFIG.BACKOFF_FACTOR, RETRY_CONFIG.MAX_DELAY);
      }
    }

    return lastResult!;
  }

  /**
   * Obtiene las estadísticas de requests
   * @returns Estadísticas actuales
   */
  getStats(): RequestStats {
    return { ...this.stats };
  }

  /**
   * Reinicia las estadísticas
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Construye la configuración de Axios desde HttpRequestConfig.
   * Content-Type se asigna condicionalmente según método y body.
   */
  private buildAxiosConfig(config: HttpRequestConfig): AxiosRequestConfig {
    const method = (config.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Solo asignar Content-Type para métodos con body, y si no fue provisto por el consumidor
    const hasBody = config.data !== undefined && config.data !== null;
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];

    if (methodsWithBody.includes(method) && hasBody) {
      // No sobreescribir si el consumidor ya proveyó Content-Type
      if (!config.headers?.['Content-Type'] && !config.headers?.['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    // Merge headers del consumidor (tienen prioridad)
    Object.assign(headers, config.headers);

    // Agregar token de autorización si existe
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }

    return {
      url: config.url,
      method,
      baseURL: config.baseURL,
      headers,
      params: config.params,
      data: config.data,
      timeout: config.timeout || TIMEOUT_CONFIG.DEFAULT,
      responseType: config.responseType || 'json',
      withCredentials: config.withCredentials,
    };
  }

  /**
   * Maneja errores de Axios y los convierte a HttpError
   */
  private handleError(error: AxiosError, config: HttpRequestConfig): HttpError {
    const httpError: HttpError = {
      message: 'Error en la petición HTTP',
      url: config.url,
      method: config.method || 'GET',
    };

    if (error.response) {
      // Error con respuesta del servidor
      httpError.status = error.response.status;
      httpError.statusText = error.response.statusText;
      httpError.data = error.response.data;
      httpError.message =
        HTTP_ERROR_MESSAGES[error.response.status] ||
        (error.response.data as { message?: string })?.message ||
        error.message;
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      httpError.isTimeout = true;
      httpError.code = 'TIMEOUT';
      httpError.message = 'La petición excedió el tiempo límite';
    } else if (error.code === 'ERR_CANCELED') {
      // Cancelado
      httpError.isCancelled = true;
      httpError.code = 'CANCELLED';
      httpError.message = 'La petición fue cancelada';
    } else if (!error.response) {
      // Error de red
      httpError.isNetworkError = true;
      httpError.code = 'NETWORK_ERROR';
      httpError.message = 'Error de conexión de red';
    }

    // Solo incluir stack en desarrollo
    if (process.env.NODE_ENV === 'development') {
      httpError.stack = error.stack;
    }

    return httpError;
  }

  /**
   * Actualiza las estadísticas de requests
   */
  private updateStats(success: boolean, duration: number, error?: HttpError): void {
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
      this.stats.lastError = error;
    }

    // Calcular promedio móvil
    const totalCompleted = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (totalCompleted - 1) + duration) / totalCompleted;
  }

  /**
   * Helper para sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Valida que el destino de la URL no sea una IP/host privada o interna (SSRF).
   * Lanza error si el destino está bloqueado.
   */
  private validateDestination(url?: string, baseURL?: string): void {
    const target = url || baseURL;
    if (!target) return;

    try {
      const parsed = new URL(target.startsWith('http') ? target : `https://${target}`);
      const hostname = parsed.hostname;

      for (const pattern of BLOCKED_HOST_PATTERNS) {
        if (pattern.test(hostname)) {
          throw new Error(
            `Destino bloqueado por política SSRF: ${hostname}`,
          );
        }
      }
    } catch (error) {
      if ((error as Error).message.startsWith('Destino bloqueado')) {
        throw error;
      }
      // URL mal formada: no bloquear, dejar que Axios maneje el error
    }
  }

  /**
   * Redacta campos sensibles de un objeto para logging seguro.
   */
  static redactSensitiveFields(data: unknown): unknown {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => HttpClientService.redactSensitiveFields(item));
    }

    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = HttpClientService.redactSensitiveFields(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }
}
