export const LOGGER_MESSAGES = {
  CREATED: 'Log creado exitosamente',
  FETCHED: 'Logs obtenidos exitosamente',
  FOUND: 'Log encontrado',
  STATS_FETCHED: 'Estadisticas obtenidas',
  SUMMARY_FETCHED: 'Resumen obtenido',
  FLUSHED: 'Buffer vaciado exitosamente',
  foundMany: (count: number) => `Se encontraron ${count} logs`,
  foundErrors: (count: number) => `Se encontraron ${count} errores`,
  deleted: (count: number) => `Se eliminaron ${count} logs`,
  deletedDebug: (count: number) => `Se eliminaron ${count} logs de debug/verbose`,
} as const;

export const LOGGER_DEFAULTS = {
  BUFFER_SIZE: 100,
  FLUSH_INTERVAL_MS: 5000,
  DELETE_OLD_DAYS: 30,
  DELETE_DEBUG_DAYS: 3,
  FIND_BY_USER_LIMIT: 100,
  RECENT_ERRORS_HOURS: 24,
  RECENT_ERRORS_LIMIT: 100,
  SUMMARY_AVG_HOURS: 24,
  SUMMARY_RECENT_ERROR_HOURS: 1,
  SUMMARY_RECENT_ERROR_LIMIT: 5,
} as const;

export const LOGGER_REDACT_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
] as const;
