// src/database/migrations/1736800000000-CreateLogsTable.ts

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migración para crear la tabla de logs
 *
 * Esta tabla almacena todos los logs de la aplicación:
 * - Logs HTTP (requests/responses)
 * - Logs de errores (exceptions)
 * - Logs de negocio (business logic)
 * - Logs de sistema (system events)
 *
 * @see src/modules/logger/entities/log.entity.ts
 */
export class CreateLogsTable1736800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. CREAR ENUMS
    // ============================================

    // Enum para niveles de log (error, warn, info, debug, verbose)
    await queryRunner.query(`
      CREATE TYPE log_level AS ENUM ('error', 'warn', 'info', 'debug', 'verbose');
    `);

    // Enum para contextos de log (http, database, auth, business, system, queue, cache, external)
    await queryRunner.query(`
      CREATE TYPE log_context AS ENUM ('http', 'database', 'auth', 'business', 'system', 'queue', 'cache', 'external');
    `);

    // ============================================
    // 2. CREAR TABLA logs
    // ============================================

    await queryRunner.createTable(
      new Table({
        name: 'logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'level',
            type: 'log_level',
            default: "'info'",
            comment: 'Nivel del log: error, warn, info, debug, verbose',
          },
          {
            name: 'context',
            type: 'log_context',
            default: "'system'",
            comment: 'Contexto/módulo que genera el log',
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
            comment: 'Mensaje principal del log',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Datos adicionales estructurados (JSON)',
          },
          {
            name: 'stack',
            type: 'text',
            isNullable: true,
            comment: 'Stack trace (para errores)',
          },
          {
            name: 'request_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID de la petición HTTP (correlación)',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID del usuario (si está autenticado)',
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'IP del cliente (IPv4 o IPv6)',
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'User Agent del cliente',
          },
          {
            name: 'method',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Método HTTP (GET, POST, etc.)',
          },
          {
            name: 'url',
            type: 'varchar',
            length: '2048',
            isNullable: true,
            comment: 'URL de la petición',
          },
          {
            name: 'status_code',
            type: 'int',
            isNullable: true,
            comment: 'Código de estado HTTP (200, 404, 500, etc.)',
          },
          {
            name: 'response_time',
            type: 'int',
            isNullable: true,
            comment: 'Tiempo de respuesta en milisegundos',
          },
          {
            name: 'service',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Nombre del servicio/clase que genera el log',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Nombre de la acción/método',
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Código de error del sistema (AUTH_1001, VAL_2001, etc.)',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            comment: 'Fecha de creación del log',
          },
        ],
      }),
      true,
    );

    // ============================================
    // 3. CREAR ÍNDICES
    // ============================================

    // Índice compuesto: level + created_at (para filtrar por nivel y ordenar por fecha)
    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_logs_level_created_at',
        columnNames: ['level', 'created_at'],
      }),
    );

    // Índice compuesto: context + created_at (para filtrar por contexto y ordenar por fecha)
    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_logs_context_created_at',
        columnNames: ['context', 'created_at'],
      }),
    );

    // Índice compuesto: user_id + created_at (para ver logs de un usuario específico)
    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_logs_user_id_created_at',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    // Índice simple: request_id (para tracing/correlación de requests)
    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_logs_request_id',
        columnNames: ['request_id'],
      }),
    );

    // Índice simple: created_at (para ordenar por fecha)
    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_logs_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla (los índices se eliminan automáticamente)
    await queryRunner.dropTable('logs');

    // Eliminar enums
    await queryRunner.query('DROP TYPE IF EXISTS log_context');
    await queryRunner.query('DROP TYPE IF EXISTS log_level');
  }
}
