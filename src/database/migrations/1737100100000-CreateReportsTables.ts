// src/database/migrations/1737100100000-CreateReportsTables.ts

/**
 * @fileoverview Migración para crear tablas del módulo Reports
 * @module database/migrations
 *
 * Esta migración crea las siguientes tablas:
 * 1. report_headers - Cabecera principal de reportes
 * 2. sales_by_order_type - Ventas por tipo de orden
 * 3. payment_methods - Métodos de pago
 * 4. dynamic_discounts - Descuentos dinámicos
 * 5. adjustments - Ajustes y devoluciones
 * 6. effective_orders - Órdenes efectivas
 *
 * Dependencias:
 * - stores (FK store_id en report_headers)
 *
 * Arquitectura:
 * Company → Store → ReportHeader → [SalesByOrderType, PaymentMethod, DynamicDiscount, Adjustment, EffectiveOrder]
 */

import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateReportsTables1737100100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. ENUM report_type
    // ============================================
    await queryRunner.query(`
      CREATE TYPE report_type_enum AS ENUM ('daily', 'weekly', 'monthly');
    `);
    console.log('✅ Enum report_type_enum creado');

    // ============================================
    // 2. TABLA REPORT_HEADERS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'report_headers',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'store_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID de la tienda que generó el reporte',
          },
          {
            name: 'report_date',
            type: 'date',
            isNullable: false,
            comment: 'Fecha del reporte (YYYY-MM-DD)',
          },
          {
            name: 'report_type',
            type: 'report_type_enum',
            default: "'daily'",
            isNullable: false,
            comment: 'Tipo de reporte (daily, weekly, monthly)',
          },
          // Métricas principales
          {
            name: 'total_sales',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Total de ventas en el período',
          },
          {
            name: 'total_revenue',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Total de ingresos (ventas - descuentos)',
          },
          {
            name: 'total_quantity',
            type: 'int',
            default: 0,
            comment: 'Cantidad total de productos vendidos',
          },
          {
            name: 'orders_count',
            type: 'int',
            default: 0,
            comment: 'Cantidad de órdenes procesadas',
          },
          {
            name: 'average_ticket',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Ticket promedio (revenue / orders_count)',
          },
          // Descuentos y ajustes
          {
            name: 'total_discounts',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Total de descuentos aplicados',
          },
          {
            name: 'total_adjustments',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Total de ajustes (devoluciones, cancelaciones)',
          },
          // Metadata
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Información adicional en formato JSON',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'published'",
            comment: 'Estado del reporte (draft, published, archived)',
          },
          // Timestamps
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
        ],
      }),
      true,
    );

    // Índices de report_headers
    await queryRunner.createIndex(
      'report_headers',
      new TableIndex({
        name: 'idx_report_headers_store_date',
        columnNames: ['store_id', 'report_date'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'report_headers',
      new TableIndex({
        name: 'idx_report_headers_report_date',
        columnNames: ['report_date'],
      }),
    );

    await queryRunner.createIndex(
      'report_headers',
      new TableIndex({
        name: 'idx_report_headers_report_type',
        columnNames: ['report_type'],
      }),
    );

    await queryRunner.createIndex(
      'report_headers',
      new TableIndex({
        name: 'idx_report_headers_store_type',
        columnNames: ['store_id', 'report_type'],
      }),
    );

    await queryRunner.createIndex(
      'report_headers',
      new TableIndex({
        name: 'idx_report_headers_status',
        columnNames: ['status'],
      }),
    );

    // Foreign Key: report_headers.store_id -> stores.id
    await queryRunner.createForeignKey(
      'report_headers',
      new TableForeignKey({
        name: 'fk_report_headers_store',
        columnNames: ['store_id'],
        referencedTableName: 'stores',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla report_headers creada exitosamente');

    // ============================================
    // 3. TABLA SALES_BY_ORDER_TYPE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'sales_by_order_type',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'report_header_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID del reporte padre',
          },
          {
            name: 'order_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo de orden (dine_in, takeout, delivery, pickup)',
          },
          {
            name: 'total_sales',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Total de ventas para este tipo',
          },
          {
            name: 'orders_count',
            type: 'int',
            default: 0,
            comment: 'Cantidad de órdenes de este tipo',
          },
          {
            name: 'quantity',
            type: 'int',
            default: 0,
            comment: 'Cantidad de productos vendidos',
          },
          {
            name: 'average_ticket',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Ticket promedio para este tipo',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'sales_by_order_type',
      new TableIndex({
        name: 'idx_sales_by_order_type_header',
        columnNames: ['report_header_id'],
      }),
    );

    await queryRunner.createIndex(
      'sales_by_order_type',
      new TableIndex({
        name: 'idx_sales_by_order_type_type',
        columnNames: ['order_type'],
      }),
    );

    await queryRunner.createForeignKey(
      'sales_by_order_type',
      new TableForeignKey({
        name: 'fk_sales_by_order_type_header',
        columnNames: ['report_header_id'],
        referencedTableName: 'report_headers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla sales_by_order_type creada exitosamente');

    // ============================================
    // 4. TABLA PAYMENT_METHODS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'payment_methods',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'report_header_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID del reporte padre',
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Método de pago (cash, credit_card, debit_card, etc.)',
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Monto total recaudado',
          },
          {
            name: 'transactions_count',
            type: 'int',
            default: 0,
            comment: 'Cantidad de transacciones',
          },
          {
            name: 'average_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Monto promedio por transacción',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'payment_methods',
      new TableIndex({
        name: 'idx_payment_methods_header',
        columnNames: ['report_header_id'],
      }),
    );

    await queryRunner.createIndex(
      'payment_methods',
      new TableIndex({
        name: 'idx_payment_methods_method',
        columnNames: ['payment_method'],
      }),
    );

    await queryRunner.createForeignKey(
      'payment_methods',
      new TableForeignKey({
        name: 'fk_payment_methods_header',
        columnNames: ['report_header_id'],
        referencedTableName: 'report_headers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla payment_methods creada exitosamente');

    // ============================================
    // 5. TABLA DYNAMIC_DISCOUNTS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'dynamic_discounts',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'report_header_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID del reporte padre',
          },
          {
            name: 'discount_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo de descuento (promotional, loyalty, coupon, etc.)',
          },
          {
            name: 'discount_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Nombre del descuento',
          },
          {
            name: 'total_discount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Monto total de descuento aplicado',
          },
          {
            name: 'times_applied',
            type: 'int',
            default: 0,
            comment: 'Veces que se aplicó el descuento',
          },
          {
            name: 'average_discount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Descuento promedio por aplicación',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'dynamic_discounts',
      new TableIndex({
        name: 'idx_dynamic_discounts_header',
        columnNames: ['report_header_id'],
      }),
    );

    await queryRunner.createIndex(
      'dynamic_discounts',
      new TableIndex({
        name: 'idx_dynamic_discounts_type',
        columnNames: ['discount_type'],
      }),
    );

    await queryRunner.createForeignKey(
      'dynamic_discounts',
      new TableForeignKey({
        name: 'fk_dynamic_discounts_header',
        columnNames: ['report_header_id'],
        referencedTableName: 'report_headers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla dynamic_discounts creada exitosamente');

    // ============================================
    // 6. TABLA ADJUSTMENTS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'adjustments',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'report_header_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID del reporte padre',
          },
          {
            name: 'adjustment_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo de ajuste (refund, cancellation, void, etc.)',
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
            comment: 'Razón del ajuste',
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Monto total del ajuste (puede ser negativo)',
          },
          {
            name: 'count',
            type: 'int',
            default: 0,
            comment: 'Cantidad de ajustes de este tipo',
          },
          {
            name: 'average_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            comment: 'Monto promedio por ajuste',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'adjustments',
      new TableIndex({
        name: 'idx_adjustments_header',
        columnNames: ['report_header_id'],
      }),
    );

    await queryRunner.createIndex(
      'adjustments',
      new TableIndex({
        name: 'idx_adjustments_type',
        columnNames: ['adjustment_type'],
      }),
    );

    await queryRunner.createForeignKey(
      'adjustments',
      new TableForeignKey({
        name: 'fk_adjustments_header',
        columnNames: ['report_header_id'],
        referencedTableName: 'report_headers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla adjustments creada exitosamente');

    // ============================================
    // 7. TABLA EFFECTIVE_ORDERS
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'effective_orders',
        schema: 'public',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'report_header_id',
            type: 'uuid',
            isNullable: false,
            comment: 'ID del reporte padre',
          },
          {
            name: 'order_number',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Número de orden',
          },
          {
            name: 'order_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo de orden (dine_in, takeout, delivery, pickup)',
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Monto total de la orden (después de descuentos)',
          },
          {
            name: 'gross_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Monto bruto (antes de descuentos)',
          },
          {
            name: 'discounts',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
            comment: 'Descuentos aplicados',
          },
          {
            name: 'items_count',
            type: 'int',
            default: 0,
            comment: 'Cantidad de items en la orden',
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Método de pago usado',
          },
          {
            name: 'order_datetime',
            type: 'timestamp with time zone',
            isNullable: false,
            comment: 'Fecha y hora de la orden',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'completed'",
            comment: 'Estado de la orden (completed, cancelled, refunded)',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Información adicional de la orden',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'effective_orders',
      new TableIndex({
        name: 'idx_effective_orders_header',
        columnNames: ['report_header_id'],
      }),
    );

    await queryRunner.createIndex(
      'effective_orders',
      new TableIndex({
        name: 'idx_effective_orders_number',
        columnNames: ['order_number'],
      }),
    );

    await queryRunner.createIndex(
      'effective_orders',
      new TableIndex({
        name: 'idx_effective_orders_type',
        columnNames: ['order_type'],
      }),
    );

    await queryRunner.createIndex(
      'effective_orders',
      new TableIndex({
        name: 'idx_effective_orders_datetime',
        columnNames: ['order_datetime'],
      }),
    );

    await queryRunner.createIndex(
      'effective_orders',
      new TableIndex({
        name: 'idx_effective_orders_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createForeignKey(
      'effective_orders',
      new TableForeignKey({
        name: 'fk_effective_orders_header',
        columnNames: ['report_header_id'],
        referencedTableName: 'report_headers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('✅ Tabla effective_orders creada exitosamente');

    // ============================================
    // RESUMEN
    // ============================================
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║        MIGRACIÓN DE REPORTES COMPLETADA                    ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  ✅ Enum: report_type_enum                                 ║');
    console.log('║  ✅ Tabla: report_headers (12 columnas, 5 índices)         ║');
    console.log('║  ✅ Tabla: sales_by_order_type (7 columnas, 2 índices)     ║');
    console.log('║  ✅ Tabla: payment_methods (7 columnas, 2 índices)         ║');
    console.log('║  ✅ Tabla: dynamic_discounts (8 columnas, 2 índices)       ║');
    console.log('║  ✅ Tabla: adjustments (8 columnas, 2 índices)             ║');
    console.log('║  ✅ Tabla: effective_orders (13 columnas, 5 índices)       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar en orden inverso (por dependencias FK)

    // 7. effective_orders
    await queryRunner.dropForeignKey('effective_orders', 'fk_effective_orders_header');
    await queryRunner.dropIndex('effective_orders', 'idx_effective_orders_status');
    await queryRunner.dropIndex('effective_orders', 'idx_effective_orders_datetime');
    await queryRunner.dropIndex('effective_orders', 'idx_effective_orders_type');
    await queryRunner.dropIndex('effective_orders', 'idx_effective_orders_number');
    await queryRunner.dropIndex('effective_orders', 'idx_effective_orders_header');
    await queryRunner.dropTable('effective_orders', true);
    console.log('✅ Tabla effective_orders eliminada');

    // 6. adjustments
    await queryRunner.dropForeignKey('adjustments', 'fk_adjustments_header');
    await queryRunner.dropIndex('adjustments', 'idx_adjustments_type');
    await queryRunner.dropIndex('adjustments', 'idx_adjustments_header');
    await queryRunner.dropTable('adjustments', true);
    console.log('✅ Tabla adjustments eliminada');

    // 5. dynamic_discounts
    await queryRunner.dropForeignKey('dynamic_discounts', 'fk_dynamic_discounts_header');
    await queryRunner.dropIndex('dynamic_discounts', 'idx_dynamic_discounts_type');
    await queryRunner.dropIndex('dynamic_discounts', 'idx_dynamic_discounts_header');
    await queryRunner.dropTable('dynamic_discounts', true);
    console.log('✅ Tabla dynamic_discounts eliminada');

    // 4. payment_methods
    await queryRunner.dropForeignKey('payment_methods', 'fk_payment_methods_header');
    await queryRunner.dropIndex('payment_methods', 'idx_payment_methods_method');
    await queryRunner.dropIndex('payment_methods', 'idx_payment_methods_header');
    await queryRunner.dropTable('payment_methods', true);
    console.log('✅ Tabla payment_methods eliminada');

    // 3. sales_by_order_type
    await queryRunner.dropForeignKey('sales_by_order_type', 'fk_sales_by_order_type_header');
    await queryRunner.dropIndex('sales_by_order_type', 'idx_sales_by_order_type_type');
    await queryRunner.dropIndex('sales_by_order_type', 'idx_sales_by_order_type_header');
    await queryRunner.dropTable('sales_by_order_type', true);
    console.log('✅ Tabla sales_by_order_type eliminada');

    // 2. report_headers
    await queryRunner.dropForeignKey('report_headers', 'fk_report_headers_store');
    await queryRunner.dropIndex('report_headers', 'idx_report_headers_status');
    await queryRunner.dropIndex('report_headers', 'idx_report_headers_store_type');
    await queryRunner.dropIndex('report_headers', 'idx_report_headers_report_type');
    await queryRunner.dropIndex('report_headers', 'idx_report_headers_report_date');
    await queryRunner.dropIndex('report_headers', 'idx_report_headers_store_date');
    await queryRunner.dropTable('report_headers', true);
    console.log('✅ Tabla report_headers eliminada');

    // 1. Enum
    await queryRunner.query('DROP TYPE IF EXISTS report_type_enum;');
    console.log('✅ Enum report_type_enum eliminado');

    console.log('');
    console.log('✅ Todas las tablas de reportes eliminadas correctamente');
  }
}
