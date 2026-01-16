// src/modules/company/entities/company.entity.ts

/**
 * @fileoverview Entidad Company para multi-tenant
 * @module modules/company
 *
 * Esta entidad maneja la información de empresas/tenants
 * Cada company tiene su propio schema de BD para aislar datos
 */

import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '@shared/common';
import type { UserEntity } from '@modules/user/entities';

/**
 * CompanyEntity - Empresa/Tenant del sistema
 *
 * Arquitectura multi-tenant:
 * - Cada company tiene su propio schema en PostgreSQL
 * - Los usuarios pertenecen a una company
 * - Las queries se ejecutan en el schema de la company del usuario
 *
 * @example
 * ```typescript
 * const company = new CompanyEntity();
 * company.name = 'Restaurante Valle';
 * company.schema = 'restaurant_valle_schema';
 * company.subdomain = 'valle';
 * company.ruc = '1792345678001';
 * company.email = 'contacto@valle.com';
 * company.pais = 'Ecuador';
 * company.ciudad = 'Quito';
 * await companyRepo.save(company);
 * ```
 */
@Entity({ name: 'companies', schema: 'public' })
export class CompanyEntity extends BaseEntity {
  /**
   * Nombre de la empresa
   */
  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  /**
   * Schema de PostgreSQL para esta company
   * Usado para aislar datos por tenant
   *
   * @example 'company_a_schema', 'restaurant_valle_schema'
   */
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true, name: 'schema' })
  @Index('idx_company_schema')
  schema: string;

  /**
   * Dominio completo de la empresa (opcional)
   *
   * @example 'company-a.rest.com', 'valle.miapp.com'
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true, name: 'domain' })
  @Index('idx_company_domain')
  domain: string;

  /**
   * Subdominio de la empresa
   * Usado para identificar tenant en requests
   *
   * @example 'company-a', 'valle', 'tenant-1'
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
  // NUEVOS CAMPOS AGREGADOS
  // ============================================

  /**
   * RUC/NIT de la empresa
   * Identificación fiscal única
   *
   * @example '1792345678001' (Ecuador), '900123456-1' (Colombia)
   */
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
    name: 'ruc',
    comment: 'RUC/NIT de la empresa',
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
   * @example '+593987654321', '0987654321'
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
   * @example 'Ecuador', 'Colombia', 'Perú'
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
   * @example 'Quito', 'Guayaquil', 'Bogotá'
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
  // RELACIONES
  // ============================================

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
