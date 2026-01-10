/**
 * HTTP Status Codes con descripciones
 * Referencia: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */
export const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Mensajes por defecto para cada status code
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.OK]: 'Operación exitosa',
  [HTTP_STATUS.CREATED]: 'Recurso creado exitosamente',
  [HTTP_STATUS.ACCEPTED]: 'Solicitud aceptada',
  [HTTP_STATUS.NO_CONTENT]: 'Sin contenido',
  [HTTP_STATUS.BAD_REQUEST]: 'Solicitud inválida',
  [HTTP_STATUS.UNAUTHORIZED]: 'No autorizado',
  [HTTP_STATUS.FORBIDDEN]: 'Acceso denegado',
  [HTTP_STATUS.NOT_FOUND]: 'Recurso no encontrado',
  [HTTP_STATUS.METHOD_NOT_ALLOWED]: 'Método no permitido',
  [HTTP_STATUS.CONFLICT]: 'Conflicto con el recurso existente',
  [HTTP_STATUS.GONE]: 'Recurso ya no disponible',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Entidad no procesable',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Demasiadas solicitudes',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Error interno del servidor',
  [HTTP_STATUS.NOT_IMPLEMENTED]: 'No implementado',
  [HTTP_STATUS.BAD_GATEWAY]: 'Bad Gateway',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Servicio no disponible',
  [HTTP_STATUS.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};
