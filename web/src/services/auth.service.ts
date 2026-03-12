import api from './api';
import { AUTH_GATEWAY } from './gateway';
import type { ApiResponse, LoginResponse, AuthTokens, RegisterData, RegisterResponse, User } from '../types';
import type { AxiosResponse } from 'axios';

export const authService = {
  login: (data: { email: string; password: string }): Promise<AxiosResponse<ApiResponse<LoginResponse>>> =>
    api.post(AUTH_GATEWAY.POST.LOGIN, data),
  register: (data: RegisterData): Promise<AxiosResponse<ApiResponse<RegisterResponse>>> =>
    api.post(AUTH_GATEWAY.POST.REGISTER, data),
  profile: (): Promise<AxiosResponse<ApiResponse<User>>> =>
    api.get(AUTH_GATEWAY.GET.PROFILE),
  refresh: (refreshToken: string): Promise<AxiosResponse<ApiResponse<AuthTokens>>> =>
    api.post(AUTH_GATEWAY.POST.REFRESH, { refreshToken }),
};
