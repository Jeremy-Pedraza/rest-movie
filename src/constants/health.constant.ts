export const HEALTH_STATUS = {
  OK: 'ok',
} as const;

export const HEALTH_INDICATORS = {
  DATABASE: 'database',
  DISK: 'disk',
  MEMORY_HEAP: 'memory_heap',
  MEMORY_RSS: 'memory_rss',
} as const;

export const HEALTH_THRESHOLDS = {
  MEMORY_HEAP_BYTES: 300 * 1024 * 1024,
  MEMORY_RSS_BYTES: 500 * 1024 * 1024,
  DISK_USAGE_PERCENT: 0.9,
} as const;

export const APP_INFO_DEFAULTS = {
  NAME: 'Rest-backend',
  VERSION: '1.0.0',
} as const;
