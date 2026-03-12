import api from './api';
import { CATALOG_GATEWAY } from './gateway';
import type { ApiResponse, PaginatedData, CatalogItem, CatalogDetail, CatalogParams, Genre, MediaType } from '../types';
import type { AxiosResponse } from 'axios';

export const catalogService = {
  getAll: (params?: CatalogParams): Promise<AxiosResponse<ApiResponse<PaginatedData<CatalogItem>>>> =>
    api.get(CATALOG_GATEWAY.GET.LIST, { params }),

  getFeatured: (): Promise<AxiosResponse<ApiResponse<CatalogItem[]>>> =>
    api.get(CATALOG_GATEWAY.GET.FEATURED),

  getById: (id: string): Promise<AxiosResponse<ApiResponse<CatalogDetail>>> =>
    api.get(CATALOG_GATEWAY.GET.BY_ID(id)),

  getGenres: (): Promise<AxiosResponse<ApiResponse<Genre[]>>> =>
    api.get(CATALOG_GATEWAY.GET.GENRES),

  getTypes: (): Promise<AxiosResponse<ApiResponse<MediaType[]>>> =>
    api.get(CATALOG_GATEWAY.GET.TYPES),
};
