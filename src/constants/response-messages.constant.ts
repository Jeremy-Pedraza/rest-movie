export const RESPONSE_MESSAGES = {
  // Success Messages
  SUCCESS: {
    CREATED: 'Recurso creado exitosamente',
    UPDATED: 'Recurso actualizado exitosamente',
    DELETED: 'Recurso eliminado exitosamente',
    RESTORED: 'Recurso restaurado exitosamente',
    FETCHED: 'Datos obtenidos exitosamente',
    OPERATION_SUCCESS: 'Operación realizada exitosamente',
  },

  // Auth Messages
  AUTH: {
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT_SUCCESS: 'Sesión cerrada exitosamente',
    REGISTER_SUCCESS: 'Usuario registrado exitosamente',
    PASSWORD_CHANGED: 'Contraseña actualizada exitosamente',
    PASSWORD_RESET_SENT: 'Se ha enviado un correo para restablecer la contraseña',
    PASSWORD_RESET_SUCCESS: 'Contraseña restablecida exitosamente',
    EMAIL_VERIFIED: 'Correo electrónico verificado exitosamente',
    TOKEN_REFRESHED: 'Token actualizado exitosamente',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    USER_NOT_FOUND: 'Usuario no encontrado',
    USER_INACTIVE: 'Usuario inactivo',
    USER_LOCKED: 'Usuario bloqueado temporalmente',
    TOKEN_EXPIRED: 'Token expirado',
    TOKEN_INVALID: 'Token inválido',
    TOKEN_TYPE: 'Bearer',
    UNAUTHORIZED: 'No autorizado',
    FORBIDDEN: 'Acceso denegado',
    SESSION_EXPIRED: 'Sesión expirada',
  },

  // Validation Messages
  VALIDATION: {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_EMAIL: 'Correo electrónico inválido',
    INVALID_PASSWORD: 'La contraseña no cumple con los requisitos',
    PASSWORDS_NOT_MATCH: 'Las contraseñas no coinciden',
    INVALID_FORMAT: 'Formato inválido',
    MIN_LENGTH: 'Longitud mínima no alcanzada',
    MAX_LENGTH: 'Longitud máxima excedida',
    INVALID_UUID: 'UUID inválido',
  },

  // Resource Messages
  RESOURCE: {
    NOT_FOUND: 'Recurso no encontrado',
    ALREADY_EXISTS: 'El recurso ya existe',
    CONFLICT: 'Conflicto con el recurso existente',
    DELETED: 'El recurso ha sido eliminado',
  },

  // Error Messages
  ERROR: {
    INTERNAL_SERVER: 'Error interno del servidor',
    SERVICE_UNAVAILABLE: 'Servicio no disponible',
    RATE_LIMIT: 'Demasiadas solicitudes, intente más tarde',
    REQUEST_TIMEOUT: 'Tiempo de espera agotado',
    DATABASE_ERROR: 'Error de base de datos',
  },
} as const;
