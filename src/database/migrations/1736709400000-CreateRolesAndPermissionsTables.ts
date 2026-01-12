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
            default: 'uuid_generate_v4()',
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
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
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
            default: 'uuid_generate_v4()',
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
            name: 'resource',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
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
            name: 'roleId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'permissionId',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Primary key compuesta para role_permissions
    await queryRunner.createPrimaryKey('role_permissions', ['roleId', 'permissionId']);

    // Foreign keys para role_permissions
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'FK_role_permissions_roleId',
        columnNames: ['roleId'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        name: 'FK_role_permissions_permissionId',
        columnNames: ['permissionId'],
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
        name: 'IDX_role_permissions_roleId',
        columnNames: ['roleId'],
      }),
    );

    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'IDX_role_permissions_permissionId',
        columnNames: ['permissionId'],
      }),
    );

    // ============================================
    // INSERTAR ROLES POR DEFECTO
    // ============================================
    await queryRunner.query(`
      INSERT INTO roles (id, name, description) VALUES
      (uuid_generate_v4(), 'super_admin', 'Super Administrador con acceso total'),
      (uuid_generate_v4(), 'admin', 'Administrador del sistema'),
      (uuid_generate_v4(), 'manager', 'Gerente con permisos de gestión'),
      (uuid_generate_v4(), 'user', 'Usuario estándar'),
      (uuid_generate_v4(), 'guest', 'Usuario invitado con acceso limitado')
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
