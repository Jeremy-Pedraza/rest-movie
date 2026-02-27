// src/modules/user/entities/permission.entity.ts

/**
 * @fileoverview Entidad de permisos
 * @module modules/user/entities
 */

import { Entity, Column, Index, ManyToMany } from 'typeorm';
import { BaseTimestampEntity } from '@shared/common';

import { RoleEntity } from './role.entity';

@Entity({ name: 'permissions', schema: 'public' })
@Index(['name'], { unique: true })
@Index(['module', 'action'])
export class PermissionEntity extends BaseTimestampEntity {
  /**
   * Nombre del permiso (único) - formato: module.action
   * @example 'users.create', 'users.read', 'users.update', 'users.delete'
   */
  @Column({ type: 'varchar', length: 100, unique: true, name: 'name' })
  name: string;

  /**
   * Descripción del permiso
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description: string | null;

  /**
   * Módulo al que pertenece
   * @example 'users', 'roles', 'logs', 'settings'
   */
  @Column({ type: 'varchar', length: 50, name: 'module' })
  @Index()
  module: string;

  /**
   * Acción del permiso
   * @example 'create', 'read', 'update', 'delete', 'manage'
   */
  @Column({ type: 'varchar', length: 50, name: 'action' })
  action: string;

  /**
   * Si es un permiso del sistema (no eliminable)
   */
  @Column({ type: 'boolean', default: false, name: 'is_system' })
  is_system: boolean;

  /**
   * Si el permiso está activo
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  /**
   * Roles que tienen este permiso
   */
  @ManyToMany(() => RoleEntity, (role) => role.permissions)
  roles: RoleEntity[];
}
