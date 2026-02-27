// src/database/migrations/1738800000000-AddReportV110Tables.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddReportV110Tables
 *
 * @description
 * Migración v1.1.0 del módulo de reportes:
 * - Agrega columnas total_service_charge y total_payment a report_headers
 * - Crea 7 tablas nuevas: report_cash_summary, report_employee_sales,
 *   report_category_sales, report_revenue_center_sales, report_service_charges,
 *   report_income_by_class, report_income_by_tender_type
 *
 * Se aplica a:
 * - Schema template_tenant (para nuevos tenants)
 * - Todos los schemas de tenants existentes
 *
 * @version 1.1.0
 */
export class AddReportV110Tables1738800000000 implements MigrationInterface {
  name = 'AddReportV110Tables1738800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Aplicar a template_tenant
    await this.applyToSchema(queryRunner, 'template_tenant');

    // 2. Aplicar a todos los tenants activos
    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.applyToSchema(queryRunner, schema_name);
    }

    console.log('✅ Migration AddReportV110Tables: Completada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.rollbackFromSchema(queryRunner, 'template_tenant');

    const tenantSchemas = await queryRunner.query(`
      SELECT schema_name FROM public.tenant_schemas WHERE status = 'active'
    `);

    for (const { schema_name } of tenantSchemas) {
      await this.rollbackFromSchema(queryRunner, schema_name);
    }

    console.log('✅ Migration AddReportV110Tables: Rollback completado');
  }

  private async applyToSchema(queryRunner: QueryRunner, schema: string): Promise<void> {
    // ============================================
    // COLUMNAS NUEVAS EN report_headers
    // ============================================
    await this.addColumnIfNotExists(
      queryRunner,
      schema,
      'report_headers',
      'total_service_charge',
      'decimal(12,2) NOT NULL DEFAULT 0',
    );
    await this.addColumnIfNotExists(
      queryRunner,
      schema,
      'report_headers',
      'total_payment',
      'decimal(12,2) NOT NULL DEFAULT 0',
    );

    // ============================================
    // TABLA: report_cash_summary
    // ============================================
    await this.createTableIfNotExists(
      queryRunner,
      schema,
      'report_cash_summary',
      `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "report_header_id" uuid NOT NULL,
      "tender_name" varchar(100) NOT NULL,
      "quantity" integer NOT NULL DEFAULT 0,
      "total_amount" decimal(12,2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_${schema}_report_cash_summary" PRIMARY KEY ("id")
    `,
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_cash_summary',
      'report_header_id',
    );
    await this.createFkIfNotExists(queryRunner, schema, 'report_cash_summary');

    // ============================================
    // TABLA: report_employee_sales
    // ============================================
    await this.createTableIfNotExists(
      queryRunner,
      schema,
      'report_employee_sales',
      `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "report_header_id" uuid NOT NULL,
      "employee_id" integer NOT NULL,
      "employee_name" varchar(200) NOT NULL,
      "total_checks" integer NOT NULL DEFAULT 0,
      "gross_sales" decimal(12,2) NOT NULL DEFAULT 0,
      "total_tax" decimal(12,2) NOT NULL DEFAULT 0,
      "net_sales" decimal(12,2) NOT NULL DEFAULT 0,
      "average_ticket" decimal(12,2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_${schema}_report_employee_sales" PRIMARY KEY ("id")
    `,
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_employee_sales',
      'report_header_id',
    );
    await this.createIndexIfNotExists(queryRunner, schema, 'report_employee_sales', 'employee_id');
    await this.createFkIfNotExists(queryRunner, schema, 'report_employee_sales');

    // ============================================
    // TABLA: report_category_sales
    // ============================================
    await this.createTableIfNotExists(
      queryRunner,
      schema,
      'report_category_sales',
      `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "report_header_id" uuid NOT NULL,
      "category_id" integer NOT NULL,
      "category_name" varchar(200) NOT NULL,
      "items_sold" integer NOT NULL DEFAULT 0,
      "total_sales" decimal(12,2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_${schema}_report_category_sales" PRIMARY KEY ("id")
    `,
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_category_sales',
      'report_header_id',
    );
    await this.createIndexIfNotExists(queryRunner, schema, 'report_category_sales', 'category_id');
    await this.createFkIfNotExists(queryRunner, schema, 'report_category_sales');

    // ============================================
    // TABLA: report_revenue_center_sales
    // ============================================
    await this.createTableIfNotExists(
      queryRunner,
      schema,
      'report_revenue_center_sales',
      `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "report_header_id" uuid NOT NULL,
      "revenue_center_id" integer NOT NULL,
      "revenue_center_name" varchar(200) NOT NULL,
      "total_checks" integer NOT NULL DEFAULT 0,
      "total_sales" decimal(12,2) NOT NULL DEFAULT 0,
      "average_ticket" decimal(12,2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_${schema}_report_revenue_center_sales" PRIMARY KEY ("id")
    `,
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_revenue_center_sales',
      'report_header_id',
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_revenue_center_sales',
      'revenue_center_id',
    );
    await this.createFkIfNotExists(queryRunner, schema, 'report_revenue_center_sales');

    // ============================================
    // TABLA: report_service_charges
    // ============================================
    await this.createTableIfNotExists(
      queryRunner,
      schema,
      'report_service_charges',
      `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "report_header_id" uuid NOT NULL,
      "service_charge_name" varchar(200) NOT NULL,
      "quantity" integer NOT NULL DEFAULT 0,
      "total_amount" decimal(12,2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_${schema}_report_service_charges" PRIMARY KEY ("id")
    `,
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_service_charges',
      'report_header_id',
    );
    await this.createFkIfNotExists(queryRunner, schema, 'report_service_charges');

    // ============================================
    // TABLA: report_income_by_class
    // ============================================
    await this.createTableIfNotExists(
      queryRunner,
      schema,
      'report_income_by_class',
      `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "report_header_id" uuid NOT NULL,
      "class_name" varchar(100) NOT NULL,
      "currency_name" varchar(100) NOT NULL,
      "currency_symbol" varchar(10) NOT NULL,
      "transaction_count" integer NOT NULL DEFAULT 0,
      "total_amount" decimal(12,2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_${schema}_report_income_by_class" PRIMARY KEY ("id")
    `,
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_income_by_class',
      'report_header_id',
    );
    await this.createFkIfNotExists(queryRunner, schema, 'report_income_by_class');

    // ============================================
    // TABLA: report_income_by_tender_type
    // ============================================
    await this.createTableIfNotExists(
      queryRunner,
      schema,
      'report_income_by_tender_type',
      `
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "report_header_id" uuid NOT NULL,
      "tender_type" varchar(100) NOT NULL,
      "tender_name" varchar(200) NOT NULL,
      "transaction_count" integer NOT NULL DEFAULT 0,
      "total_amount" decimal(12,2) NOT NULL DEFAULT 0,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "pk_${schema}_report_income_by_tender_type" PRIMARY KEY ("id")
    `,
    );
    await this.createIndexIfNotExists(
      queryRunner,
      schema,
      'report_income_by_tender_type',
      'report_header_id',
    );
    await this.createFkIfNotExists(queryRunner, schema, 'report_income_by_tender_type');

    console.log(`  ✓ Schema ${schema}: v1.1.0 aplicada`);
  }

  private async rollbackFromSchema(queryRunner: QueryRunner, schema: string): Promise<void> {
    const tables = [
      'report_income_by_tender_type',
      'report_income_by_class',
      'report_service_charges',
      'report_revenue_center_sales',
      'report_category_sales',
      'report_employee_sales',
      'report_cash_summary',
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${schema}"."${table}" CASCADE`);
    }

    await this.dropColumnIfExists(queryRunner, schema, 'report_headers', 'total_payment');
    await this.dropColumnIfExists(queryRunner, schema, 'report_headers', 'total_service_charge');
  }

  // ============================================
  // HELPERS
  // ============================================

  private async addColumnIfNotExists(
    qr: QueryRunner,
    schema: string,
    table: string,
    column: string,
    definition: string,
  ): Promise<void> {
    const exists = await qr.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${schema}' AND table_name = '${table}' AND column_name = '${column}'
    `);
    if (exists.length === 0) {
      await qr.query(`ALTER TABLE "${schema}"."${table}" ADD COLUMN "${column}" ${definition}`);
    }
  }

  private async dropColumnIfExists(
    qr: QueryRunner,
    schema: string,
    table: string,
    column: string,
  ): Promise<void> {
    const exists = await qr.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = '${schema}' AND table_name = '${table}' AND column_name = '${column}'
    `);
    if (exists.length > 0) {
      await qr.query(`ALTER TABLE "${schema}"."${table}" DROP COLUMN "${column}"`);
    }
  }

  private async createTableIfNotExists(
    qr: QueryRunner,
    schema: string,
    table: string,
    columns: string,
  ): Promise<void> {
    const exists = await qr.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = '${schema}' AND table_name = '${table}'
    `);
    if (exists.length === 0) {
      await qr.query(`CREATE TABLE "${schema}"."${table}" (${columns})`);
    }
  }

  private async createIndexIfNotExists(
    qr: QueryRunner,
    schema: string,
    table: string,
    column: string,
  ): Promise<void> {
    const indexName = `idx_${schema}_${table}_${column}`;
    await qr.query(`
      CREATE INDEX IF NOT EXISTS "${indexName}"
      ON "${schema}"."${table}" ("${column}")
    `);
  }

  private async createFkIfNotExists(qr: QueryRunner, schema: string, table: string): Promise<void> {
    const fkName = `fk_${schema}_${table}_report`;
    const exists = await qr.query(`
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_schema = '${schema}' AND constraint_name = '${fkName}'
    `);
    if (exists.length === 0) {
      await qr.query(`
        ALTER TABLE "${schema}"."${table}"
        ADD CONSTRAINT "${fkName}"
        FOREIGN KEY ("report_header_id")
        REFERENCES "${schema}"."report_headers"("id")
        ON DELETE CASCADE
      `);
    }
  }
}
