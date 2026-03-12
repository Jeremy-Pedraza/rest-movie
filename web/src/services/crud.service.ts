import api from './api';
import type { CrudService, CrudParams } from '../types';
import type { CrudGateway } from './gateway';
import {
  MEDIA_GATEWAY,
  DIRECTORS_GATEWAY,
  GENRES_GATEWAY,
  PRODUCERS_GATEWAY,
  TYPES_GATEWAY,
  ROLES_GATEWAY,
} from './gateway';

function createCrudService(gateway: CrudGateway): CrudService {
  return {
    getAll: (params?: CrudParams) => api.get(gateway.GET.LIST, { params }),
    getById: (id) => api.get(gateway.GET.BY_ID(id)),
    create: (data) => api.post(gateway.POST.CREATE, data),
    update: (id, data) => api.put(gateway.PUT.UPDATE(id), data),
    delete: (id) => api.delete(gateway.DELETE.REMOVE(id)),
  };
}

export const mediaService = createCrudService(MEDIA_GATEWAY);
export const directorsService = createCrudService(DIRECTORS_GATEWAY);
export const genresService = createCrudService(GENRES_GATEWAY);
export const producersService = createCrudService(PRODUCERS_GATEWAY);
export const typesService = createCrudService(TYPES_GATEWAY);
export const rolesService = createCrudService(ROLES_GATEWAY);
