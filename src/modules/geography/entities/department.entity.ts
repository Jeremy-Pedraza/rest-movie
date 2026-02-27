// src/modules/geography/entities/department.entity.ts

/**
 * @fileoverview Entidad Departamento/Estado/Provincia para catálogo geográfico
 * @module modules/geography
 *
 * Representa la división administrativa de primer nivel de un país:
 * - Departamentos (Colombia, El Salvador, Guatemala)
 * - Estados (México)
 * - Provincias (Rep. Dominicana, Panamá)
 * - Regiones (Chile)
 *
 * @version 1.0.0
 */

import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';
import type { GeoCountryEntity } from './country.entity';

/**
 * GeoDepartmentEntity - Departamento/Estado/Provincia
 *
 * @description
 * Representa una división administrativa de primer nivel.
 * El nombre "department" es genérico y aplica a estados, provincias, etc.
 *
 * @example
 * ```typescript
 * const dept = new GeoDepartmentEntity();
 * dept.country_id = 'uuid-country';
 * dept.code = 'DN';
 * dept.name = 'Distrito Nacional';
 * dept.name_normalized = 'distrito nacional';
 * ```
 */
@Entity({ name: 'geo_departments', schema: 'public' })
@Index(['country_id', 'name'], { unique: true })
export class GeoDepartmentEntity extends BaseTimestampEntity {
  /**
   * ID del país al que pertenece
   */
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'country_id',
  })
  @Index('idx_geo_dept_country')
  country_id: string;

  // ============================================
  // CÓDIGOS E IDENTIFICACIÓN
  // ============================================

  /**
   * Código local del departamento/estado (opcional)
   * @example 'DN' (Distrito Nacional), 'GUA' (Guatemala), 'SS' (San Salvador)
   */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'code',
  })
  @Index('idx_geo_dept_code')
  code?: string;

  /**
   * Código ISO 3166-2 (subdivision) si existe
   * @example 'DO-01' (Distrito Nacional), 'GT-GU' (Guatemala)
   */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'iso_code',
  })
  iso_code?: string;

  // ============================================
  // NOMBRES
  // ============================================

  /**
   * Nombre del departamento/estado/provincia
   * @example 'Distrito Nacional', 'Guatemala', 'San Salvador', 'Francisco Morazán'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'name',
  })
  @Index('idx_geo_dept_name')
  name: string;

  /**
   * Nombre normalizado (sin tildes, lowercase) para búsquedas
   * @example 'distrito nacional', 'guatemala', 'san salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'name_normalized',
  })
  @Index('idx_geo_dept_name_normalized')
  name_normalized?: string;

  /**
   * Tipo de división administrativa
   * @example 'provincia', 'departamento', 'estado', 'region'
   */
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    default: 'departamento',
    name: 'division_type',
  })
  division_type?: string;

  // ============================================
  // CONFIGURACIÓN
  // ============================================

  /**
   * Orden de visualización (para ordenar listas)
   * Capital/principales primero
   */
  @Column({
    type: 'int',
    nullable: true,
    default: 100,
    name: 'display_order',
  })
  display_order?: number;

  /**
   * Indica si es la capital/principal del país
   */
  @Column({
    type: 'boolean',
    default: false,
    name: 'is_capital',
  })
  is_capital: boolean;

  /**
   * Estado activo/inactivo
   */
  @Column({
    type: 'boolean',
    default: true,
    name: 'is_active',
  })
  @Index('idx_geo_dept_active')
  is_active: boolean;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * País al que pertenece
   */
  @ManyToOne('GeoCountryEntity', 'departments', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'country_id' })
  country?: GeoCountryEntity;

  /**
   * Ciudades del departamento
   */
  @OneToMany('GeoCityEntity', 'department')
  cities?: any[];
}
