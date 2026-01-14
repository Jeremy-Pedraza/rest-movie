// src/modules/user/entities/permission.entity.ts

/**
 * @fileoverview Entidad de permisos
 * @module modules/user/entities
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
} from 'typeorm';

import { RoleEntity } from './role.entity';

@Entity({ name: 'permissions', schema: 'public' })
@Index(['name'], { unique: true })
@Index(['module', 'action'])
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nombre del permiso (único) - formato: module.action
   * @example 'users.create', 'users.read', 'users.update', 'users.delete'
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  /**
   * Descripción del permiso
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  /**
   * Módulo al que pertenece
   * @example 'users', 'roles', 'logs', 'settings'
   */
  @Column({ type: 'varchar', length: 50 })
  @Index()
  module: string;

  /**
   * Acción del permiso
   * @example 'create', 'read', 'update', 'delete', 'manage'
   */
  @Column({ type: 'varchar', length: 50 })
  action: string;

  /**
   * Si es un permiso del sistema (no eliminable)
   */
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  /**
   * Si el permiso está activo
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Roles que tienen este permiso
   */
  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];

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
}
