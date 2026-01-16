// src/modules/company/interfaces/company-response.interface.ts

/**
 * Interfaces de respuesta para el módulo Company
 */

/**
 * Respuesta estándar de una compañía
 *
 * @description
 * Estructura de datos que se retorna en las respuestas de la API
 * para operaciones con compañías.
 */
export interface ICompanyResponse {
  id: string;
  name: string;
  schema?: string;
  domain?: string;
  subdomain?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  pais: string;
  ciudad: string;
  ruc: string;
  is_active: boolean;
  plan?: string;
  plan_expires_at?: Date;
  settings?: Record<string, any>;
  created_at: Date;
  updated_at?: Date;
}

/**
 * Respuesta de compañía con información de tiendas
 *
 * @description
 * Extiende ICompanyResponse agregando contadores de tiendas
 * para endpoints que retornan información agregada.
 */
export interface ICompanyWithStoresResponse extends ICompanyResponse {
  stores_count: number;
  active_stores_count: number;
}

/**
 * Respuesta de estadísticas de compañías
 *
 * @description
 * Estructura para endpoints de estadísticas globales
 * del módulo de compañías.
 */
export interface ICompanyStatsResponse {
  total_companies: number;
  active_companies: number;
  inactive_companies: number;
  total_stores: number;
  companies_by_country: Array<{
    pais: string;
    count: number;
  }>;
  companies_by_plan: Array<{
    plan: string;
    count: number;
  }>;
}
