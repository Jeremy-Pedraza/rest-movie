/**
 * @fileoverview Seed para crear schemas de tenants existentes
 * @module database/seeds
 *
 * Este seed:
 * 1. Lee companies activas con schema definido (diferente de 'public')
 * 2. Verifica si el schema ya existe en PostgreSQL
 * 3. Si no existe, clona la estructura de template_tenant
 * 4. Registra en public.tenant_schemas
 *
 * IMPORTANTE: Ejecutar DESPUÉS de las migraciones
 *
 * @example
 * yarn seed
 */

import { DataSource } from 'typeorm';

/**
 * Tablas que se clonan del template al schema del tenant
 */
const TENANT_TABLES = [
  'report_headers',
  'sales_by_order_type',
  'payment_methods',
  'dynamic_discounts',
  'adjustments',
  'effective_orders',
];

/**
 * Verifica si un schema existe en PostgreSQL
 */
async function schemaExists(dataSource: DataSource, schemaName: string): Promise<boolean> {
  const result = await dataSource.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
    [schemaName],
  );
  return result.length > 0;
}

/**
 * Verifica si una tabla existe en un schema
 */
async function tableExistsInSchema(
  dataSource: DataSource,
  schemaName: string,
  tableName: string,
): Promise<boolean> {
  const result = await dataSource.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
    [schemaName, tableName],
  );
  return result.length > 0;
}

/**
 * Crea el schema y clona las tablas desde template_tenant
 */
async function createTenantSchema(
  dataSource: DataSource,
  schemaName: string,
  companyId: string,
): Promise<{ success: boolean; tablesCreated: number; error?: string }> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Crear schema
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log(`   📁 Schema "${schemaName}" creado`);

    // 2. Crear tipo enum
    const enumExists = await queryRunner.query(
      `SELECT 1 FROM pg_type t
       JOIN pg_namespace n ON t.typnamespace = n.oid
       WHERE t.typname = 'report_type_enum' AND n.nspname = $1`,
      [schemaName],
    );

    if (enumExists.length === 0) {
      await queryRunner.query(
        `CREATE TYPE "${schemaName}"."report_type_enum" AS ENUM ('daily', 'weekly', 'monthly')`,
      );
      console.log(`   📋 Enum report_type_enum creado en ${schemaName}`);
    }

    // 3. Clonar tablas del template
    let tablesCreated = 0;

    for (const tableName of TENANT_TABLES) {
      // Verificar si existe en template
      const existsInTemplate = await tableExistsInSchema(dataSource, 'template_tenant', tableName);
      if (!existsInTemplate) {
        console.log(`   ⚠️  Tabla ${tableName} no existe en template_tenant, omitiendo`);
        continue;
      }

      // Verificar si ya existe en el schema destino
      const existsInTarget = await tableExistsInSchema(dataSource, schemaName, tableName);
      if (existsInTarget) {
        console.log(`   ℹ️  Tabla ${tableName} ya existe en ${schemaName}, omitiendo`);
        continue;
      }

      // Clonar tabla
      if (tableName === 'report_headers') {
        // report_headers necesita el enum del schema correcto
        await queryRunner.query(`
          CREATE TABLE "${schemaName}"."${tableName}" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "store_id" uuid NOT NULL,
            "report_date" date NOT NULL,
            "report_type" "${schemaName}"."report_type_enum" NOT NULL DEFAULT 'daily',
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
            CONSTRAINT "pk_${schemaName}_report_headers" PRIMARY KEY ("id"),
            CONSTRAINT "uq_${schemaName}_report_headers_store_date" UNIQUE ("store_id", "report_date")
          )
        `);

        // Índices
        await queryRunner.query(
          `CREATE INDEX "idx_${schemaName}_report_headers_date" ON "${schemaName}"."${tableName}" ("report_date")`,
        );
        await queryRunner.query(
          `CREATE INDEX "idx_${schemaName}_report_headers_type" ON "${schemaName}"."${tableName}" ("report_type")`,
        );
        await queryRunner.query(
          `CREATE INDEX "idx_${schemaName}_report_headers_store_type" ON "${schemaName}"."${tableName}" ("store_id", "report_type")`,
        );

        // FK a stores (public)
        await queryRunner.query(`
          ALTER TABLE "${schemaName}"."${tableName}"
          ADD CONSTRAINT "fk_${schemaName}_report_headers_store"
          FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
        `);
      } else {
        // Otras tablas: usar LIKE para clonar estructura
        await queryRunner.query(`
          CREATE TABLE "${schemaName}"."${tableName}" 
          (LIKE "template_tenant"."${tableName}" INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES)
        `);

        // FK a report_headers del mismo schema
        await queryRunner.query(`
          ALTER TABLE "${schemaName}"."${tableName}"
          ADD CONSTRAINT "fk_${schemaName}_${tableName}_report"
          FOREIGN KEY (report_header_id) REFERENCES "${schemaName}".report_headers(id) ON DELETE CASCADE
        `);
      }

      tablesCreated++;
      console.log(`   ✅ Tabla ${tableName} clonada a ${schemaName}`);
    }

    // 4. Registrar en tenant_schemas (si no existe)
    const existingRecord = await queryRunner.query(
      `SELECT id FROM public.tenant_schemas WHERE company_id = $1`,
      [companyId],
    );

    if (existingRecord.length === 0) {
      await queryRunner.query(
        `INSERT INTO public.tenant_schemas (company_id, schema_name, status, tables_count, last_synced_at)
         VALUES ($1, $2, 'active', $3, NOW())`,
        [companyId, schemaName, tablesCreated],
      );
      console.log(`   📝 Registrado en tenant_schemas`);
    } else {
      await queryRunner.query(
        `UPDATE public.tenant_schemas 
         SET status = 'active', tables_count = $1, last_synced_at = NOW()
         WHERE company_id = $2`,
        [tablesCreated, companyId],
      );
      console.log(`   📝 Actualizado en tenant_schemas`);
    }

    await queryRunner.commitTransaction();

    return { success: true, tablesCreated };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, tablesCreated: 0, error: errorMessage };
  } finally {
    await queryRunner.release();
  }
}

/**
 * Seed principal para crear schemas de tenants
 */
export async function seedTenantSchemas(dataSource: DataSource): Promise<void> {
  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│  🏢 SEEDING TENANT SCHEMAS                         │');
  console.log('└────────────────────────────────────────────────────┘');

  // 1. Verificar que template_tenant existe
  const templateExists = await schemaExists(dataSource, 'template_tenant');
  if (!templateExists) {
    console.log('❌ Error: Schema template_tenant no existe. Ejecute las migraciones primero.');
    return;
  }
  console.log('✅ template_tenant existe');

  // 2. Obtener companies activas con schema definido (diferente de 'public')
  const companies = await dataSource.query(`
    SELECT id, name, schema, subdomain
    FROM public.companies
    WHERE is_active = true
      AND schema IS NOT NULL
      AND schema != ''
      AND schema != 'public'
    ORDER BY name
  `);

  if (companies.length === 0) {
    console.log('ℹ️  No hay companies activas con schema definido (diferente de public)');
    return;
  }

  console.log(`\n📋 Companies a procesar: ${companies.length}`);
  companies.forEach((c: any) => {
    console.log(`   - ${c.name} → schema: ${c.schema}`);
  });

  // 3. Crear schemas para cada company
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const company of companies) {
    console.log(`\n🔧 Procesando: ${company.name} (${company.schema})`);

    // Verificar si el schema ya existe
    const exists = await schemaExists(dataSource, company.schema);
    if (exists) {
      // Verificar si tiene las tablas
      const hasReportHeaders = await tableExistsInSchema(dataSource, company.schema, 'report_headers');
      if (hasReportHeaders) {
        console.log(`   ⏭️  Schema "${company.schema}" ya existe con tablas, omitiendo`);
        skipped++;
        continue;
      }
      console.log(`   ℹ️  Schema "${company.schema}" existe pero sin tablas, sincronizando...`);
    }

    // Crear schema y clonar tablas
    const result = await createTenantSchema(dataSource, company.schema, company.id);

    if (result.success) {
      console.log(`   ✅ Schema "${company.schema}" creado con ${result.tablesCreated} tablas`);
      created++;
    } else {
      console.log(`   ❌ Error creando schema "${company.schema}": ${result.error}`);
      errors++;
    }
  }

  // 4. Resumen
  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│  📊 RESUMEN TENANT SCHEMAS                         │');
  console.log('├────────────────────────────────────────────────────┤');
  console.log(`│  ✅ Creados:  ${created.toString().padStart(3)}                                │`);
  console.log(`│  ⏭️  Omitidos: ${skipped.toString().padStart(3)}                                │`);
  console.log(`│  ❌ Errores:  ${errors.toString().padStart(3)}                                │`);
  console.log('└────────────────────────────────────────────────────┘');
}
