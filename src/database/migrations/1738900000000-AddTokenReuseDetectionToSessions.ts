// src/database/migrations/1738900000000-AddTokenReuseDetectionToSessions.ts

/**
 * @fileoverview Migración para agregar detección de reuse de refresh tokens
 * @module database/migrations
 *
 * Agrega campos para rotación por familia con detección real de reuse:
 * - token_jti: Identificador único del token (JWT ID)
 * - parent_session_id: Referencia a la sesión padre (cadena de rotación)
 * - consumed_at: Timestamp cuando el token fue usado para rotar
 *
 * Índices:
 * - token_jti (unique): Búsqueda rápida por JTI
 * - refresh_token_family: Revocación de toda la familia
 * - user_id + is_revoked: Sesiones activas por usuario
 */

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddTokenReuseDetectionToSessions1738900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna token_jti
    await queryRunner.addColumn(
      'sessions',
      new TableColumn({
        name: 'token_jti',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      }),
    );

    // Agregar columna parent_session_id
    await queryRunner.addColumn(
      'sessions',
      new TableColumn({
        name: 'parent_session_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Agregar columna consumed_at
    await queryRunner.addColumn(
      'sessions',
      new TableColumn({
        name: 'consumed_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );

    // Índice en token_jti (único)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_token_jti',
        columnNames: ['token_jti'],
        isUnique: true,
      }),
    );

    // Índice en refresh_token_family
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_refresh_token_family',
        columnNames: ['refresh_token_family'],
      }),
    );

    // Índice compuesto: user_id + is_revoked (sesiones activas por usuario)
    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_id_is_revoked',
        columnNames: ['user_id', 'is_revoked'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('sessions', 'IDX_sessions_user_id_is_revoked');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_refresh_token_family');
    await queryRunner.dropIndex('sessions', 'IDX_sessions_token_jti');
    await queryRunner.dropColumn('sessions', 'consumed_at');
    await queryRunner.dropColumn('sessions', 'parent_session_id');
    await queryRunner.dropColumn('sessions', 'token_jti');
  }
}
