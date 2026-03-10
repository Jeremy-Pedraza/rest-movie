import api from './api';
import type { ApiResponse, AuthTokens, RegisterData, User } from '../types';
import type { AxiosResponse } from 'axios';

export const authService = {
  login: (data: { email: string; password: string }): Promise<AxiosResponse<ApiResponse<AuthTokens>>> =>
    api.post('/auth/login', data),
  register: (data: RegisterData): Promise<AxiosResponse<ApiResponse<AuthTokens>>> =>
    api.post('/auth/register', data),
  profile: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get('/auth/profile'),
  refresh: (refreshToken: string): Promise<AxiosResponse<ApiResponse<AuthTokens>>> =>
    api.post('/auth/refresh', { refreshToken }),
};
