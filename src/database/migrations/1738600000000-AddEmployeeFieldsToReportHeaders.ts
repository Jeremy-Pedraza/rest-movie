// src/database/migrations/1738600000000-AddEmployeeFieldsToReportHeaders.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddEmployeeFieldsToReportHeaders
 *
 * @description
 * Agrega campos de empleado a report_headers para soportar reportes individuales por empleado.
 * - employee_id: ID del empleado en Simphony (NULL = reporte consolidado)
 * - employee_name: Nombre del empleado
 *
 * Modifica índice único de idempotencia:
 * - ANTES: (store_id, report_date)
 * - DESPUÉS: (store_id, report_date, COALESCE(employee_id, -1))
 *
 * Se aplica a:
 * - Schema template_tenant (para nuevos tenants)
 * - Todos los schemas de tenants existentes
 *
 * @version 1.0.0
 * @date 2026-02-03
 */
export class AddEmployeeFieldsToReportHeaders1738600000000 implements MigrationInterface {
  name = 'AddEmployeeFieldsToReportHeaders1738600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. APLICAR EN SCHEMA TEMPLATE
    // ============================================
    await this.applyMigrationToSchema(queryRunner, 'template_tenant');

    // ============================================
    // 2. APLICAR EN TODOS LOS SCHEMAS DE TENANTS
    // ============================================
    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.applyMigrationToSchema(queryRunner, schema_name);
    }

    console.log('✅ Migration AddEmployeeFieldsToReportHeaders: Completada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback en template
    await this.rollbackMigrationFromSchema(queryRunner, 'template_tenant');

    // Rollback en todos los tenants
    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.rollbackMigrationFromSchema(queryRunner, schema_name);
    }

    console.log('✅ Migration AddEmployeeFieldsToReportHeaders: Rollback completado');
  }

  private async applyMigrationToSchema(
    queryRunner: QueryRunner,
    schemaName: string,
  ): Promise<void> {
    // Verificar si las columnas ya existen
    const columnExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${schemaName}'
        AND table_name = 'report_headers'
        AND column_name = 'employee_id'
    `);

    if (columnExists.length > 0) {
      console.log(`  ⏭ Schema ${schemaName}: columnas employee ya existen`);
      return;
    }

    // ============================================
    // PASO 1: Agregar columnas de empleado
    // ============================================
    await queryRunner.query(`
      ALTER TABLE "${schemaName}"."report_headers"
      ADD COLUMN "employee_id" integer NULL,
      ADD COLUMN "employee_name" varchar(200) NULL
    `);

    // ============================================
    // PASO 2: Eliminar índice único anterior
    // ============================================
    // Buscar el nombre del índice único existente
    const existingIndex = await queryRunner.query(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = '${schemaName}'
        AND tablename = 'report_headers'
        AND indexdef LIKE '%UNIQUE%'
        AND indexdef LIKE '%store_id%'
        AND indexdef LIKE '%report_date%'
        AND indexdef NOT LIKE '%employee_id%'
    `);

    if (existingIndex.length > 0) {
      for (const idx of existingIndex) {
        // Verificar si es un constraint (no se puede eliminar con DROP INDEX)
        const isConstraint = await queryRunner.query(`
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_schema = '${schemaName}'
            AND table_name = 'report_headers'
            AND constraint_name = '${idx.indexname}'
            AND constraint_type = 'UNIQUE'
        `);

        if (isConstraint.length > 0) {
          await queryRunner.query(`
            ALTER TABLE "${schemaName}"."report_headers" DROP CONSTRAINT "${idx.indexname}"
          `);
        } else {
          await queryRunner.query(`
            DROP INDEX IF EXISTS "${schemaName}"."${idx.indexname}"
          `);
        }
        console.log(`  ✓ Schema ${schemaName}: índice ${idx.indexname} eliminado`);
      }
    }

    // ============================================
    // PASO 3: Crear nuevo índice único con employee_id
    // ============================================
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_${schemaName}_report_headers_store_date_employee"
      ON "${schemaName}"."report_headers" (store_id, report_date, COALESCE(employee_id, -1))
    `);

    // ============================================
    // PASO 4: Crear índices auxiliares
    // ============================================
    // Índice para búsquedas por empleado
    await queryRunner.query(`
      CREATE INDEX "idx_${schemaName}_report_headers_employee"
      ON "${schemaName}"."report_headers" (employee_id)
      WHERE employee_id IS NOT NULL
    `);

    // Índice para búsquedas de reportes consolidados
    await queryRunner.query(`
      CREATE INDEX "idx_${schemaName}_report_headers_consolidated"
      ON "${schemaName}"."report_headers" (store_id, report_date)
      WHERE employee_id IS NULL
    `);

    console.log(`  ✓ Schema ${schemaName}: campos employee_id/employee_name agregados`);
  }

  private async rollbackMigrationFromSchema(
    queryRunner: QueryRunner,
    schemaName: string,
  ): Promise<void> {
    // Verificar si las columnas existen
    const columnExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${schemaName}'
        AND table_name = 'report_headers'
        AND column_name = 'employee_id'
    `);

    if (columnExists.length === 0) {
      console.log(`  ⏭ Schema ${schemaName}: columnas employee no existen`);
      return;
    }

    // Eliminar índices nuevos
    await queryRunner.query(`
      DROP INDEX IF EXISTS "${schemaName}"."idx_${schemaName}_report_headers_store_date_employee"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "${schemaName}"."idx_${schemaName}_report_headers_employee"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "${schemaName}"."idx_${schemaName}_report_headers_consolidated"
    `);

    // Recrear índice único original
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_${schemaName}_report_headers_store_date"
      ON "${schemaName}"."report_headers" (store_id, report_date)
    `);

    // Eliminar columnas
    await queryRunner.query(`
      ALTER TABLE "${schemaName}"."report_headers"
      DROP COLUMN "employee_id",
      DROP COLUMN "employee_name"
    `);

    console.log(`  ✓ Schema ${schemaName}: rollback completado`);
  }
}
