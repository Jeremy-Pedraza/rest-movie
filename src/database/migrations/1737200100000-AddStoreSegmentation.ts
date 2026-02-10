// src/database/migrations/1737200100000-AddStoreSegmentation.ts

/**
 * @fileoverview Migración para agregar campos de segmentación a stores
 * @module database/migrations
 *
 * FASE 2 del Plan Multi-Tenant para Reportes
 * Agrega soporte para:
 * - Región geográfica
 * - Tipo de ubicación
 * - Formato de tienda
 * - Capacidad y servicios
 * - Clasificación de ventas
 * - Tags flexibles
 */

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddStoreSegmentation1737200100000 implements MigrationInterface {
  name = 'AddStoreSegmentation1737200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Iniciando migración: AddStoreSegmentation');

    // Verificar si la tabla existe
    const tableExists = await queryRunner.hasTable('stores');
    if (!tableExists) {
      console.log('❌ La tabla stores no existe. Ejecuta primero CreateStoresTable.');
      throw new Error('La tabla stores no existe');
    }

    // Verificar si los campos ya existen (idempotencia)
    const table = await queryRunner.getTable('stores');
    const hasRegion = table?.columns.find((col) => col.name === 'region');

    if (hasRegion) {
      console.log('⚠️ Los campos de segmentación ya existen. Saltando migración.');
      return;
    }

    // ============================================
    // AGREGAR NUEVAS COLUMNAS
    // ============================================

    console.log('📝 Agregando columna: region');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'region',
        type: 'varchar',
        length: '50',
        isNullable: true,
        comment: 'Región geográfica para agrupación (ej: Metropolitana, Norte, Sur)',
      }),
    );

    console.log('📝 Agregando columna: location_type');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'location_type',
        type: 'varchar',
        length: '30',
        isNullable: true,
        comment: 'Tipo de ubicación (mall, street, airport, highway, food_court, gas_station)',
      }),
    );

    console.log('📝 Agregando columna: store_format');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'store_format',
        type: 'varchar',
        length: '30',
        isNullable: true,
        comment: 'Formato de tienda (express, regular, flagship, cantina, drive_thru_only)',
      }),
    );

    console.log('📝 Agregando columna: seating_capacity');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'seating_capacity',
        type: 'int',
        isNullable: true,
        comment: 'Capacidad de asientos para dine-in',
      }),
    );

    console.log('📝 Agregando columna: has_drive_thru');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'has_drive_thru',
        type: 'boolean',
        default: false,
        comment: 'Indica si tiene servicio drive-thru',
      }),
    );

    console.log('📝 Agregando columna: has_delivery');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'has_delivery',
        type: 'boolean',
        default: false,
        comment: 'Indica si tiene servicio de delivery propio',
      }),
    );

    console.log('📝 Agregando columna: operating_hours');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'operating_hours',
        type: 'jsonb',
        isNullable: true,
        comment: 'Horarios de operación por día { monday: { open, close }, ... }',
      }),
    );

    console.log('📝 Agregando columna: opening_date');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'opening_date',
        type: 'date',
        isNullable: true,
        comment: 'Fecha de apertura de la tienda',
      }),
    );

    console.log('📝 Agregando columna: manager_name');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'manager_name',
        type: 'varchar',
        length: '100',
        isNullable: true,
        comment: 'Nombre del gerente/responsable',
      }),
    );

    console.log('📝 Agregando columna: sales_tier');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'sales_tier',
        type: 'varchar',
        length: '5',
        isNullable: true,
        comment: 'Clasificación de ventas (A=top, B, C, D, E=bajo)',
      }),
    );

    console.log('📝 Agregando columna: tags');
    await queryRunner.addColumn(
      'stores',
      new TableColumn({
        name: 'tags',
        type: 'text',
        isArray: true,
        isNullable: true,
        comment: 'Tags para filtrado flexible [24h, nuevo, remodelado, wifi]',
      }),
    );

    // ============================================
    // CREAR ÍNDICES PARA SEGMENTACIÓN
    // ============================================

    console.log('📝 Creando índice: idx_stores_region');
    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_region',
        columnNames: ['region'],
      }),
    );

    console.log('📝 Creando índice: idx_stores_location_type');
    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_location_type',
        columnNames: ['location_type'],
      }),
    );

    console.log('📝 Creando índice: idx_stores_format');
    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_format',
        columnNames: ['store_format'],
      }),
    );

    console.log('📝 Creando índice: idx_stores_sales_tier');
    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_sales_tier',
        columnNames: ['sales_tier'],
      }),
    );

    // Índice compuesto para queries comunes de segmentación
    console.log('📝 Creando índice compuesto: idx_stores_segmentation');
    await queryRunner.createIndex(
      'stores',
      new TableIndex({
        name: 'idx_stores_segmentation',
        columnNames: ['company_id', 'region', 'location_type', 'store_format'],
      }),
    );

    // ============================================
    // RESUMEN
    // ============================================

    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  MIGRACIÓN COMPLETADA: AddStoreSegmentation                ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  ✅ region (varchar 50) + índice                           ║');
    console.log('║  ✅ location_type (varchar 30) + índice                    ║');
    console.log('║  ✅ store_format (varchar 30) + índice                     ║');
    console.log('║  ✅ seating_capacity (int)                                 ║');
    console.log('║  ✅ has_drive_thru (boolean)                               ║');
    console.log('║  ✅ has_delivery (boolean)                                 ║');
    console.log('║  ✅ operating_hours (jsonb)                                ║');
    console.log('║  ✅ opening_date (date)                                    ║');
    console.log('║  ✅ manager_name (varchar 100)                             ║');
    console.log('║  ✅ sales_tier (varchar 5) + índice                        ║');
    console.log('║  ✅ tags (text[])                                          ║');
    console.log('║  ✅ idx_stores_segmentation (compuesto)                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revirtiendo migración: AddStoreSegmentation');

    const table = await queryRunner.getTable('stores');

    // Eliminar índices
    const indicesToDrop = [
      'idx_stores_segmentation',
      'idx_stores_sales_tier',
      'idx_stores_format',
      'idx_stores_location_type',
      'idx_stores_region',
    ];

    for (const indexName of indicesToDrop) {
      const index = table?.indices.find((idx) => idx.name === indexName);
      if (index) {
        console.log(`📝 Eliminando índice: ${indexName}`);
        await queryRunner.dropIndex('stores', indexName);
      }
    }

    // Eliminar columnas en orden inverso
    const columnsToRemove = [
      'tags',
      'sales_tier',
      'manager_name',
      'opening_date',
      'operating_hours',
      'has_delivery',
      'has_drive_thru',
      'seating_capacity',
      'store_format',
      'location_type',
      'region',
    ];

    for (const columnName of columnsToRemove) {
      const column = table?.columns.find((col) => col.name === columnName);
      if (column) {
        console.log(`📝 Eliminando columna: ${columnName}`);
        await queryRunner.dropColumn('stores', columnName);
      }
    }

    console.log('✅ Migración revertida exitosamente');
  }
}
