// src/modules/user/entities/user.entity.ts

/**
 * @fileoverview Entidad principal de usuarios
 * @module modules/user/entities
 */

import {
  Entity,
  Column,
  Index,
  BeforeInsert,
  BeforeUpdate,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { BaseEntity } from '@shared/common';

import { RoleEntity } from './role.entity';
import { CompanyEntity } from '@modules/company/entities';

/**
 * Estados del usuario
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  BLOCKED = 'blocked',
}

@Entity({ name: 'users', schema: 'public' })
@Index(['email'], { unique: true })
@Index(['status', 'createdAt'])
@Index(['deletedAt'])
export class UserEntity extends BaseEntity {
  /**
   * Email del usuario (Ãºnico)
   */
  @Column({ type: 'varchar', length: 255, unique: true, name: 'email' })
  @Index()
  email: string;

  /**
   * ContraseÃ±a hasheada
   */
  @Column({ type: 'varchar', length: 255, select: false, name: 'password' })
  password: string;

  /**
   * Nombre del usuario
   */
  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  first_name: string;

  /**
   * Apellido del usuario
   */
  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  last_name: string;

  /**
   * TelÃ©fono (opcional)
   */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone' })
  phone: string | null;

  /**
   * Avatar URL (opcional)
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar' })
  avatar: string | null;

  /**
   * Estado del usuario
   */
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
    name: 'status',
  })
  @Index()
  status: UserStatus;

  /**
   * Email verificado
   */
  @Column({ type: 'boolean', default: false, name: 'email_verified' })
  email_verified: boolean;

  /**
   * Fecha de verificaciÃ³n del email
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'email_verified_at' })
  email_verified_at: Date | null;

  /**
   * Ãšltimo login
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  last_login_at: Date | null;

  /**
   * IP del Ãºltimo login
   */
  @Column({ type: 'varchar', length: 45, nullable: true, name: 'last_login_ip' })
  last_login_ip: string | null;

  /**
   * Intentos de login fallidos
   */
  @Column({ type: 'int', default: 0, name: 'failed_login_attempts' })
  failed_login_attempts: number;

  /**
   * Bloqueado hasta (por intentos fallidos)
   */
  @Column({ type: 'timestamptz', nullable: true, name: 'locked_until' })
  locked_until: Date | null;

  /**
   * Token para reset de password
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
    name: 'password_reset_token',
  })
  password_reset_token: string | null;

  /**
   * ExpiraciÃ³n del token de reset
   */
  @Column({ type: 'timestamptz', nullable: true, select: false, name: 'password_reset_expires' })
  password_reset_expires: Date | null;

  /**
   * Token de verificaciÃ³n de email
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
    name: 'email_verification_token',
  })
  email_verification_token: string | null;

  /**
   * Metadata adicional (JSON)
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, unknown> | null;

  /**
   * Preferencias del usuario
   */
  @Column({ type: 'jsonb', nullable: true, name: 'preferences' })
  preferences: Record<string, unknown> | null;

  /**
   * Roles del usuario
   */
  @ManyToMany(() => RoleEntity, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  // ============================================
  // MULTI-TENANT: RELACIÃ“N CON COMPANY
  // ============================================

  /**
   * ID de la empresa (tenant) a la que pertenece el usuario
   *
   * @nullable Si es null, el usuario pertenece al schema public
   */
  @Column({ type: 'uuid', nullable: true, name: 'company_id' })
  company_id: string | null;

  /**
   * Empresa (tenant) a la que pertenece el usuario
   *
   * Esta relaciÃ³n determina el schema en el que se ejecutarÃ¡n las queries
   * del usuario. Si es null, usa schema public.
   *
   * @example
   * user.company.schema // 'restaurant_valle_schema'
   */
  @ManyToOne(() => CompanyEntity, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: CompanyEntity | null;

  // ============================================
  // RELACIÃ“N CON STORES (SOLO ROL USER)
  // ============================================

  /**
   * Tiendas asignadas al usuario (solo para rol USER)
   *
   * @description
   * RelaciÃ³n ManyToMany con StoreEntity usando tabla intermedia user_stores.
   * Solo usuarios con rol USER tienen tiendas asignadas.
   * Los usuarios asignados solo pueden ver reportes de sus tiendas.
   *
   * Permisos por rol:
   * - SUPER_ADMIN/ADMIN: Acceso a todas las tiendas (no necesitan asignaciÃ³n)
   * - MANAGER: Acceso a todas las tiendas de su compaÃ±Ã­a (no necesitan asignaciÃ³n)
   * - USER: Solo acceso a tiendas asignadas en esta relaciÃ³n
   *
   * @example
   * ```typescript
   * const user = await userRepo.findOne({
   *   where: { id: userId },
   *   relations: ['assigned_stores'],
   * });
   * console.log(user.assigned_stores); // Array de StoreEntity
   * ```
   */
  @ManyToMany('StoreEntity', 'assigned_users')
  assigned_stores?: any[]; // Type-only import para evitar circular

  // ============================================
  // HOOKS
  // ============================================

  /**
   * Hash de password antes de insertar
   */
  @BeforeInsert()
  async hashPasswordOnInsert(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    this.email = this.email.toLowerCase().trim();
  }

  /**
   * Normalizar email antes de actualizar
   */
  @BeforeUpdate()
  normalizeEmailOnUpdate(): void {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  // ============================================
  // VIRTUAL PROPERTIES
  // ============================================

  /**
   * Nombre completo
   */
  get fullName(): string {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  /**
   * Lista de nombres de roles
   */
  get roleNames(): string[] {
    return this.roles?.map((role) => role.name) || [];
  }

  /**
   * Verifica si el usuario estÃ¡ activo
   */
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Verifica si el usuario estÃ¡ bloqueado
   */
  get isLocked(): boolean {
    if (!this.locked_until) return false;
    return new Date() < this.locked_until;
  }

  // ============================================
  // METHODS
  // ============================================

  /**
   * Verifica la contraseÃ±a
   * @param plainPassword - ContraseÃ±a en texto plano
   * @returns true si coincide
   */
  async verifyPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * Verifica si tiene un rol especÃ­fico
   * @param roleName - Nombre del rol
   * @returns true si tiene el rol
   */
  hasRole(roleName: string): boolean {
    return this.roleNames.includes(roleName);
  }

  /**
   * Verifica si tiene alguno de los roles especificados
   * @param roleNames - Nombres de roles
   * @returns true si tiene alguno
   */
  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some((role) => this.hasRole(role));
  }

  /**
   * Registra un intento de login fallido
   */
  registerFailedLogin(): void {
    this.failed_login_attempts += 1;

    // Bloquear despuÃ©s de 5 intentos por 30 minutos
    if (this.failed_login_attempts >= 5) {
      this.locked_until = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  /**
   * Resetea los intentos de login fallidos
   */
  resetFailedAttempts(): void {
    this.failed_login_attempts = 0;
    this.locked_until = null;
  }

  /**
   * Registra un login exitoso
   * @param ip - IP del cliente
   */
  registerSuccessfulLogin(ip?: string): void {
    this.last_login_at = new Date();
    this.last_login_ip = ip || null;
    this.resetFailedAttempts();
  }
}

