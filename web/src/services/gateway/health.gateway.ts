const BASE = '/health';

export const HEALTH_GATEWAY = {
  GET: {
    STATUS: BASE,
    READY: `${BASE}/ready`,
    INFO: `${BASE}/info`,
    MEMORY_METRICS: `${BASE}/metrics/memory`,
    DB_METRICS: `${BASE}/metrics/database`,
  },
} as const;
