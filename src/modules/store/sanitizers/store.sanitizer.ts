import { SanitizerService } from '@shared/common';
import { CreateStoreDto, UpdateStoreDto } from '../dto';
import { StoreEntity } from '../entities';

/**
 * Sanitiza datos para creación de tienda.
 */
export function sanitizeCreateStoreDto(
  sanitizer: SanitizerService,
  dto: CreateStoreDto,
): Partial<StoreEntity> {
  return {
    company_id: dto.company_id,
    nombre: sanitizer.sanitizeString(dto.nombre),
    codigo: sanitizer.sanitizeString(dto.codigo).toUpperCase(),
    email: dto.email ? sanitizer.sanitizeEmail(dto.email) : undefined,
    telefono: dto.telefono ? sanitizer.sanitizeString(dto.telefono) : undefined,
    direccion: sanitizer.sanitizeString(dto.direccion),
    ciudad: sanitizer.sanitizeString(dto.ciudad),
    zona: dto.zona ? sanitizer.sanitizeString(dto.zona) : undefined,
    latitud: dto.latitud,
    longitud: dto.longitud,
    activo: dto.activo ?? true,
    metadata: dto.metadata,
    geo_city_id: dto.geo_city_id || undefined,
    region: dto.region ? sanitizer.sanitizeString(dto.region) : undefined,
    location_type: dto.location_type || undefined,
    store_format: dto.store_format || undefined,
    seating_capacity: dto.seating_capacity,
    has_drive_thru: dto.has_drive_thru ?? false,
    has_delivery: dto.has_delivery ?? false,
    operating_hours: dto.operating_hours || undefined,
    opening_date: dto.opening_date ? new Date(dto.opening_date) : undefined,
    manager_name: dto.manager_name ? sanitizer.sanitizeString(dto.manager_name) : undefined,
    sales_tier: dto.sales_tier || undefined,
    tags: dto.tags || undefined,
  };
}

/**
 * Sanitiza datos para actualización parcial de tienda.
 */
export function sanitizeUpdateStoreDto(
  sanitizer: SanitizerService,
  dto: UpdateStoreDto,
): Partial<StoreEntity> {
  const sanitized: Partial<StoreEntity> = {};

  if (dto.nombre) sanitized.nombre = sanitizer.sanitizeString(dto.nombre);
  if (dto.email) sanitized.email = sanitizer.sanitizeEmail(dto.email);
  if (dto.telefono) sanitized.telefono = sanitizer.sanitizeString(dto.telefono);
  if (dto.direccion) sanitized.direccion = sanitizer.sanitizeString(dto.direccion);
  if (dto.ciudad) sanitized.ciudad = sanitizer.sanitizeString(dto.ciudad);
  if (dto.zona) sanitized.zona = sanitizer.sanitizeString(dto.zona);
  if (dto.latitud !== undefined) sanitized.latitud = dto.latitud;
  if (dto.longitud !== undefined) sanitized.longitud = dto.longitud;
  if (dto.activo !== undefined) sanitized.activo = dto.activo;
  if (dto.metadata) sanitized.metadata = dto.metadata;

  if (dto.region) sanitized.region = sanitizer.sanitizeString(dto.region);
  if (dto.location_type) sanitized.location_type = dto.location_type;
  if (dto.store_format) sanitized.store_format = dto.store_format;
  if (dto.seating_capacity !== undefined) sanitized.seating_capacity = dto.seating_capacity;
  if (dto.has_drive_thru !== undefined) sanitized.has_drive_thru = dto.has_drive_thru;
  if (dto.has_delivery !== undefined) sanitized.has_delivery = dto.has_delivery;
  if (dto.operating_hours) sanitized.operating_hours = dto.operating_hours;
  if (dto.opening_date) sanitized.opening_date = new Date(dto.opening_date);
  if (dto.manager_name) sanitized.manager_name = sanitizer.sanitizeString(dto.manager_name);
  if (dto.sales_tier) sanitized.sales_tier = dto.sales_tier;
  if (dto.tags) sanitized.tags = dto.tags;

  return sanitized;
}

