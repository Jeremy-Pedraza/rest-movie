// src/modules/store/interfaces/store-response.interface.ts

/**
 * Interfaces de respuesta para el módulo Store
 *
 * @version 2.0.0 - Agregados campos de segmentación (FASE 2)
 */

/**
 * Interfaz para horarios de operación
 */
export interface IOperatingHoursResponse {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

/**
 * Respuesta estándar de una tienda
 *
 * @description
 * Estructura de datos que se retorna en las respuestas de la API
 * para operaciones con tiendas.
 * Incluye campos de segmentación para reportes multi-tenant.
 */
export interface IStoreResponse {
  id: string;
  company_id: string;
  company_name?: string; // Populated cuando se incluye la relación

  // Información básica
  nombre: string;
  codigo: string;
  email?: string;
  telefono?: string;

  // Ubicación
  direccion: string;
  ciudad: string;
  zona?: string;
  latitud?: number;
  longitud?: number;

  // Campos de segmentación (FASE 2)
  region?: string;
  location_type?: string;
  store_format?: string;
  seating_capacity?: number;
  has_drive_thru: boolean;
  has_delivery: boolean;
  operating_hours?: IOperatingHoursResponse;
  opening_date?: Date;
  manager_name?: string;
  sales_tier?: string;
  tags?: string[];

  // Estado
  activo: boolean;
  metadata?: Record<string, any>;

  // Timestamps
  created_at: Date;
  updated_at?: Date;
}

/**
 * Respuesta simplificada de tienda (para listados y selects)
 */
export interface IStoreListResponse {
  id: string;
  nombre: string;
  codigo: string;
  ciudad: string;
  region?: string;
  store_format?: string;
  sales_tier?: string;
  activo: boolean;
}

/**
 * Respuesta de tienda con información de reportes
 *
 * @description
 * Extiende IStoreResponse agregando contadores de reportes
 * para endpoints que retornan información agregada.
 */
export interface IStoreWithReportsResponse extends IStoreResponse {
  reports_count: number;
  reports_today_count: number;
  last_report_date?: Date;
}

/**
 * Respuesta de tienda con usuarios asignados
 *
 * @description
 * Extiende IStoreResponse agregando información de usuarios
 * asignados a la tienda (solo rol USER).
 */
export interface IStoreWithUsersResponse extends IStoreResponse {
  assigned_users_count: number;
  assigned_users?: Array<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  }>;
}

/**
 * Respuesta de estadísticas de tiendas
 *
 * @description
 * Estructura para endpoints de estadísticas globales
 * del módulo de tiendas.
 * Incluye segmentación por región, tipo y formato.
 */
export interface IStoreStatsResponse {
  total_stores: number;
  active_stores: number;
  inactive_stores: number;

  // Por compañía
  stores_by_company: Array<{
    company_id: string;
    company_name: string;
    stores_count: number;
  }>;

  // Por ciudad
  stores_by_city: Array<{
    ciudad: string;
    count: number;
  }>;

  // Por segmentación (FASE 2)
  stores_by_region: Array<{
    region: string;
    count: number;
  }>;

  stores_by_location_type: Array<{
    location_type: string;
    count: number;
  }>;

  stores_by_format: Array<{
    store_format: string;
    count: number;
  }>;

  stores_by_sales_tier: Array<{
    sales_tier: string;
    count: number;
  }>;

  // Servicios
  stores_with_drive_thru: number;
  stores_with_delivery: number;
}

/**
 * Respuesta de consolidado por región
 *
 * @description
 * Para reportes consolidados por región geográfica
 */
export interface IStoresByRegionResponse {
  region: string;
  stores: IStoreListResponse[];
  total_stores: number;
  active_stores: number;
}

/**
 * Respuesta de segmentación de tienda
 *
 * @description
 * Subset de datos de segmentación útil para filtros
 * y dashboards.
 */
export interface IStoreSegmentationResponse {
  id: string;
  nombre: string;
  codigo: string;
  region?: string;
  location_type?: string;
  store_format?: string;
  sales_tier?: string;
  has_drive_thru: boolean;
  has_delivery: boolean;
  tags?: string[];
}
