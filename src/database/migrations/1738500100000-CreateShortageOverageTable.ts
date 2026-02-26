// src/database/migrations/1738500100000-CreateShortageOverageTable.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CreateShortageOverageTable
 *
 * @description
 * Crea la tabla shortage_overage para registrar faltantes y sobrantes de caja.
 * Esta tabla almacena las varianzas detectadas en los conteos de Cash Management.
 *
 * Se aplica a:
 * - Schema template_tenant (para nuevos tenants)
 * - Todos los schemas de tenants existentes
 *
 * @version 1.0.0
 * @date 2026-02-02
 */
export class CreateShortageOverageTable1738500100000 implements MigrationInterface {
  name = 'CreateShortageOverageTable1738500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. CREAR TABLA EN SCHEMA TEMPLATE
    // ============================================
    await this.createTableInSchema(queryRunner, 'template_tenant');

    // ============================================
    // 2. CREAR TABLA EN TODOS LOS SCHEMAS DE TENANTS
    // ============================================
    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.createTableInSchema(queryRunner, schema_name);
    }

    console.log('✅ Migration CreateShortageOverageTable: Tabla creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar en template
    await this.dropTableFromSchema(queryRunner, 'template_tenant');

    // Eliminar en todos los tenants
    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.dropTableFromSchema(queryRunner, schema_name);
    }

    console.log('✅ Migration CreateShortageOverageTable: Rollback completado');
  }

  private async createTableInSchema(queryRunner: QueryRunner, schemaName: string): Promise<void> {
    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = '${schemaName}'
        AND table_name = 'shortage_overage'
    `);

    if (tableExists.length > 0) {
      console.log(`  ⏭ Schema ${schemaName}: tabla shortage_overage ya existe`);
      return;
    }

    // Crear tabla
    await queryRunner.query(`
      CREATE TABLE "${schemaName}"."shortage_overage" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "report_header_id" uuid NOT NULL,
        "receptacle_type" varchar(50) NOT NULL,
        "receptacle_name" varchar(100) NOT NULL,
        "employee_id" integer NOT NULL,
        "employee_name" varchar(200) NOT NULL,
        "counted_at" timestamptz NOT NULL,
        "expected_amount" decimal(12,2) NOT NULL DEFAULT 0,
        "counted_amount" decimal(12,2) NOT NULL DEFAULT 0,
        "variance_amount" decimal(12,2) NOT NULL DEFAULT 0,
        "variance_type" varchar(20) NOT NULL,
        "reason" varchar(500),
        "class_name" varchar(100) NOT NULL,
        "currency" varchar(50) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_${schemaName}_shortage_overage" PRIMARY KEY ("id")
      )
    `);

    // Crear índices
    await queryRunner.query(`
      CREATE INDEX "idx_${schemaName}_shortage_overage_report"
      ON "${schemaName}"."shortage_overage" ("report_header_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${schemaName}_shortage_overage_employee"
      ON "${schemaName}"."shortage_overage" ("employee_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${schemaName}_shortage_overage_type"
      ON "${schemaName}"."shortage_overage" ("variance_type")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_${schemaName}_shortage_overage_counted"
      ON "${schemaName}"."shortage_overage" ("counted_at")
    `);

    // Crear FK
    await queryRunner.query(`
      ALTER TABLE "${schemaName}"."shortage_overage"
      ADD CONSTRAINT "fk_${schemaName}_shortage_overage_report"
      FOREIGN KEY ("report_header_id")
      REFERENCES "${schemaName}"."report_headers"("id")
      ON DELETE CASCADE
    `);

    console.log(`  ✓ Schema ${schemaName}: tabla shortage_overage creada`);
  }

  private async dropTableFromSchema(queryRunner: QueryRunner, schemaName: string): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "${schemaName}"."shortage_overage" CASCADE
    `);
  }
}
