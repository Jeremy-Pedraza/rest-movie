// src/modules/auth/entities/session.entity.ts

/**
 * @fileoverview Entidad para sesiones de usuario
 * @module modules/auth/entities
 */

import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@modules/user';

/**
 * Entidad Session
 * Almacena las sesiones activas de los usuarios
 */
@Entity('sessions')
@Index(['userId', 'deletedAt'])
@Index(['refreshToken', 'deletedAt'])
@Index(['expiresAt', 'deletedAt'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================
  // RELACIONES
  // ============================================

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // ============================================
  // TOKENS
  // ============================================

  @Column({ type: 'text', unique: true })
  @Index()
  refreshToken: string;

  @Column({ type: 'text', nullable: true })
  refreshTokenFamily: string | null; // Para detectar token reuse

  // ============================================
  // INFORMACIÓN DE SESIÓN
  // ============================================

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 45 })
  @Index()
  ipAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device: string | null; // ej: "Chrome on Windows", "Safari on iPhone"

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string | null; // ej: "Bucaramanga, CO"

  // ============================================
  // TIMESTAMPS Y EXPIRACIÓN
  // ============================================

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastActivityAt: Date;

  @Column({ type: 'timestamptz' })
  @Index()
  expiresAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // ============================================
  // METADATA
  // ============================================

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  revokedReason: string | null;

  // ============================================
  // HOOKS
  // ============================================

  @BeforeInsert()
  @BeforeUpdate()
  validateExpiration() {
    if (this.expiresAt && this.expiresAt < new Date()) {
      this.isActive = false;
    }
  }

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Verifica si la sesión está expirada
   */
  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  /**
   * Verifica si la sesión es válida
   */
  isValid(): boolean {
    return this.isActive && !this.isRevoked && !this.isExpired() && !this.deletedAt;
  }

  /**
   * Revoca la sesión
   */
  revoke(reason?: string): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedReason = reason || 'Revoked by user';
    this.isActive = false;
  }
}
