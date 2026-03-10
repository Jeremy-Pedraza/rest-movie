import api from './api';

export const healthService = {
  status: () => api.get('/health'),
  ready: () => api.get('/health/ready'),
  info: () => api.get('/health/info'),
  memoryMetrics: () => api.get('/health/metrics/memory'),
  dbMetrics: () => api.get('/health/metrics/database'),
};
