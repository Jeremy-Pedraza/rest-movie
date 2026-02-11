import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,

  // Resiliencia y reconexión
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '10', 10),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
  retryDelayMs: parseInt(process.env.REDIS_RETRY_DELAY_MS || '200', 10),
  retryMaxDelayMs: parseInt(process.env.REDIS_RETRY_MAX_DELAY_MS || '5000', 10),
  enableOfflineQueue: process.env.REDIS_OFFLINE_QUEUE !== 'false',

  // Política de errores: 'fail-open' (devolver defaults) o 'fail-fast' (propagar error)
  errorPolicy: (process.env.REDIS_ERROR_POLICY as 'fail-open' | 'fail-fast') || 'fail-open',

  // Flush habilitado (bloqueable por ambiente)
  flushEnabled: process.env.CACHE_FLUSH_ENABLED === 'true',
}));
