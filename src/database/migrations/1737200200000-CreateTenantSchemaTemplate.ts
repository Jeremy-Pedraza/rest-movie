// src/database/migrations/1737200200000-CreateTenantSchemaTemplate.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CreateTenantSchemaTemplate
 *
 * @description
 * Crea el schema template_tenant con la estructura base para tenants.
 * Este template se clona cuando se crea una nueva compañía.
 *
 * Tablas incluidas:
 * - report_headers: Cabecera de reportes de ventas
 * - sales_by_order_type: Ventas por tipo de orden
 * - payment_methods: Métodos de pago utilizados
 * - dynamic_discounts: Descuentos aplicados
 * - adjustments: Ajustes y devoluciones
 * - effective_orders: Órdenes individuales
 *
 * Arquitectura Multi-Tenant:
 * - Schema PUBLIC: users, companies, stores, sessions (compartido)
 * - Schema TEMPLATE_TENANT: estructura base (solo template)
 * - Schema {COMPANY}: datos específicos del tenant
 *
 * @version FASE 4 - Sistema Multi-Tenant
 */
export class CreateTenantSchemaTemplate1737200200000 implements MigrationInterface {
  name = 'CreateTenantSchemaTemplate1737200200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 0. VERIFICAR EXTENSIÓN UUID
    // ============================================
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ============================================
    // 1. CREAR SCHEMA TEMPLATE
    // ============================================
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "template_tenant"`);

    // ============================================
    // 2. CREAR TIPO ENUM PARA REPORT_TYPE
    // ============================================
    const enumExists = await queryRunner.query(`
      SELECT 1 FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE t.typname = 'report_type_enum' AND n.nspname = 'template_tenant'
    `);

    if (enumExists.length === 0) {
      await queryRunner.query(`
        CREATE TYPE "template_tenant"."report_type_enum" AS ENUM ('daily', 'weekly', 'monthly')
      `);
    }

    // ============================================
    // 3. CREAR TABLA: report_headers
    // ============================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "template_tenant"."report_headers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "report_date" date NOT NULL,
        "report_type" "template_tenant"."report_type_enum" NOT NULL DEFAULT 'daily',
        "total_sales" decimal(12,2) NOT NULL DEFAULT 0,
        "total_revenue" decimal(12,2) NOT NULL DEFAULT 0,
        "total_quantity" integer NOT NULL DEFAULT 0,
        "orders_count" integer NOT NULL DEFAULT 0,
        "average_ticket" decimal(10,2) NOT NULL DEFAULT 0,
        "total_discounts" decimal(12,2) NOT NULL DEFAULT 0,
        "total_adjustments" decimal(12,2) NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "status" varchar(20) NOT NULL DEFAULT 'published',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz DEFAULT now(),
        CONSTRAINT "pk_template_report_headers" PRIMARY KEY ("id"),
        CONSTRAINT "uq_template_report_headers_store_date" UNIQUE ("store_id", "report_date")
      )
    `);

    // Índices para report_headers
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_report_headers_date" 
      ON "template_tenant"."report_headers" ("report_date")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_report_headers_type" 
      ON "template_tenant"."report_headers" ("report_type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_report_headers_store_type" 
      ON "template_tenant"."report_headers" ("store_id", "report_type")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_report_headers_status" 
      ON "template_tenant"."report_headers" ("status")
    `);

    // ============================================
    // 4. CREAR TABLA: sales_by_order_type
    // ============================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "template_tenant"."sales_by_order_type" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_header_id" uuid NOT NULL,
        "order_type" varchar(50) NOT NULL,
        "total_sales" decimal(12,2) NOT NULL DEFAULT 0,
        "orders_count" integer NOT NULL DEFAULT 0,
        "quantity" integer NOT NULL DEFAULT 0,
        "average_ticket" decimal(10,2) NOT NULL DEFAULT 0,
        "percentage" decimal(5,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_template_sales_by_order_type" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_sales_order_type_report" 
      ON "template_tenant"."sales_by_order_type" ("report_header_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_sales_order_type_type" 
      ON "template_tenant"."sales_by_order_type" ("order_type")
    `);

    // ============================================
    // 5. CREAR TABLA: payment_methods
    // ============================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "template_tenant"."payment_methods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_header_id" uuid NOT NULL,
        "payment_method" varchar(50) NOT NULL,
        "total_amount" decimal(12,2) NOT NULL DEFAULT 0,
        "transactions_count" integer NOT NULL DEFAULT 0,
        "percentage" decimal(5,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_template_payment_methods" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_payment_methods_report" 
      ON "template_tenant"."payment_methods" ("report_header_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_payment_methods_method" 
      ON "template_tenant"."payment_methods" ("payment_method")
    `);

    // ============================================
    // 6. CREAR TABLA: dynamic_discounts
    // ============================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "template_tenant"."dynamic_discounts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_header_id" uuid NOT NULL,
        "discount_name" varchar(100) NOT NULL,
        "discount_type" varchar(50) NOT NULL DEFAULT 'percentage',
        "total_discount" decimal(12,2) NOT NULL DEFAULT 0,
        "times_applied" integer NOT NULL DEFAULT 0,
        "average_discount" decimal(10,2) NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_template_dynamic_discounts" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_dynamic_discounts_report" 
      ON "template_tenant"."dynamic_discounts" ("report_header_id")
    `);

    // ============================================
    // 7. CREAR TABLA: adjustments
    // ============================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "template_tenant"."adjustments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_header_id" uuid NOT NULL,
        "adjustment_type" varchar(50) NOT NULL,
        "reason" varchar(255),
        "total_amount" decimal(12,2) NOT NULL DEFAULT 0,
        "items_count" integer NOT NULL DEFAULT 0,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_template_adjustments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_adjustments_report" 
      ON "template_tenant"."adjustments" ("report_header_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_adjustments_type" 
      ON "template_tenant"."adjustments" ("adjustment_type")
    `);

    // ============================================
    // 8. CREAR TABLA: effective_orders
    // ============================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "template_tenant"."effective_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "report_header_id" uuid NOT NULL,
        "order_number" varchar(50) NOT NULL,
        "order_datetime" timestamptz NOT NULL,
        "order_type" varchar(50) NOT NULL,
        "subtotal" decimal(12,2) NOT NULL DEFAULT 0,
        "discount" decimal(12,2) NOT NULL DEFAULT 0,
        "tax" decimal(12,2) NOT NULL DEFAULT 0,
        "total" decimal(12,2) NOT NULL DEFAULT 0,
        "items_count" integer NOT NULL DEFAULT 0,
        "payment_method" varchar(50),
        "customer_id" varchar(100),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_template_effective_orders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_effective_orders_report" 
      ON "template_tenant"."effective_orders" ("report_header_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_effective_orders_datetime" 
      ON "template_tenant"."effective_orders" ("order_datetime")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_effective_orders_number" 
      ON "template_tenant"."effective_orders" ("order_number")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_template_effective_orders_type" 
      ON "template_tenant"."effective_orders" ("order_type")
    `);

    // ============================================
    // 9. CREAR FOREIGN KEYS (dentro del template)
    // ============================================
    await queryRunner.query(`
      ALTER TABLE "template_tenant"."sales_by_order_type"
      ADD CONSTRAINT "fk_template_sales_order_type_report"
      FOREIGN KEY ("report_header_id") 
      REFERENCES "template_tenant"."report_headers"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "template_tenant"."payment_methods"
      ADD CONSTRAINT "fk_template_payment_methods_report"
      FOREIGN KEY ("report_header_id") 
      REFERENCES "template_tenant"."report_headers"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "template_tenant"."dynamic_discounts"
      ADD CONSTRAINT "fk_template_dynamic_discounts_report"
      FOREIGN KEY ("report_header_id") 
      REFERENCES "template_tenant"."report_headers"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "template_tenant"."adjustments"
      ADD CONSTRAINT "fk_template_adjustments_report"
      FOREIGN KEY ("report_header_id") 
      REFERENCES "template_tenant"."report_headers"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "template_tenant"."effective_orders"
      ADD CONSTRAINT "fk_template_effective_orders_report"
      FOREIGN KEY ("report_header_id") 
      REFERENCES "template_tenant"."report_headers"("id") 
      ON DELETE CASCADE
    `);

    // ============================================
    // 10. CREAR TABLA DE CONTROL DE SCHEMAS
    // ============================================
    // Verificar si existe primero
    const tableExists = await queryRunner.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'tenant_schemas'
    `);

    if (tableExists.length === 0) {
      await queryRunner.query(`
        CREATE TABLE "public"."tenant_schemas" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "company_id" uuid NOT NULL,
          "schema_name" varchar(100) NOT NULL,
          "status" varchar(20) NOT NULL DEFAULT 'active',
          "tables_count" integer NOT NULL DEFAULT 0,
          "size_bytes" bigint DEFAULT 0,
          "last_synced_at" timestamptz,
          "error_message" text,
          "metadata" jsonb,
          "created_at" timestamptz NOT NULL DEFAULT now(),
          "updated_at" timestamptz DEFAULT now(),
          CONSTRAINT "pk_tenant_schemas" PRIMARY KEY ("id"),
          CONSTRAINT "uq_tenant_schemas_company" UNIQUE ("company_id"),
          CONSTRAINT "uq_tenant_schemas_name" UNIQUE ("schema_name"),
          CONSTRAINT "fk_tenant_schemas_company" FOREIGN KEY ("company_id") 
            REFERENCES "public"."companies"("id") ON DELETE CASCADE
        )
      `);

      await queryRunner.query(`
        CREATE INDEX "idx_tenant_schemas_status" ON "public"."tenant_schemas" ("status")
      `);
      await queryRunner.query(`
        CREATE INDEX "idx_tenant_schemas_company" ON "public"."tenant_schemas" ("company_id")
      `);
      await queryRunner.query(`
        CREATE INDEX "idx_tenant_schemas_name" ON "public"."tenant_schemas" ("schema_name")
      `);
    }

    console.log(
      '✅ Migration CreateTenantSchemaTemplate1737200200000: Schema template_tenant creado exitosamente',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla de control
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."tenant_schemas" CASCADE`);

    // Eliminar schema template completo
    await queryRunner.query(`DROP SCHEMA IF EXISTS "template_tenant" CASCADE`);

    console.log('✅ Migration CreateTenantSchemaTemplate1737200200000: Rollback completado');
  }
}
