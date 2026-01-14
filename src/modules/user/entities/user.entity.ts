// src/modules/user/entities/user.entity.ts

/**
 * @fileoverview Entidad principal de usuarios
 * @module modules/user/entities
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  ManyToMany,
  ManyToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

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
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Email del usuario (único)
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  /**
   * Contraseña hasheada
   */
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  /**
   * Nombre del usuario
   */
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  /**
   * Apellido del usuario
   */
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  /**
   * Teléfono (opcional)
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  /**
   * Avatar URL (opcional)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar: string | null;

  /**
   * Estado del usuario
   */
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @Index()
  status: UserStatus;

  /**
   * Email verificado
   */
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  /**
   * Fecha de verificación del email
   */
  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  /**
   * Último login
   */
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  /**
   * IP del último login
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string | null;

  /**
   * Intentos de login fallidos
   */
  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  /**
   * Bloqueado hasta (por intentos fallidos)
   */
  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  /**
   * Token para reset de password
   */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordResetToken: string | null;

  /**
   * Expiración del token de reset
   */
  @Column({ type: 'timestamptz', nullable: true, select: false })
  passwordResetExpires: Date | null;

  /**
   * Token de verificación de email
   */
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  emailVerificationToken: string | null;

  /**
   * Metadata adicional (JSON)
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /**
   * Preferencias del usuario
   */
  @Column({ type: 'jsonb', nullable: true })
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
  // MULTI-TENANT: RELACIÓN CON COMPANY
  // ============================================

  /**
   * ID de la empresa (tenant) a la que pertenece el usuario
   *
   * @nullable Si es null, el usuario pertenece al schema public
   */
  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  /**
   * Empresa (tenant) a la que pertenece el usuario
   *
   * Esta relación determina el schema en el que se ejecutarán las queries
   * del usuario. Si es null, usa schema public.
   *
   * @example
   * user.company.schema // 'restaurant_valle_schema'
   */
  @ManyToOne(() => CompanyEntity, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company: CompanyEntity | null;

  /**
   * Fecha de creación
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Fecha de actualización
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Fecha de eliminación (soft delete)
   */
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

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
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Lista de nombres de roles
   */
  get roleNames(): string[] {
    return this.roles?.map((role) => role.name) ?? [];
  }

  /**
   * Verifica si el usuario está activo
   */
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * Verifica si el usuario está bloqueado
   */
  get isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
  }

  // ============================================
  // METHODS
  // ============================================

  /**
   * Verifica la contraseña
   * @param plainPassword - Contraseña en texto plano
   * @returns true si coincide
   */
  async verifyPassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * Verifica si tiene un rol específico
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
    this.failedLoginAttempts += 1;

    // Bloquear después de 5 intentos por 30 minutos
    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  /**
   * Resetea los intentos de login fallidos
   */
  resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
  }

  /**
   * Registra un login exitoso
   * @param ip - IP del cliente
   */
  registerSuccessfulLogin(ip?: string): void {
    this.lastLoginAt = new Date();
    this.lastLoginIp = ip || null;
    this.resetFailedAttempts();
  }
}
