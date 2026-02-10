/**
 * @fileoverview Script para crear schemas de tenants existentes
 * @module database/scripts
 *
 * Ejecuta SOLO el seed de tenant schemas sin tocar otros datos.
 * Útil cuando ya tienes companies en la BD y solo quieres crear sus schemas.
 *
 * @example
 * # Ejecutar
 * npx ts-node -r tsconfig-paths/register src/database/scripts/create-tenant-schemas.ts
 *
 * # O agregar al package.json:
 * # "seed:tenants": "ts-node -r tsconfig-paths/register src/database/scripts/create-tenant-schemas.ts"
 */

import { DataSource } from 'typeorm';
import { dataSourceOptions } from '@config/database/data-source';
import { seedTenantSchemas } from '../seeds/tenant-schema.seed';

async function main() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       🏢 CREATE TENANT SCHEMAS                       ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n📅 ${new Date().toISOString()}`);

  const dataSource = new DataSource(dataSourceOptions);

  try {
    // Conectar a la BD
    console.log('\n🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // Ejecutar solo el seed de tenant schemas
    await seedTenantSchemas(dataSource);

    // Resumen
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱  Duration: ${duration}s`);
    console.log('✅ Tenant schemas created successfully');
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
