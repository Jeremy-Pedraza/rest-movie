// src/modules/user/entities/role.entity.ts

/**
 * @fileoverview Entidad de roles
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
  JoinTable,
} from 'typeorm';

import { UserEntity } from './user.entity';
import { PermissionEntity } from './permission.entity';

@Entity({ name: 'roles', schema: 'public' })
@Index(['name'], { unique: true })
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nombre del rol (único)
   */
  @Column({ type: 'varchar', length: 50, unique: true, name: 'name' })
  name: string;

  /**
   * Descripción del rol
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'description' })
  description: string | null;

  /**
   * Si es un rol del sistema (no eliminable)
   */
  @Column({ type: 'boolean', default: false, name: 'is_system' })
  is_system: boolean;

  /**
   * Si el rol está activo
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  /**
   * Nivel de jerarquía (mayor = más permisos)
   */
  @Column({ type: 'int', default: 0, name: 'hierarchy' })
  hierarchy: number;

  /**
   * Usuarios con este rol
   */
  @ManyToMany(() => UserEntity, (user) => user.roles)
  users: UserEntity[];

  /**
   * Permisos del rol
   */
  @ManyToMany(() => PermissionEntity, (permission) => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: PermissionEntity[];

  /**
   * Fecha de creación
   */
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  /**
   * Fecha de actualización
   */
  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updated_at: Date;

  // ============================================
  // VIRTUAL PROPERTIES
  // ============================================

  /**
   * Lista de nombres de permisos
   */
  get permissionNames(): string[] {
    return this.permissions?.map((p) => p.name) || [];
  }

  // ============================================
  // METHODS
  // ============================================

  /**
   * Verifica si tiene un permiso específico
   * @param permissionName - Nombre del permiso
   * @returns true si tiene el permiso
   */
  hasPermission(permissionName: string): boolean {
    return this.permissionNames.includes(permissionName);
  }

  /**
   * Verifica si tiene todos los permisos especificados
   * @param permissionNames - Nombres de permisos
   * @returns true si tiene todos
   */
  hasAllPermissions(permissionNames: string[]): boolean {
    return permissionNames.every((p) => this.hasPermission(p));
  }

  /**
   * Verifica si tiene alguno de los permisos especificados
   * @param permissionNames - Nombres de permisos
   * @returns true si tiene alguno
   */
  hasAnyPermission(permissionNames: string[]): boolean {
    return permissionNames.some((p) => this.hasPermission(p));
  }
}
