/**
 * @fileoverview Runner principal de seeds
 * @module database/seeds
 *
 * Ejecuta todos los seeds en orden:
 * 1. Permissions (primero, son independientes)
 * 2. Roles (dependen de permissions)
 * 3. Companies (independientes)
 * 4. Tenant Schemas (dependen de companies) ← NUEVO
 * 5. Users (dependen de roles y companies)
 *
 * @example
 * # Ejecutar seeds
 * yarn seed
 *
 * # O con npm
 * npm run seed
 */

import { DataSource } from 'typeorm';
import { dataSourceOptions } from '@config/database/data-source';

// Seeds
import { seedPermissions } from './permission.seed';
import { seedRoles } from './role.seed';
import { seedCompanies } from './company.seed';
import { seedTenantSchemas } from './tenant-schema.seed';
import { seedUsers } from './user.seed';
import { seedGeography } from './latam-geography.seed';

async function seed() {
  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║           🌱 Rest BACKEND - DATABASE SEED           ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n📅 ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  const dataSource = new DataSource(dataSourceOptions);

  try {
    // Conectar a la BD
    console.log('\n🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // Ejecutar seeds en orden
    // 1. Permissions (independientes)
    await seedPermissions(dataSource);

    // 2. Roles (dependen de permissions)
    await seedRoles(dataSource);

    // 3. Companies (independientes)
    await seedCompanies(dataSource);

    // 4. Tenant Schemas (dependen de companies) ← NUEVO
    await seedTenantSchemas(dataSource);

    // 5. Users (dependen de roles y companies)
    await seedUsers(dataSource);

    await seedGeography(dataSource);

    // Resumen
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║              ✅ SEEDING COMPLETED                    ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log(`⏱  Duration: ${duration}s`);
  } catch (error) {
    console.error('\n❌ Error during seeding:');
    console.error(error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Ejecutar si se llama directamente
seed().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
