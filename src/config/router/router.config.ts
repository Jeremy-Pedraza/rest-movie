import { registerAs } from '@nestjs/config';

export default registerAs('router', () => ({
  externalServices: {
    payment: {
      baseUrl: process.env.PAYMENT_API_URL || 'https://api.payment.example.com',
      version: 'v1',
      timeout: parseInt(process.env.PAYMENT_API_TIMEOUT || '30000', 10),
    },
    notification: {
      baseUrl: process.env.NOTIFICATION_API_URL || 'https://api.notifications.example.com',
      version: 'v1',
      timeout: parseInt(process.env.NOTIFICATION_API_TIMEOUT || '10000', 10),
    },
    auth: {
      baseUrl: process.env.AUTH_API_URL || 'https://auth.example.com',
      version: 'v2',
      timeout: parseInt(process.env.AUTH_API_TIMEOUT || '15000', 10),
    },
    storage: {
      baseUrl: process.env.STORAGE_API_URL || 'https://storage.example.com',
      version: 'v1',
      timeout: parseInt(process.env.STORAGE_API_TIMEOUT || '60000', 10),
    },
    geo: {
      baseUrl: process.env.GEO_API_URL || 'https://api.geo.example.com',
      version: 'v1',
      timeout: parseInt(process.env.GEO_API_TIMEOUT || '5000', 10),
    },
  },

  retry: {
    maxRetries: parseInt(process.env.HTTP_MAX_RETRIES || '3', 10),
    initialDelay: parseInt(process.env.HTTP_RETRY_INITIAL_DELAY || '1000', 10),
    backoffFactor: parseInt(process.env.HTTP_RETRY_BACKOFF_FACTOR || '2', 10),
    maxDelay: parseInt(process.env.HTTP_RETRY_MAX_DELAY || '10000', 10),
    retryableStatusCodes: (process.env.HTTP_RETRYABLE_STATUS_CODES || '408,429,500,502,503,504')
      .split(',')
      .map((code) => parseInt(code.trim(), 10)),
  },

  timeout: {
    default: parseInt(process.env.HTTP_TIMEOUT_DEFAULT || '30000', 10),
    short: parseInt(process.env.HTTP_TIMEOUT_SHORT || '5000', 10),
    medium: parseInt(process.env.HTTP_TIMEOUT_MEDIUM || '15000', 10),
    long: parseInt(process.env.HTTP_TIMEOUT_LONG || '60000', 10),
    upload: parseInt(process.env.HTTP_TIMEOUT_UPLOAD || '120000', 10),
  },

  /** Hosts adicionales permitidos para SSRF (además de los externos configurados) */
  allowedHosts: (process.env.HTTP_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean),
}));
