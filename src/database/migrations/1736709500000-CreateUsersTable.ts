// src/database/migrations/1736709500000-CreateUsersTable.ts

/**
 * @fileoverview Migración para crear tabla users
 * @module database/migrations
 *
 * Tabla principal de usuarios del sistema
 * DEBE ejecutarse ANTES de CreateSessionsTable
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUsersTable1736709500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla users
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          // ============================================
          // PRIMARY KEY
          // ============================================
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },

          // ============================================
          // INFORMACIÓN BÁSICA
          // ============================================
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'avatar',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },

          // ============================================
          // ESTADO Y VERIFICACIÓN
          // ============================================
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'email_verified_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'email_verification_token',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },

          // ============================================
          // SEGURIDAD
          // ============================================
          {
            name: 'failed_login_attempts',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'locked_until',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_login_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'password_reset_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'password_reset_expires',
            type: 'timestamptz',
            isNullable: true,
          },

          // ============================================
          // METADATA
          // ============================================
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            isNullable: true,
          },

          // ============================================
          // TIMESTAMPS
          // ============================================
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
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // ============================================
    // ÍNDICES
    // ============================================

    // Índice en email (único, ya creado con isUnique)
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email',
        columnNames: ['email'],
      }),
    );

    // Índice en status para filtros
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_status',
        columnNames: ['status'],
      }),
    );

    // Índice compuesto: email + deletedAt
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_email_deleted_at',
        columnNames: ['email', 'deleted_at'],
      }),
    );

    // Índice compuesto: status + deletedAt
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_status_deleted_at',
        columnNames: ['status', 'deleted_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.dropIndex('users', 'IDX_users_status_deleted_at');
    await queryRunner.dropIndex('users', 'IDX_users_email_deleted_at');
    await queryRunner.dropIndex('users', 'IDX_users_status');
    await queryRunner.dropIndex('users', 'IDX_users_email');

    // Eliminar tabla
    await queryRunner.dropTable('users');
  }
}
