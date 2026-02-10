// src/database/migrations/1737100000000-CreateStoresTable.ts

/**
 * @fileoverview Migración para crear tabla stores y tabla intermedia user_stores
 * @module database/migrations
 *
 * Esta migración crea:
 * 1. Tabla stores - Tiendas/Sucursales
 * 2. Tabla user_stores - Relación ManyToMany Users <-> Stores
 *
 * Dependencias:
 * - companies (FK company_id)
 * - users (FK user_id en user_stores)
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateStoresTable1737100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. TABLA STORES
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'stores',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID de la compañía a la que pertenece',
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Nombre de la tienda',
          },
          {
            name: 'codigo',
            type: 'varchar',
            length: '20',
            isNullable: false,
            isUnique: true,
            comment: 'Código único de tienda',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Email de contacto',
          },
          {
            name: 'telefono',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Teléfono de contacto',
          },
          {
            name: 'direccion',
            type: 'text',
            isNullable: false,
            comment: 'Dirección física',
          },
          {
            name: 'ciudad',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Ciudad',
          },
          {
            name: 'zona',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Zona o sector',
          },
          {
            name: 'latitud',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
            comment: 'Latitud GPS',
          },
          {
            name: 'longitud',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
            comment: 'Longitud GPS',
          },
          {
            name: 'activo',
            type: 'boolean',
            default: true,
            isNullable: false,
            comment: 'Estado activo/inactivo',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadata adicional (horarios, capacidad, etc.)',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: true,
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Índices de stores
    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_company_id',
        columnNames: ['company_id'],
      }),
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_codigo',
        columnNames: ['codigo'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_company_codigo',
        columnNames: ['company_id', 'codigo'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_activo',
        columnNames: ['activo'],
      }),
    );

    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_ciudad',
        columnNames: ['ciudad'],
      }),
    );

    // Foreign Key: stores.company_id -> companies.id
    await queryRunner.createForeignKey(
      'stores',
      new TableForeignKey({
        name: 'fk_stores_company',
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla stores creada exitosamente');

    // ============================================
    // 2. TABLA USER_STORES (ManyToMany)
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'user_stores',
        schema: 'public',
        columns: [
          {
            name: 'store_id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'assigned_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
            comment: 'Fecha de asignación',
          },
        ],
      }),
      true,
    );

    // Índices de user_stores
    await queryRunner.createIndex(
      'user_stores',
      new TableIndex({
        name: 'idx_user_stores_store_id',
        columnNames: ['store_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_stores',
      new TableIndex({
        name: 'idx_user_stores_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Foreign Keys de user_stores
    await queryRunner.createForeignKey(
      'user_stores',
      new TableForeignKey({
        name: 'fk_user_stores_store',
        columnNames: ['store_id'],
        referencedTableName: 'stores',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_stores',
      new TableForeignKey({
        name: 'fk_user_stores_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla user_stores creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla user_stores
    await queryRunner.dropForeignKey('user_stores', 'fk_user_stores_user');
    await queryRunner.dropForeignKey('user_stores', 'fk_user_stores_store');
    await queryRunner.dropIndex('user_stores', 'idx_user_stores_user_id');
    await queryRunner.dropIndex('user_stores', 'idx_user_stores_store_id');
    await queryRunner.dropTable('user_stores', true);
    console.log('✅ Tabla user_stores eliminada');

    // Eliminar tabla stores
    await queryRunner.dropForeignKey('stores', 'fk_stores_company');
    await queryRunner.dropIndex('stores', 'idx_stores_ciudad');
    await queryRunner.dropIndex('stores', 'idx_stores_activo');
    await queryRunner.dropIndex('stores', 'idx_stores_company_codigo');
    await queryRunner.dropIndex('stores', 'idx_stores_codigo');
    await queryRunner.dropIndex('stores', 'idx_stores_company_id');
    await queryRunner.dropTable('stores', true);
    console.log('✅ Tabla stores eliminada');
  }
}
