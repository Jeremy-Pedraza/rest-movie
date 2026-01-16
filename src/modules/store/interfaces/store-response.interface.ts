// src/modules/store/interfaces/store-response.interface.ts

/**
 * Interfaces de respuesta para el módulo Store
 */

/**
 * Respuesta estándar de una tienda
 *
 * @description
 * Estructura de datos que se retorna en las respuestas de la API
 * para operaciones con tiendas.
 */
export interface IStoreResponse {
  id: string;
  company_id: string;
  company_name?: string; // Populated cuando se incluye la relación
  nombre: string;
  codigo: string;
  email?: string;
  telefono?: string;
  direccion: string;
  ciudad: string;
  zona?: string;
  latitud?: number;
  longitud?: number;
  activo: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at?: Date;
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
 */
export interface IStoreStatsResponse {
  total_stores: number;
  active_stores: number;
  inactive_stores: number;
  stores_by_company: Array<{
    company_id: string;
    company_name: string;
    stores_count: number;
  }>;
  stores_by_city: Array<{
    ciudad: string;
    count: number;
  }>;
}
