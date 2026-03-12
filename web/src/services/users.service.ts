import api from './api';
import { USERS_GATEWAY } from './gateway';
import type { ApiResponse, PaginatedData, CrudParams } from '../types';
import type { AxiosResponse } from 'axios';

export const usersService = {
  getAll: (params?: CrudParams): Promise<AxiosResponse<ApiResponse<PaginatedData>>> =>
    api.get(USERS_GATEWAY.GET.LIST, { params }),
  approve: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.patch(USERS_GATEWAY.PATCH.APPROVE(id)),
  deactivate: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.patch(USERS_GATEWAY.PATCH.DEACTIVATE(id)),
};
