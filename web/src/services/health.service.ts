import api from './api';
import { HEALTH_GATEWAY } from './gateway';

export const healthService = {
  status: () => api.get(HEALTH_GATEWAY.GET.STATUS),
  ready: () => api.get(HEALTH_GATEWAY.GET.READY),
  info: () => api.get(HEALTH_GATEWAY.GET.INFO),
  memoryMetrics: () => api.get(HEALTH_GATEWAY.GET.MEMORY_METRICS),
  dbMetrics: () => api.get(HEALTH_GATEWAY.GET.DB_METRICS),
};
