import type { AxiosResponse } from 'axios';
import type { ReactNode } from 'react';

// ============================================
// Tipos de usuario y autenticación
// ============================================

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<string>;
  logout: () => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// ============================================
// Tipos de API y CRUD
// ============================================

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedData<T = Record<string, unknown>> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface CrudParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export interface CrudService {
  getAll: (params?: CrudParams) => Promise<AxiosResponse<ApiResponse<PaginatedData | Record<string, unknown>[]>>>;
  getById: (id: number | string) => Promise<AxiosResponse<ApiResponse>>;
  create: (data: Record<string, unknown>) => Promise<AxiosResponse<ApiResponse>>;
  update: (id: number | string, data: Record<string, unknown>) => Promise<AxiosResponse<ApiResponse>>;
  delete: (id: number | string) => Promise<AxiosResponse<ApiResponse>>;
}

// ============================================
// Tipos de componentes
// ============================================

export interface Column {
  key: string;
  label: string;
  render?: (item: Record<string, unknown>) => ReactNode;
}

export interface FormComponentProps {
  initialData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  isEditing: boolean;
}

export interface CrudPageProps {
  title: string;
  service: CrudService;
  columns: Column[];
  FormComponent: React.ComponentType<FormComponentProps & Record<string, unknown>>;
  defaultValues?: Record<string, unknown>;
  hideDelete?: boolean;
}

// ============================================
// Tipos de alertas y constantes
// ============================================

export type AlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface AlertMessage {
  title: string;
  text: string;
  icon: AlertIcon;
}

export interface ConfirmMessage extends AlertMessage {
  confirmButtonText: string;
  cancelButtonText: string;
}

// ============================================
// Tipos de Health
// ============================================

export interface HealthInfo {
  status?: string;
  node?: string;
  app?: string;
  uptime?: string;
  pid?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export interface HealthMemory {
  memory?: {
    rss?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface HealthDb {
  status?: string;
  [key: string]: unknown;
}

// ============================================
// Tipos de relaciones (MediaPage)
// ============================================

export interface Genre {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface Director {
  id: number;
  names: string;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Producer {
  id: number;
  name: string;
  slogan?: string;
  description?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface MediaType {
  id: number;
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

// ============================================
// Tipos del catálogo público
// ============================================

export interface CatalogParams {
  page?: number;
  limit?: number;
  search?: string;
  genreId?: string;
  typeId?: string;
  directorId?: string;
  producerId?: string;
  releaseYear?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CatalogItem {
  id: string;
  serial: string;
  title: string;
  synopsis?: string;
  coverImage?: string;
  releaseYear: number;
  genre?: { id: string; name: string };
  director?: { id: string; names: string };
  producer?: { id: string; name: string };
  type?: { id: string; name: string };
}

export interface CatalogDetail extends CatalogItem {
  url?: string;
}

export interface MediaRelations {
  genres: Genre[];
  directors: Director[];
  producers: Producer[];
  types: MediaType[];
}

export interface MediaItem {
  id: number;
  serial: string;
  title: string;
  synopsis?: string;
  url: string;
  coverImage?: string;
  releaseYear: number;
  genre?: Genre;
  director?: Director;
  producer?: Producer;
  type?: MediaType;
  genreId?: number;
  directorId?: number;
  producerId?: number;
  typeId?: number;
  [key: string]: unknown;
}
