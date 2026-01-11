// src/shared/router/dto/api-response.dto.ts

/**
 * @fileoverview DTOs para respuestas de API externas
 * @module shared/router/dto
 */

/**
 * Configuración de request HTTP
 */
export interface HttpRequestConfig {
  /** URL base o endpoint */
  url: string;
  /** Método HTTP */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /** Headers adicionales */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>;
  /** Body de la petición */
  data?: unknown;
  /** Timeout en milisegundos */
  timeout?: number;
  /** Base URL */
  baseURL?: string;
  /** Tipo de respuesta */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'stream';
  /** Incluir credenciales */
  withCredentials?: boolean;
  /** Token de autenticación */
  authToken?: string;
  /** Reintentos automáticos */
  retries?: number;
  /** Delay entre reintentos (ms) */
  retryDelay?: number;
}

/**
 * Respuesta HTTP genérica
 */
export interface HttpResponse<T = unknown> {
  /** Datos de respuesta */
  data: T;
  /** Código de estado HTTP */
  status: number;
  /** Texto de estado HTTP */
  statusText: string;
  /** Headers de respuesta */
  headers: Record<string, string>;
  /** Configuración usada en la petición */
  config: HttpRequestConfig;
  /** Tiempo de respuesta en ms */
  duration?: number;
}

/**
 * Error HTTP estructurado
 */
export interface HttpError {
  /** Mensaje de error */
  message: string;
  /** Código de estado HTTP (si aplica) */
  status?: number;
  /** Texto de estado HTTP */
  statusText?: string;
  /** Código de error interno */
  code?: string;
  /** Datos de error del servidor */
  data?: unknown;
  /** URL que falló */
  url?: string;
  /** Método HTTP usado */
  method?: string;
  /** Stack trace (solo en desarrollo) */
  stack?: string;
  /** Si es un error de timeout */
  isTimeout?: boolean;
  /** Si es un error de red */
  isNetworkError?: boolean;
  /** Si el request fue cancelado */
  isCancelled?: boolean;
}

/**
 * Resultado de petición HTTP (success o error)
 */
export interface HttpResult<T = unknown> {
  /** Si la petición fue exitosa */
  success: boolean;
  /** Datos de respuesta (si success) */
  data?: T;
  /** Error (si !success) */
  error?: HttpError;
  /** Código de estado HTTP */
  status?: number;
  /** Duración de la petición en ms */
  duration?: number;
}

/**
 * Opciones de paginación para APIs externas
 */
export interface ExternalPaginationParams {
  /** Número de página */
  page?: number;
  /** Tamaño de página */
  limit?: number;
  /** Offset (alternativa a page) */
  offset?: number;
  /** Campo para ordenar */
  sortBy?: string;
  /** Dirección de ordenamiento */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Respuesta paginada de API externa
 */
export interface ExternalPaginatedResponse<T = unknown> {
  /** Items de la página actual */
  items: T[];
  /** Metadatos de paginación */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Configuración de caché para requests
 */
export interface CacheConfig {
  /** Habilitar caché */
  enabled: boolean;
  /** TTL en segundos */
  ttl?: number;
  /** Clave de caché personalizada */
  key?: string;
  /** Invalidar caché existente */
  invalidate?: boolean;
}

/**
 * Opciones avanzadas de request
 */
export interface AdvancedRequestOptions extends HttpRequestConfig {
  /** Configuración de caché */
  cache?: CacheConfig;
  /** Transformar respuesta */
  transformResponse?: (data: unknown) => unknown;
  /** Validar respuesta */
  validateResponse?: (data: unknown) => boolean;
  /** Callback de progreso (para uploads/downloads) */
  onProgress?: (progress: ProgressEvent) => void;
  /** Signal para cancelación */
  signal?: AbortSignal;
}

/**
 * Evento de progreso
 */
export interface ProgressEvent {
  /** Bytes cargados/descargados */
  loaded: number;
  /** Total de bytes */
  total: number;
  /** Porcentaje completado */
  percent: number;
}

/**
 * Estadísticas de request
 */
export interface RequestStats {
  /** Total de requests */
  totalRequests: number;
  /** Requests exitosos */
  successfulRequests: number;
  /** Requests fallidos */
  failedRequests: number;
  /** Tiempo promedio de respuesta (ms) */
  averageResponseTime: number;
  /** Último error */
  lastError?: HttpError;
  /** Timestamp del último request */
  lastRequestAt?: Date;
}
