// src/modules/auth/entities/session.entity.ts

/**
 * @fileoverview Entidad para sesiones de usuario
 * @module modules/auth/entities
 */

import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { BaseReadOnlyEntity } from '@shared/common';

import { UserEntity } from '@modules/user';

/**
 * Entidad Session
 * Almacena las sesiones activas de los usuarios
 */
@Entity('sessions')
@Index(['user_id', 'deleted_at'])
@Index(['refresh_token', 'deleted_at'])
@Index(['expires_at', 'deleted_at'])
export class SessionEntity extends BaseReadOnlyEntity {
  // ============================================
  // RELACIONES
  // ============================================

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  user_id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  // ============================================
  // TOKENS
  // ============================================

  @Column({ type: 'text', unique: true, name: 'refresh_token' })
  @Index()
  refresh_token: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token_family' })
  @Index()
  refresh_token_family: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'token_jti' })
  @Index({ unique: true })
  token_jti: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_session_id' })
  parent_session_id: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'consumed_at' })
  consumed_at: Date | null;

  // ============================================
  // INFORMACIÓN DE SESIÓN
  // ============================================

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  user_agent: string | null;

  @Column({ type: 'varchar', length: 45, name: 'ip_address' })
  @Index()
  ip_address: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'device' })
  device: string | null; // ej: "Chrome on Windows", "Safari on iPhone"

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'location' })
  location: string | null; // ej: "Bucaramanga, CO"

  // ============================================
  // TIMESTAMPS Y EXPIRACIÓN
  // ============================================

  @UpdateDateColumn({ type: 'timestamptz', name: 'last_activity_at' })
  last_activity_at: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  @Index()
  expires_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deleted_at: Date | null;

  // ============================================
  // METADATA
  // ============================================

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_revoked' })
  is_revoked: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revoked_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'revoked_reason' })
  revoked_reason: string | null;

  // ============================================
  // HOOKS
  // ============================================

  @BeforeInsert()
  @BeforeUpdate()
  validateExpiration() {
    if (this.expires_at && this.expires_at < new Date()) {
      this.is_active = false;
    }
  }

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Verifica si la sesión está expirada
   */
  isExpired(): boolean {
    return this.expires_at < new Date();
  }

  /**
   * Verifica si la sesión es válida
   */
  isValid(): boolean {
    return this.is_active && !this.is_revoked && !this.isExpired() && !this.deleted_at;
  }

  /**
   * Revoca la sesión
   */
  revoke(reason?: string): void {
    this.is_revoked = true;
    this.revoked_at = new Date();
    this.revoked_reason = reason || 'Revoked by user';
    this.is_active = false;
  }
}
