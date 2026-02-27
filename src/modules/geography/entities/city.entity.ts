// src/modules/geography/entities/city.entity.ts

/**
 * @fileoverview Entidad Ciudad para catálogo geográfico
 * @module modules/geography
 *
 * Representa ciudades/municipios dentro de un departamento/estado.
 * Incluye ciudades principales y sus alternativas comunes de escritura.
 *
 * @version 1.0.0
 */

import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';
import type { GeoDepartmentEntity } from './department.entity';

/**
 * GeoCityEntity - Ciudad/Municipio
 *
 * @description
 * Representa una ciudad o municipio dentro de un departamento.
 * Incluye información para búsquedas y normalización.
 *
 * @example
 * ```typescript
 * const city = new GeoCityEntity();
 * city.department_id = 'uuid-department';
 * city.name = 'Santo Domingo';
 * city.name_normalized = 'santo domingo';
 * city.aliases = ['SD', 'Sto Domingo', 'Sto. Domingo'];
 * city.is_capital = true;
 * ```
 */
@Entity({ name: 'geo_cities', schema: 'public' })
@Index(['department_id', 'name'], { unique: true })
export class GeoCityEntity extends BaseTimestampEntity {
  /**
   * ID del departamento al que pertenece
   */
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'department_id',
  })
  @Index('idx_geo_city_dept')
  department_id: string;

  // ============================================
  // NOMBRES
  // ============================================

  /**
   * Nombre oficial de la ciudad
   * @example 'Santo Domingo', 'Ciudad de Guatemala', 'San Salvador', 'Tegucigalpa'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'name',
  })
  @Index('idx_geo_city_name')
  name: string;

  /**
   * Nombre normalizado (sin tildes, lowercase) para búsquedas
   * @example 'santo domingo', 'ciudad de guatemala', 'san salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'name_normalized',
  })
  @Index('idx_geo_city_name_normalized')
  name_normalized?: string;

  /**
   * Aliases y variaciones comunes del nombre
   * Útil para búsquedas y autocompletado
   * @example ['SD', 'Sto Domingo', 'Sto. Domingo', 'Santo Domingo de Guzmán']
   */
  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'aliases',
  })
  aliases?: string[];

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Indica si es capital del departamento/estado
   */
  @Column({
    type: 'boolean',
    default: false,
    name: 'is_capital',
  })
  @Index('idx_geo_city_capital')
  is_capital: boolean;

  /**
   * Indica si es capital del país
   */
  @Column({
    type: 'boolean',
    default: false,
    name: 'is_country_capital',
  })
  is_country_capital: boolean;

  /**
   * Población estimada (opcional)
   * Útil para ordenar resultados de búsqueda
   */
  @Column({
    type: 'int',
    nullable: true,
    name: 'population',
  })
  population?: number;

  /**
   * Zona horaria específica si difiere del país
   * null = usa la zona horaria del país
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'timezone',
  })
  timezone?: string;

  /**
   * Código postal principal (opcional)
   * @example '10101' (Santo Domingo), '01001' (Guatemala)
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'postal_code',
  })
  postal_code?: string;

  /**
   * Latitud del centro de la ciudad
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    name: 'latitude',
  })
  latitude?: number;

  /**
   * Longitud del centro de la ciudad
   */
  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    name: 'longitude',
  })
  longitude?: number;

  /**
   * Orden de visualización (ciudades principales primero)
   */
  @Column({
    type: 'int',
    nullable: true,
    default: 100,
    name: 'display_order',
  })
  display_order?: number;

  /**
   * Estado activo/inactivo
   */
  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active',
  })
  @Index('idx_geo_city_active')
  is_active: boolean;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Departamento al que pertenece
   */
  @ManyToOne('GeoDepartmentEntity', 'cities', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'department_id' })
  department?: GeoDepartmentEntity;
}
