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
            default: 'uuid_generate_v4()',
          },

          // ============================================
          // RELACIONES
          // ============================================
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },

          // ============================================
          // TOKENS
          // ============================================
          {
            name: 'refreshToken',
            type: 'text',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'refreshTokenFamily',
            type: 'text',
            isNullable: true,
          },

          // ============================================
          // INFORMACIÓN DE SESIÓN
          // ============================================
          {
            name: 'userAgent',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'ipAddress',
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
            name: 'createdAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'lastActivityAt',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'deletedAt',
            type: 'timestamptz',
            isNullable: true,
          },

          // ============================================
          // METADATA
          // ============================================
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'isRevoked',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'revokedAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'revokedReason',
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

    // Índice simple en userId (para búsquedas rápidas por usuario)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_userId',
        columnNames: ['userId'],
      }),
    );

    // Índice simple en refreshToken (único, ya creado con isUnique)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_refreshToken',
        columnNames: ['refreshToken'],
      }),
    );

    // Índice simple en ipAddress (para análisis de seguridad)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_ipAddress',
        columnNames: ['ipAddress'],
      }),
    );

    // Índice simple en expiresAt (para limpieza automática)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expiresAt',
        columnNames: ['expiresAt'],
      }),
    );

    // Índice compuesto: userId + deletedAt (para sesiones activas de un usuario)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_userId_deletedAt',
        columnNames: ['userId', 'deletedAt'],
      }),
    );

    // Índice compuesto: refreshToken + deletedAt (para validación rápida)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_refreshToken_deletedAt',
        columnNames: ['refreshToken', 'deletedAt'],
      }),
    );

    // Índice compuesto: expiresAt + deletedAt (para limpieza eficiente)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expiresAt_deletedAt',
        columnNames: ['expiresAt', 'deletedAt'],
      }),
    );

    // ============================================
    // FOREIGN KEYS
    // ============================================

    // FK a tabla users con CASCADE DELETE
    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        name: 'FK_sessions_userId',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE', // Si se elimina el usuario, se eliminan sus sesiones
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar FK
    await queryRunner.dropForeignKey('sessions', 'FK_sessions_userId');

    // Eliminar índices (en orden inverso)
    await queryRunner.dropIndex('sessions', 'IDX_sessions_expiresAt_deletedAt');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_refreshToken_deletedAt');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_userId_deletedAt');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_expiresAt');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_ipAddress');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_refreshToken');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_userId');

    // Eliminar tabla
    await queryRunner.dropTable('sessions');
  }
}
