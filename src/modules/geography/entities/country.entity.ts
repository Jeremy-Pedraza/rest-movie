// src/modules/geography/entities/country.entity.ts

/**
 * @fileoverview Entidad País para catálogo geográfico
 * @module modules/geography
 *
 * Catálogo maestro de países con información de:
 * - Códigos ISO (alpha-2, alpha-3)
 * - Zona horaria principal
 * - Moneda y configuración fiscal
 *
 * @version 1.0.0
 */

import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';

/**
 * GeoCountryEntity - País del catálogo geográfico
 *
 * @description
 * Representa un país en el catálogo maestro de ubicaciones.
 * Contiene información de internacionalización (timezone, moneda, impuestos).
 *
 * @example
 * ```typescript
 * const country = new GeoCountryEntity();
 * country.code = 'DO';
 * country.code_alpha3 = 'DOM';
 * country.name = 'República Dominicana';
 * country.timezone = 'America/Santo_Domingo';
 * country.currency_code = 'DOP';
 * country.currency_symbol = 'RD$';
 * country.phone_code = '+1-809';
 * country.tax_name = 'ITBIS';
 * country.tax_rate = 0.18;
 * ```
 */
@Entity({ name: 'geo_countries', schema: 'public' })
export class GeoCountryEntity extends BaseTimestampEntity {

  // ============================================
  // CÓDIGOS ISO
  // ============================================

  /**
   * Código ISO 3166-1 alpha-2 (2 letras)
   * @example 'DO', 'GT', 'SV', 'HN', 'PA', 'CR', 'NI', 'MX', 'CO', 'PE'
   */
  @Column({
    type: 'varchar',
    length: 2,
    unique: true,
    nullable: false,
    name: 'code',
  })
  @Index('idx_geo_country_code', { unique: true })
  code: string;

  /**
   * Código ISO 3166-1 alpha-3 (3 letras)
   * @example 'DOM', 'GTM', 'SLV', 'HND', 'PAN', 'CRI', 'NIC', 'MEX', 'COL', 'PER'
   */
  @Column({
    type: 'varchar',
    length: 3,
    unique: true,
    nullable: true,
    name: 'code_alpha3',
  })
  code_alpha3?: string;

  /**
   * Código numérico ISO 3166-1 (opcional)
   * @example 214 (DO), 320 (GT), 222 (SV)
   */
  @Column({
    type: 'int',
    nullable: true,
    name: 'code_numeric',
  })
  code_numeric?: number;

  // ============================================
  // NOMBRES
  // ============================================

  /**
   * Nombre del país en español
   * @example 'República Dominicana', 'Guatemala', 'El Salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'name',
  })
  @Index('idx_geo_country_name')
  name: string;

  /**
   * Nombre del país en inglés
   * @example 'Dominican Republic', 'Guatemala', 'El Salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'name_en',
  })
  name_en?: string;

  /**
   * Nombre normalizado (sin tildes, lowercase) para búsquedas
   * @example 'republica dominicana', 'guatemala', 'el salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'name_normalized',
  })
  @Index('idx_geo_country_name_normalized')
  name_normalized?: string;

  // ============================================
  // CONFIGURACIÓN REGIONAL
  // ============================================

  /**
   * Zona horaria principal del país (IANA)
   * @example 'America/Santo_Domingo', 'America/Guatemala', 'America/El_Salvador'
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    name: 'timezone',
  })
  timezone: string;

  /**
   * Código de moneda ISO 4217
   * @example 'DOP', 'GTQ', 'USD', 'HNL', 'PAB', 'CRC', 'NIO', 'MXN', 'COP', 'PEN'
   */
  @Column({
    type: 'varchar',
    length: 3,
    nullable: false,
    name: 'currency_code',
  })
  currency_code: string;

  /**
   * Símbolo de moneda para mostrar
   * @example 'RD$', 'Q', '$', 'L', 'B/.', '₡', 'C$', 'S/'
   */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    name: 'currency_symbol',
  })
  currency_symbol: string;

  /**
   * Código de teléfono internacional
   * @example '+1', '+502', '+503', '+504', '+507', '+506', '+505', '+52', '+57', '+51'
   */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'phone_code',
  })
  phone_code?: string;

  // ============================================
  // CONFIGURACIÓN FISCAL
  // ============================================

  /**
   * Nombre del impuesto principal
   * @example 'ITBIS', 'IVA', 'IGV', 'ISV'
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'tax_name',
  })
  tax_name?: string;

  /**
   * Tasa de impuesto principal (decimal)
   * @example 0.18 (18%), 0.12 (12%), 0.13 (13%)
   */
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    name: 'tax_rate',
  })
  tax_rate?: number;

  // ============================================
  // CONFIGURACIÓN ADICIONAL
  // ============================================

  /**
   * Formato de fecha preferido
   * @example 'DD/MM/YYYY', 'MM/DD/YYYY'
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    default: 'DD/MM/YYYY',
    name: 'date_format',
  })
  date_format?: string;

  /**
   * Código de idioma principal (ISO 639-1)
   * @example 'es', 'en', 'pt'
   */
  @Column({
    type: 'varchar',
    length: 5,
    nullable: true,
    default: 'es',
    name: 'language_code',
  })
  language_code?: string;

  /**
   * Orden de visualización (para ordenar listas)
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
  @Index('idx_geo_country_active')
  is_active: boolean;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * Departamentos/Estados/Provincias del país
   */
  @OneToMany('GeoDepartmentEntity', 'country')
  departments?: any[];

}
