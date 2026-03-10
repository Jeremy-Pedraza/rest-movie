import type { AlertIcon, AlertMessage, ConfirmMessage } from '../types';

// ============================================
// CONSTANTES GLOBALES - Frontend REST API
// ============================================

// --------------------------------------------------
// Tipos de alerta (mapean a SweetAlert2 icons)
// --------------------------------------------------
export const ALERT_TYPE: Record<string, AlertIcon> = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  QUESTION: 'question',
};

// --------------------------------------------------
// Códigos HTTP agrupados por categoría
// --------------------------------------------------
export const HTTP_STATUS = {
  // 2xx - Éxito
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // 4xx - Errores del cliente
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx - Errores del servidor
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// --------------------------------------------------
// Mensajes por defecto según código HTTP
// --------------------------------------------------
export const HTTP_MESSAGES: Record<number, AlertMessage> = {
  [HTTP_STATUS.BAD_REQUEST]: {
    title: 'Solicitud inválida',
    text: 'Los datos enviados no son válidos. Revisa el formulario e intenta de nuevo.',
    icon: 'warning',
  },
  [HTTP_STATUS.UNAUTHORIZED]: {
    title: 'No autorizado',
    text: 'Tu sesión ha expirado o no tienes credenciales válidas.',
    icon: 'warning',
  },
  [HTTP_STATUS.FORBIDDEN]: {
    title: 'Acceso denegado',
    text: 'No tienes permisos suficientes para realizar esta acción.',
    icon: 'error',
  },
  [HTTP_STATUS.NOT_FOUND]: {
    title: 'No encontrado',
    text: 'El recurso solicitado no existe o fue eliminado.',
    icon: 'info',
  },
  [HTTP_STATUS.CONFLICT]: {
    title: 'Conflicto',
    text: 'Ya existe un registro con estos datos. Verifica e intenta de nuevo.',
    icon: 'warning',
  },
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: {
    title: 'Error de validación',
    text: 'Algunos campos no cumplen con las reglas de validación.',
    icon: 'warning',
  },
  [HTTP_STATUS.TOO_MANY_REQUESTS]: {
    title: 'Demasiadas solicitudes',
    text: 'Has excedido el límite de peticiones. Espera un momento e intenta de nuevo.',
    icon: 'warning',
  },
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
    title: 'Error del servidor',
    text: 'Ocurrió un error interno. Intenta de nuevo más tarde.',
    icon: 'error',
  },
  [HTTP_STATUS.BAD_GATEWAY]: {
    title: 'Servidor no disponible',
    text: 'El servidor no pudo procesar la solicitud. Intenta más tarde.',
    icon: 'error',
  },
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: {
    title: 'Servicio no disponible',
    text: 'El servidor está en mantenimiento o sobrecargado.',
    icon: 'error',
  },
  [HTTP_STATUS.GATEWAY_TIMEOUT]: {
    title: 'Tiempo de espera agotado',
    text: 'El servidor tardó demasiado en responder.',
    icon: 'error',
  },
};

// --------------------------------------------------
// Mensajes de respuestas exitosas por operación CRUD
// --------------------------------------------------
export const SUCCESS_MESSAGES: Record<string, AlertMessage> = {
  CREATED: {
    title: 'Creado',
    text: 'El registro fue creado exitosamente.',
    icon: 'success',
  },
  UPDATED: {
    title: 'Actualizado',
    text: 'El registro fue actualizado exitosamente.',
    icon: 'success',
  },
  DELETED: {
    title: 'Eliminado',
    text: 'El registro fue eliminado exitosamente.',
    icon: 'success',
  },
  LOGIN: {
    title: 'Bienvenido',
    text: 'Has iniciado sesión correctamente.',
    icon: 'success',
  },
  REGISTER: {
    title: 'Cuenta creada',
    text: 'Tu cuenta fue registrada exitosamente.',
    icon: 'success',
  },
  LOGOUT: {
    title: 'Sesión cerrada',
    text: 'Has cerrado sesión correctamente.',
    icon: 'info',
  },
};

// --------------------------------------------------
// Mensajes de confirmación
// --------------------------------------------------
export const CONFIRM_MESSAGES: Record<string, ConfirmMessage> = {
  DELETE: {
    title: '¿Eliminar registro?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  },
  LOGOUT: {
    title: '¿Cerrar sesión?',
    text: 'Tendrás que iniciar sesión de nuevo.',
    icon: 'question',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar',
  },
};

// --------------------------------------------------
// Error genérico cuando no hay conexión / error de red
// --------------------------------------------------
export const NETWORK_ERROR: AlertMessage = {
  title: 'Error de conexión',
  text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
  icon: 'error',
};

// --------------------------------------------------
// Configuración por defecto de SweetAlert2
// --------------------------------------------------
export const SWAL_DEFAULTS = {
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  allowOutsideClick: false,
};

// --------------------------------------------------
// Timers para auto-close (ms)
// --------------------------------------------------
export const ALERT_TIMERS = {
  TOAST: 2500,
  SUCCESS: 1800,
  INFO: 3000,
  ERROR: 0, // no auto-close
};
