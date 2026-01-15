// src/database/migrations/verify-multi-tenant.ts

/**
 * @fileoverview Script para verificar la configuración multi-tenant
 * @module database/migrations
 *
 * Este script verifica:
 * 1. Que la tabla companies existe
 * 2. Que la columna companyId en users existe
 * 3. Que los índices están creados
 * 4. Que las companies de demo están creadas
 */

import { DataSource } from 'typeorm';
import { dataSourceOptions } from '@config/database/data-source';

async function verifyMultiTenant() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║      🔍 VERIFICACIÓN MULTI-TENANT SETUP              ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    // Conectar
    console.log('🔌 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conectado\n');

    // 1. Verificar tabla companies
    console.log('1️⃣  Verificando tabla companies...');
    const companiesTable = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
      );
    `);

    if (companiesTable[0].exists) {
      console.log('   ✅ Tabla companies existe');

      // Contar companies
      const countResult = await dataSource.query(`
        SELECT COUNT(*) as count FROM public.companies;
      `);
      console.log(`   📊 Total companies: ${countResult[0].count}`);

      // Listar companies
      const companies = await dataSource.query(`
        SELECT id, name, schema, subdomain, "isActive" 
        FROM public.companies 
        ORDER BY "createdAt";
      `);

      console.log('\n   📋 Companies:');
      companies.forEach((company: any) => {
        const status = company.isActive ? '🟢 Activa' : '🔴 Inactiva';
        console.log(`      - ${company.name}`);
        console.log(`        Schema: ${company.schema}`);
        console.log(`        Subdomain: ${company.subdomain || 'N/A'}`);
        console.log(`        Estado: ${status}`);
      });
    } else {
      console.log('   ❌ Tabla companies NO existe');
    }

    // 2. Verificar columna companyId en users
    console.log('\n2️⃣  Verificando columna companyId en users...');
    const companyIdColumn = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'companyId'
      );
    `);

    if (companyIdColumn[0].exists) {
      console.log('   ✅ Columna companyId existe en users');

      // Verificar foreign key
      const foreignKey = await dataSource.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND constraint_name = 'fk_users_company';
      `);

      if (foreignKey.length > 0) {
        console.log('   ✅ Foreign key fk_users_company existe');
      } else {
        console.log('   ⚠️  Foreign key fk_users_company NO existe');
      }
    } else {
      console.log('   ❌ Columna companyId NO existe en users');
    }

    // 3. Verificar índices
    console.log('\n3️⃣  Verificando índices...');
    const indexes = await dataSource.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('companies', 'users')
      AND indexname LIKE '%company%'
      ORDER BY indexname;
    `);

    if (indexes.length > 0) {
      console.log('   📊 Índices encontrados:');
      indexes.forEach((index: any) => {
        console.log(`      ✅ ${index.indexname}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron índices relacionados con companies');
    }

    // 4. Verificar usuarios con/sin company
    console.log('\n4️⃣  Verificando usuarios...');

    // Solo verificar si la columna existe
    if (companyIdColumn[0].exists) {
      const usersWithCompany = await dataSource.query(`
    SELECT COUNT(*) as count 
    FROM public.users 
    WHERE "companyId" IS NOT NULL;
  `);

      const usersWithoutCompany = await dataSource.query(`
    SELECT COUNT(*) as count 
    FROM public.users 
    WHERE "companyId" IS NULL;
  `);

      console.log(`   👥 Usuarios con company: ${usersWithCompany[0].count}`);
      console.log(`   👤 Usuarios sin company: ${usersWithoutCompany[0].count}`);
    } else {
      console.log('   ⚠️  No se puede verificar usuarios (columna companyId no existe aún)');
    }

    // Resumen
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║              ✅ VERIFICACIÓN COMPLETA                ║');
    console.log('╚══════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('\n❌ Error durante la verificación:');
    console.error(error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar
verifyMultiTenant().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
