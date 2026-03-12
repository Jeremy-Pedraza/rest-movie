import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import alert from './alert';
import { HTTP_STATUS } from '../constants';
import { AUTH_GATEWAY } from './gateway';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _silent?: boolean;
}

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// --------------------------------------------------
// Interceptor de request: inyectar token JWT
// --------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --------------------------------------------------
// Interceptor de response: manejo global de errores
// --------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Refresh token automático en 401
    if (
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}${AUTH_GATEWAY.POST.REFRESH}`, {
            refreshToken,
          });
          const tokens = (data as { data: { accessToken: string; refreshToken: string } }).data;
          localStorage.setItem('access_token', tokens.accessToken);
          localStorage.setItem('refresh_token', tokens.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }

    // Mostrar alerta global si no se marcó como silenciada
    if (!originalRequest._silent) {
      alert.handleHttpError(error as AxiosError<{ message?: string | string[]; details?: Record<string, string[]> }>);
    }

    return Promise.reject(error);
  },
);

export default api;
