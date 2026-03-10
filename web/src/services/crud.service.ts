import api from './api';
import type { CrudService, CrudParams } from '../types';

function createCrudService(resource: string): CrudService {
  return {
    getAll: (params?: CrudParams) => api.get(`/${resource}`, { params }),
    getById: (id) => api.get(`/${resource}/${id}`),
    create: (data) => api.post(`/${resource}`, data),
    update: (id, data) => api.put(`/${resource}/${id}`, data),
    delete: (id) => api.delete(`/${resource}/${id}`),
  };
}

export const mediaService = createCrudService('media');
export const directorsService = createCrudService('directors');
export const genresService = createCrudService('genres');
export const producersService = createCrudService('producers');
export const typesService = createCrudService('types');
export const rolesService = createCrudService('roles');
