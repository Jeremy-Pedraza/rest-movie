// src/shared/common/interfaces/paginated-response.interface.ts

/**
 * IPaginationMeta - Metadatos de paginación
 *
 * Contiene información sobre el estado actual de la paginación.
 *
 * @example
 * ```json
 * {
 *   "page": 1,
 *   "limit": 10,
 *   "total": 100,
 *   "totalPages": 10,
 *   "hasNextPage": true,
 *   "hasPrevPage": false
 * }
 * ```
 */
export interface IPaginationMeta {
  /**
   * Página actual (1-indexed)
   */
  page: number;

  /**
   * Cantidad de items por página
   */
  limit: number;

  /**
   * Total de items en la base de datos
   */
  total: number;

  /**
   * Total de páginas disponibles
   */
  totalPages: number;

  /**
   * Indica si existe una página siguiente
   */
  hasNextPage: boolean;

  /**
   * Indica si existe una página anterior
   */
  hasPrevPage: boolean;
}

/**
 * IPaginatedResponse - Respuesta paginada estándar
 *
 * @template T - Tipo de items en la lista
 *
 * @example
 * ```json
 * {
 *   "data": [{ "id": "1", "name": "Item 1" }],
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 100,
 *     "totalPages": 10,
 *     "hasNextPage": true,
 *     "hasPrevPage": false
 *   }
 * }
 * ```
 */
export interface IPaginatedResponse<T> {
  /**
   * Lista de items de la página actual
   */
  data: T[];

  /**
   * Metadatos de paginación
   */
  meta: IPaginationMeta;
}

/**
 * IPaginationOptions - Opciones de entrada para paginación
 */
export interface IPaginationOptions {
  /**
   * Número de página (1-indexed)
   * @default 1
   */
  page?: number;

  /**
   * Cantidad de items por página
   * @default 10
   */
  limit?: number;
}

/**
 * ISortOptions - Opciones de ordenamiento
 */
export interface ISortOptions {
  /**
   * Campo por el cual ordenar
   */
  sortBy?: string;

  /**
   * Dirección del ordenamiento
   * @default 'DESC'
   */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * IQueryOptions - Combinación de paginación y ordenamiento
 */
export interface IQueryOptions extends IPaginationOptions, ISortOptions {
  /**
   * Término de búsqueda
   */
  search?: string;
}
