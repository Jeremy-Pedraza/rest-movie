// src/database/migrations/1736709400000-CreateRolesAndPermissionsTables.ts

/**
 * @fileoverview Migración para crear tablas de roles y permisos
 * @module database/migrations
 *
 * Crea las tablas para el sistema RBAC (Role-Based Access Control):
 * - roles: Roles del sistema
 * - permissions: Permisos disponibles
 * - role_permissions: Relación many-to-many
 * - user_roles: Relación many-to-many entre users y roles
 *
 * DEBE ejecutarse ANTES de CreateUsersTable
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRolesAndPermissionsTables1736709400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // TABLA: roles
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'hierarchy',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // ============================================
    // TABLA: permissions
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'module',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // ============================================
    // TABLA: role_permissions (many-to-many)
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'role_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'permission_id',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Primary key compuesta para role_permissions
    await queryRunner.createPrimaryKey('role_permissions', ['role_id', 'permission_id']);

    // Foreign keys para role_permissions
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'FK_role_permissions_role_id',
        columnNames: ['role_id'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'FK_role_permissions_permission_id',
        columnNames: ['permission_id'],
        referencedTableName: 'permissions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Índices para role_permissions
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'IDX_role_permissions_role_id',
        columnNames: ['role_id'],
      }),
    );

    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'IDX_role_permissions_permission_id',
        columnNames: ['permission_id'],
      }),
    );

    // ============================================
    // INSERTAR ROLES POR DEFECTO
    // ============================================
    await queryRunner.query(`
      INSERT INTO roles (id, name, description) VALUES
      (gen_random_uuid(), 'super_admin', 'Super Administrador con acceso total'),
      (gen_random_uuid(), 'admin', 'Administrador del sistema'),
      (gen_random_uuid(), 'manager', 'Gerente con permisos de gestión'),
      (gen_random_uuid(), 'user', 'Usuario estándar'),
      (gen_random_uuid(), 'guest', 'Usuario invitado con acceso limitado')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla role_permissions (tiene FKs)
    await queryRunner.dropTable('role_permissions');

    // Eliminar tablas principales
    await queryRunner.dropTable('permissions');
    await queryRunner.dropTable('roles');
  }
}
