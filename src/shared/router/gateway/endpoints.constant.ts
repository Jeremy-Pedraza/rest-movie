// src/shared/router/gateway/endpoints.constant.ts

/**
 * @fileoverview Constantes de endpoints para APIs externas
 * @module shared/router/gateway
 */

/**
 * Configuración de servicios externos
 */
export const EXTERNAL_SERVICES = {
  /**
   * Ejemplo: API de pagos
   */
  PAYMENT_API: {
    BASE_URL: process.env.PAYMENT_API_URL || 'https://api.payment.example.com',
    VERSION: 'v1',
    TIMEOUT: 30000,
    ENDPOINTS: {
      CREATE_PAYMENT: '/payments',
      GET_PAYMENT: '/payments/:id',
      REFUND: '/payments/:id/refund',
      WEBHOOKS: '/webhooks',
    },
  },

  /**
   * Ejemplo: API de notificaciones
   */
  NOTIFICATION_API: {
    BASE_URL: process.env.NOTIFICATION_API_URL || 'https://api.notifications.example.com',
    VERSION: 'v1',
    TIMEOUT: 10000,
    ENDPOINTS: {
      SEND_EMAIL: '/email/send',
      SEND_SMS: '/sms/send',
      SEND_PUSH: '/push/send',
      TEMPLATES: '/templates',
    },
  },

  /**
   * Ejemplo: API de autenticación externa (OAuth)
   */
  AUTH_API: {
    BASE_URL: process.env.AUTH_API_URL || 'https://auth.example.com',
    VERSION: 'v2',
    TIMEOUT: 15000,
    ENDPOINTS: {
      TOKEN: '/oauth/token',
      AUTHORIZE: '/oauth/authorize',
      USERINFO: '/userinfo',
      REVOKE: '/oauth/revoke',
    },
  },

  /**
   * Ejemplo: API de almacenamiento
   */
  STORAGE_API: {
    BASE_URL: process.env.STORAGE_API_URL || 'https://storage.example.com',
    VERSION: 'v1',
    TIMEOUT: 60000,
    ENDPOINTS: {
      UPLOAD: '/files/upload',
      DOWNLOAD: '/files/:id/download',
      DELETE: '/files/:id',
      LIST: '/files',
    },
  },

  /**
   * Ejemplo: API de geolocalización
   */
  GEO_API: {
    BASE_URL: process.env.GEO_API_URL || 'https://api.geo.example.com',
    VERSION: 'v1',
    TIMEOUT: 5000,
    ENDPOINTS: {
      GEOCODE: '/geocode',
      REVERSE: '/reverse',
      PLACES: '/places',
      DISTANCE: '/distance',
    },
  },
} as const;

/**
 * Headers comunes para APIs externas
 */
export const COMMON_HEADERS = {
  JSON: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  FORM: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  MULTIPART: {
    'Content-Type': 'multipart/form-data',
  },
} as const;

/**
 * Códigos de error HTTP comunes
 */
export const HTTP_ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Mensajes de error por código HTTP
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Solicitud incorrecta',
  401: 'No autorizado',
  403: 'Acceso denegado',
  404: 'Recurso no encontrado',
  405: 'Método no permitido',
  409: 'Conflicto con el estado actual',
  422: 'Entidad no procesable',
  429: 'Demasiadas solicitudes',
  500: 'Error interno del servidor',
  502: 'Bad Gateway',
  503: 'Servicio no disponible',
  504: 'Timeout del gateway',
};

/**
 * Configuración de reintentos por defecto
 */
export const RETRY_CONFIG = {
  /** Número máximo de reintentos */
  MAX_RETRIES: 3,
  /** Delay inicial entre reintentos (ms) */
  INITIAL_DELAY: 1000,
  /** Factor de multiplicación para backoff exponencial */
  BACKOFF_FACTOR: 2,
  /** Delay máximo entre reintentos (ms) */
  MAX_DELAY: 10000,
  /** Códigos HTTP que permiten reintento */
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const;

/**
 * Configuración de timeout por defecto (ms)
 */
export const TIMEOUT_CONFIG = {
  DEFAULT: 30000,
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 60000,
  UPLOAD: 120000,
} as const;

/**
 * Helper para construir URLs con path params
 * @param template - Template de URL con :param
 * @param params - Objeto con valores de parámetros
 * @returns URL con parámetros reemplazados
 * @example
 * buildUrl('/users/:id/posts/:postId', { id: '123', postId: '456' })
 * // Returns: '/users/123/posts/456'
 */
export function buildUrl(template: string, params: Record<string, string | number>): string {
  let url = template;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  return url;
}

/**
 * Helper para construir query string
 * @param params - Objeto con query params
 * @returns Query string (sin ?)
 * @example
 * buildQueryString({ page: 1, limit: 10, search: 'test' })
 * // Returns: 'page=1&limit=10&search=test'
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}

/**
 * Helper para construir URL completa
 * @param baseUrl - URL base
 * @param endpoint - Endpoint
 * @param pathParams - Parámetros de ruta
 * @param queryParams - Query parameters
 * @returns URL completa
 */
export function buildFullUrl(
  baseUrl: string,
  endpoint: string,
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, string | number | boolean | undefined | null>,
): string {
  let url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  if (pathParams) {
    url = buildUrl(url, pathParams);
  }

  if (queryParams) {
    const qs = buildQueryString(queryParams);
    if (qs) {
      url += `?${qs}`;
    }
  }

  return url;
}
