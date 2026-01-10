// src/shared/common/interfaces/query-builder.interface.ts
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

/**
 * IQueryBuilderOptions - Opciones genéricas para query builders
 *
 * Define la estructura de opciones que los repositories pueden usar
 * para construir queries dinámicas.
 */
export interface IQueryBuilderOptions {
  /**
   * Alias de la tabla principal
   */
  alias?: string;

  /**
   * Incluir registros eliminados (soft deleted)
   * @default false
   */
  withDeleted?: boolean;

  /**
   * Relaciones a cargar (eager loading)
   */
  relations?: string[];

  /**
   * Campos a seleccionar
   */
  select?: string[];
}

/**
 * IFilterOptions - Opciones de filtrado genéricas
 */
export interface IFilterOptions {
  /**
   * Filtros de igualdad exacta
   * @example { status: 'active', isPublic: true }
   */
  where?: Record<string, any>;

  /**
   * Filtros de búsqueda parcial (ILIKE)
   * @example { name: 'john', email: 'gmail' }
   */
  search?: Record<string, string>;

  /**
   * Filtros de rango
   * @example { price: { min: 10, max: 100 } }
   */
  range?: Record<string, { min?: number; max?: number }>;

  /**
   * Filtros de inclusión (IN)
   * @example { status: ['active', 'pending'] }
   */
  in?: Record<string, any[]>;

  /**
   * Filtros de fecha
   * @example { createdAt: { from: '2024-01-01', to: '2024-12-31' } }
   */
  dateRange?: Record<string, { from?: Date | string; to?: Date | string }>;
}

/**
 * IBaseRepository - Interface base para repositories
 *
 * Define los métodos que TODOS los repositories deben implementar.
 *
 * @template T - Tipo de la entidad
 * @template CreateDto - DTO para creación
 * @template UpdateDto - DTO para actualización
 * @template QueryDto - DTO para queries/filtros
 */
export interface IBaseRepository<T, CreateDto, UpdateDto, QueryDto> {
  /**
   * Crear una nueva entidad
   */
  create(data: CreateDto): Promise<T>;

  /**
   * Buscar por ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Buscar por ID o lanzar excepción
   */
  findByIdOrFail(id: string): Promise<T>;

  /**
   * Buscar todos con filtros y paginación
   */
  findAll(query: QueryDto): Promise<[T[], number]>;

  /**
   * Actualizar una entidad
   */
  update(id: string, data: UpdateDto): Promise<T>;

  /**
   * Eliminar (soft delete)
   */
  softDelete(id: string): Promise<void>;

  /**
   * Verificar existencia
   */
  exists(id: string): Promise<boolean>;

  /**
   * Contar registros
   */
  count(query?: QueryDto): Promise<number>;
}

/**
 * QueryBuilderHelper - Tipo helper para métodos que modifican query builders
 */
export type QueryBuilderModifier<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
) => SelectQueryBuilder<T>;
