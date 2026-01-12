// src/database/migrations/1736709550000-CreateUserRolesTable.ts

/**
 * @fileoverview Migración para crear tabla user_roles
 * @module database/migrations
 *
 * Tabla intermedia para relación many-to-many entre users y roles
 * DEBE ejecutarse DESPUÉS de CreateUsersTable
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateUserRolesTable1736709550000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla user_roles (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'roleId',
            type: 'uuid',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Primary key compuesta
    await queryRunner.createPrimaryKey('user_roles', ['userId', 'roleId']);

    // Foreign key a users
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_userId',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Foreign key a roles
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        name: 'FK_user_roles_roleId',
        columnNames: ['roleId'],
        referencedTableName: 'roles',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Índices
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_user_roles_roleId',
        columnNames: ['roleId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla (las FKs se eliminan automáticamente)
    await queryRunner.dropTable('user_roles');
  }
}
