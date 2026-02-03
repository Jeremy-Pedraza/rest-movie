// src/modules/company/entities/company.entity.ts

/**
 * @fileoverview Entidad Company para multi-tenant
 * @module modules/company
 *
 * Esta entidad maneja la información de empresas/tenants
 * Cada company tiene su propio schema de BD para aislar datos
 *
 * @version 2.0.0 - Agregados campos de internacionalización (FASE 1)
 */

import { Entity, Column, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@shared/common';
import type { UserEntity } from '@modules/user/entities';
import type { GeoCountryEntity } from '@modules/geography/entities';

/**
 * Interfaz para configuración fiscal del país
 */
export interface ITaxConfig {
  /** Tasa de impuesto (ej: 0.18 para 18%) */
  tax_rate: number;
  /** Nombre del impuesto (ej: 'ITBIS', 'IVA', 'IGV') */
  tax_name: string;
  /** Si el precio incluye impuesto por defecto */
  tax_included: boolean;
  /** Reglas adicionales de impuestos (opcional) */
  rules?: {
    /** Tasa reducida para ciertos productos */
    reduced_rate?: number;
    /** Categorías exentas */
    exempt_categories?: string[];
  };
}

/**
 * CompanyEntity - Empresa/Tenant del sistema
 *
 * Arquitectura multi-tenant:
 * - Cada company tiene su propio schema en PostgreSQL
 * - Los usuarios pertenecen a una company
 * - Las queries se ejecutan en el schema de la company del usuario
 *
 * Internacionalización:
 * - Soporte para múltiples países (timezone, moneda, formato de fecha)
 * - Configuración fiscal por país (ITBIS, IVA, IGV)
 * - Código ISO de país para reportes y filtros
 *
 * @example
 * ```typescript
 * const company = new CompanyEntity();
 * company.name = 'Taco Bell República Dominicana';
 * company.schema = 'taco_bell_rd';
 * company.subdomain = 'tacobell-rd';
 * company.ruc = '101234567';
 * company.email = 'admin@tacobell.do';
 * company.pais = 'República Dominicana';
 * company.ciudad = 'Santo Domingo';
 * company.country_code = 'DO';
 * company.timezone = 'America/Santo_Domingo';
 * company.currency_code = 'DOP';
 * company.currency_symbol = 'RD$';
 * company.tax_config = { tax_rate: 0.18, tax_name: 'ITBIS', tax_included: true };
 * await companyRepo.save(company);
 * ```
 */
@Entity({ name: 'companies', schema: 'public' })
export class CompanyEntity extends BaseEntity {
  // ============================================
  // CAMPOS BASE
  // ============================================

  /**
   * Nombre de la empresa
   */
  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  /**
   * Schema de PostgreSQL para esta company
   * Usado para aislar datos por tenant
   *
   * @example 'taco_bell_rd', 'taco_bell_gt', 'taco_bell_sv'
   */
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true, name: 'schema' })
  @Index('idx_company_schema')
  schema: string;

  /**
   * Dominio completo de la empresa (opcional)
   *
   * @example 'tacobell-rd.mokka.com', 'tacobell-gt.mokka.com'
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'domain' })
  @Index('idx_company_domain')
  domain: string;

  /**
   * Subdominio de la empresa
   * Usado para identificar tenant en requests
   *
   * @example 'tacobell-rd', 'tacobell-gt', 'tacobell-sv'
   */
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true, name: 'subdomain' })
  @Index('idx_company_subdomain')
  subdomain: string;

  /**
   * Indica si la empresa está activa
   * Companies inactivas no pueden acceder al sistema
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index('idx_company_active')
  is_active: boolean;

  /**
   * Configuración adicional de la empresa (JSON)
   *
   * Puede contener:
   * - Límites de recursos
   * - Configuración de features
   * - Personalización
   */
  @Column({ type: 'jsonb', nullable: true, name: 'settings' })
  settings: Record<string, any>;

  /**
   * Plan/Tier de la empresa (opcional)
   *
   * @example 'free', 'basic', 'premium', 'enterprise'
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'plan' })
  plan: string;

  /**
   * Fecha de expiración del plan (opcional)
   */
  @Column({ type: 'timestamp', nullable: true, name: 'plan_expires_at' })
  plan_expires_at: Date | null;

  // ============================================
  // INFORMACIÓN FISCAL Y CONTACTO
  // ============================================

  /**
   * RUC/NIT/RNC de la empresa
   * Identificación fiscal única
   *
   * @example '101234567' (RD), '12345678-9' (GT), '0614-123456-101-2' (SV)
   */
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
    name: 'ruc',
    comment: 'RUC/NIT/RNC de la empresa',
  })
  @Index('idx_company_ruc', { unique: true })
  ruc: string;

  /**
   * Email corporativo de la empresa
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    name: 'email',
  })
  @Index('idx_company_email')
  email: string;

  /**
   * Teléfono corporativo
   *
   * @example '+1-809-555-1234', '+502-2555-1234'
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'telefono',
  })
  telefono?: string;

  /**
   * Dirección fiscal de la empresa
   */
  @Column({
    type: 'text',
    nullable: true,
    name: 'direccion',
  })
  direccion?: string;

  /**
   * País donde opera la empresa
   *
   * @example 'República Dominicana', 'Guatemala', 'El Salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'pais',
  })
  @Index('idx_company_pais')
  pais: string;

  /**
   * Ciudad principal de operación
   *
   * @example 'Santo Domingo', 'Ciudad de Guatemala', 'San Salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    name: 'ciudad',
  })
  @Index('idx_company_ciudad')
  ciudad: string;

  // ============================================
  // CAMPOS DE INTERNACIONALIZACIÓN (FASE 1)
  // ============================================

  /**
   * Zona horaria de la empresa
   * Usado para reportes y timestamps locales
   *
   * @example 'America/Santo_Domingo', 'America/Guatemala', 'America/El_Salvador'
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    default: 'America/Santo_Domingo',
    name: 'timezone',
  })
  timezone: string;

  /**
   * Código ISO del país (2 letras - ISO 3166-1 alpha-2)
   *
   * @example 'DO' (Rep. Dominicana), 'GT' (Guatemala), 'SV' (El Salvador), 'HN' (Honduras), 'PA' (Panamá)
   */
  @Column({
    type: 'varchar',
    length: 2,
    nullable: false,
    default: 'DO',
    name: 'country_code',
  })
  @Index('idx_company_country_code')
  country_code: string;

  /**
   * Departamento/Estado/Provincia principal
   *
   * @example 'Distrito Nacional', 'Guatemala', 'San Salvador'
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'departamento',
  })
  departamento?: string;

  /**
   * Moneda local (código ISO 4217)
   *
   * @example 'DOP' (Peso Dominicano), 'GTQ' (Quetzal), 'USD' (Dólar)
   */
  @Column({
    type: 'varchar',
    length: 3,
    nullable: false,
    default: 'DOP',
    name: 'currency_code',
  })
  currency_code: string;

  /**
   * Símbolo de moneda para mostrar
   *
   * @example 'RD$', 'Q', '$', 'L' (Lempira)
   */
  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    default: 'RD$',
    name: 'currency_symbol',
  })
  currency_symbol: string;

  /**
   * Formato de fecha preferido
   *
   * @example 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'DD/MM/YYYY',
    name: 'date_format',
  })
  date_format: string;

  /**
   * Configuración fiscal del país
   * Contiene: tasa de impuesto, nombre del impuesto, reglas
   *
   * @example { tax_rate: 0.18, tax_name: 'ITBIS', tax_included: true }
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'tax_config',
  })
  tax_config?: ITaxConfig;

  // ============================================
  // REFERENCIAS A CATÁLOGO GEOGRÁFICO (OPCIONAL)
  // ============================================

  /**
   * ID del país en el catálogo geográfico (opcional)
   * Permite vincular la company al catálogo maestro para validación
   *
   * @description
   * Si se establece, los campos country_code, timezone, currency_code
   * pueden heredarse del catálogo. El campo pais/ciudad permanecen como texto
   * para retrocompatibilidad.
   */
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'geo_country_id',
  })
  @Index('idx_company_geo_country')
  geo_country_id?: string;

  // ============================================
  // RELACIONES
  // ============================================

  /**
   * País del catálogo geográfico (opcional)
   * Relación con el catálogo maestro de países
   */
  @ManyToOne('GeoCountryEntity', { nullable: true })
  @JoinColumn({ name: 'geo_country_id' })
  geo_country?: GeoCountryEntity;

  /**
   * Usuarios que pertenecen a esta company
   * Relación inversa: UserEntity.company
   *
   * Nota: Usamos 'UserEntity' como string en el decorador y type-only import
   * para evitar imports circulares en runtime
   */
  @OneToMany('UserEntity', 'company')
  users?: UserEntity[];

  /**
   * Tiendas que pertenecen a esta compañía
   * Relación inversa: StoreEntity.company
   *
   * Una compañía puede tener múltiples tiendas/sucursales.
   * Los reportes se generan a nivel de tienda.
   */
  @OneToMany('StoreEntity', 'company')
  stores?: any[]; // Type-only import para evitar circular
}
