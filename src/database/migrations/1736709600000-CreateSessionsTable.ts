// src/database/migrations/1736709600000-CreateSessionsTable.ts

/**
 * @fileoverview Migración para crear tabla sessions
 * @module database/migrations
 *
 * Tabla para gestionar sesiones de usuario con refresh tokens
 *
 * Características:
 * - Refresh token único por sesión
 * - Tracking de IP, user agent, device
 * - Expiración automática
 * - Soft deletes
 * - Revocación manual
 * - Token reuse detection (refreshTokenFamily)
 */

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateSessionsTable1736709600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla sessions
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          // ============================================
          // PRIMARY KEY
          // ============================================
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },

          // ============================================
          // RELACIONES
          // ============================================
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },

          // ============================================
          // TOKENS
          // ============================================
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'refresh_token_family',
            type: 'text',
            isNullable: true,
          },

          // ============================================
          // INFORMACIÓN DE SESIÓN
          // ============================================
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: false,
          },
          {
            name: 'device',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },

          // ============================================
          // TIMESTAMPS Y EXPIRACIÓN
          // ============================================
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'last_activity_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },

          // ============================================
          // METADATA
          // ============================================
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'revoked_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // ============================================
    // ÍNDICES
    // ============================================

    // Índice simple en user_id (para búsquedas rápidas por usuario)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Índice simple en refresh_token (único, ya creado con isUnique)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_refresh_token',
        columnNames: ['refresh_token'],
      }),
    );

    // Índice simple en ip_address (para análisis de seguridad)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_ip_address',
        columnNames: ['ip_address'],
      }),
    );

    // Índice simple en expires_at (para limpieza automática)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    // Índice compuesto: user_id + deleted_at (para sesiones activas de un usuario)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_id_deleted_at',
        columnNames: ['user_id', 'deleted_at'],
      }),
    );

    // Índice compuesto: refresh_token + deleted_at (para validación rápida)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_refresh_token_deleted_at',
        columnNames: ['refresh_token', 'deleted_at'],
      }),
    );

    // Índice compuesto: expires_at + deleted_at (para limpieza eficiente)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expires_at_deleted_at',
        columnNames: ['expires_at', 'deleted_at'],
      }),
    );

    // ============================================
    // FOREIGN KEYS
    // ============================================

    // FK a tabla users con CASCADE DELETE
    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        name: 'FK_sessions_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Si se elimina el usuario, se eliminan sus sesiones
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar FK
    await queryRunner.dropForeignKey('sessions', 'FK_sessions_user_id');

    // Eliminar índices (en orden inverso)
    await queryRunner.dropIndex('sessions', 'IDX_sessions_expires_at_deleted_at');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_refresh_token_deleted_at');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_user_id_deleted_at');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_expires_at');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_ip_address');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_refresh_token');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_user_id');
    // Eliminar tabla
    await queryRunner.dropTable('sessions');
  }
}
