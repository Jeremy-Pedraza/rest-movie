// src/database/migrations/1738500000000-AddPercentageFieldsToSalesByOrderType.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddPercentageFieldsToSalesByOrderType
 *
 * @description
 * Agrega columnas net_percentage y quantity_percentage a la tabla sales_by_order_type.
 * Estos campos almacenan el porcentaje de ventas y cantidad respecto al total del reporte.
 *
 * Se aplica a:
 * - Schema template_tenant (para nuevos tenants)
 * - Todos los schemas de tenants existentes
 *
 * @version 1.0.0
 * @date 2026-02-02
 */
export class AddPercentageFieldsToSalesByOrderType1738500000000 implements MigrationInterface {
  name = 'AddPercentageFieldsToSalesByOrderType1738500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. ACTUALIZAR SCHEMA TEMPLATE
    // ============================================
    await this.addColumnsToSchema(queryRunner, 'template_tenant');

    // ============================================
    // 2. ACTUALIZAR TODOS LOS SCHEMAS DE TENANTS
    // ============================================
    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.addColumnsToSchema(queryRunner, schema_name);
    }

    console.log(
      '✅ Migration AddPercentageFieldsToSalesByOrderType: Columnas agregadas exitosamente',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir en template
    await this.removeColumnsFromSchema(queryRunner, 'template_tenant');

    // Revertir en todos los tenants
    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.removeColumnsFromSchema(queryRunner, schema_name);
    }

    console.log('✅ Migration AddPercentageFieldsToSalesByOrderType: Rollback completado');
  }

  private async addColumnsToSchema(queryRunner: QueryRunner, schemaName: string): Promise<void> {
    // Verificar si la columna net_percentage ya existe
    const netExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${schemaName}'
        AND table_name = 'sales_by_order_type'
        AND column_name = 'net_percentage'
    `);

    if (netExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "${schemaName}"."sales_by_order_type"
        ADD COLUMN "net_percentage" decimal(5,2) NOT NULL DEFAULT 0
      `);
    }

    // Verificar si la columna quantity_percentage ya existe
    const qtyExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${schemaName}'
        AND table_name = 'sales_by_order_type'
        AND column_name = 'quantity_percentage'
    `);

    if (qtyExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "${schemaName}"."sales_by_order_type"
        ADD COLUMN "quantity_percentage" decimal(5,2) NOT NULL DEFAULT 0
      `);
    }

    console.log(
      `  ✓ Schema ${schemaName}: columnas net_percentage y quantity_percentage agregadas`,
    );
  }

  private async removeColumnsFromSchema(
    queryRunner: QueryRunner,
    schemaName: string,
  ): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "${schemaName}"."sales_by_order_type"
      DROP COLUMN IF EXISTS "net_percentage"
    `);

    await queryRunner.query(`
      ALTER TABLE "${schemaName}"."sales_by_order_type"
      DROP COLUMN IF EXISTS "quantity_percentage"
    `);
  }
}
