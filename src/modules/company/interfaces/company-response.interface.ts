// src/modules/company/interfaces/company-response.interface.ts

/**
 * Interfaces de respuesta para el módulo Company
 *
 * @version 2.0.0 - Agregados campos de internacionalización (FASE 1)
 */

/**
 * Configuración fiscal de la empresa
 */
export interface ITaxConfigResponse {
  tax_rate: number;
  tax_name: string;
  tax_included: boolean;
  rules?: {
    reduced_rate?: number;
    exempt_categories?: string[];
  };
}

/**
 * Respuesta estándar de una compañía
 *
 * @description
 * Estructura de datos que se retorna en las respuestas de la API
 * para operaciones con compañías.
 * Incluye campos de internacionalización para soporte multi-país.
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

  // Campos de internacionalización (FASE 1)
  timezone: string;
  country_code: string;
  departamento?: string;
  currency_code: string;
  currency_symbol: string;
  date_format: string;
  tax_config?: ITaxConfigResponse;

  // Timestamps
  created_at: Date;
  updated_at?: Date;
}

/**
 * Respuesta simplificada de compañía (para listados)
 *
 * @description
 * Versión reducida para listados y selects
 */
export interface ICompanyListResponse {
  id: string;
  name: string;
  subdomain?: string;
  country_code: string;
  currency_code: string;
  is_active: boolean;
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
    country_code: string;
    count: number;
  }>;
  companies_by_plan: Array<{
    plan: string;
    count: number;
  }>;
  companies_by_currency: Array<{
    currency_code: string;
    currency_symbol: string;
    count: number;
  }>;
}

/**
 * Datos de internacionalización de la empresa
 *
 * @description
 * Subset de datos de internacionalización útil para formateo
 * en frontend y reportes.
 */
export interface ICompanyLocaleResponse {
  id: string;
  name: string;
  country_code: string;
  timezone: string;
  currency_code: string;
  currency_symbol: string;
  date_format: string;
  tax_config?: ITaxConfigResponse;
}
