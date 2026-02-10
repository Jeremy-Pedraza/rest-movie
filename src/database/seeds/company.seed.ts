// src/database/seeds/company.seed.ts

/**
 * @fileoverview Seed para crear companies de desarrollo
 * @module database/seeds
 *
 * Companies para el sistema Taco Bell Multi-Tenant:
 * 1. Sistema - Public Schema (usuarios sin empresa)
 * 2. Taco Bell República Dominicana (premium)
 * 3. Taco Bell Colombia (basic)
 * 4. Taco Bell Estados Unidos (free, inactiva)
 */

import { DataSource, DeepPartial } from 'typeorm';
import { CompanyEntity } from '@modules/company/entities';

/**
 * Seed de companies
 *
 * Crea las companies del sistema Taco Bell multi-tenant
 */
export async function seedCompanies(dataSource: DataSource): Promise<void> {
  const companyRepo = dataSource.getRepository(CompanyEntity);

  console.log('\n┌────────────────────────────────────────────────────┐');
  console.log('│  🏢 SEEDING COMPANIES                              │');
  console.log('└────────────────────────────────────────────────────┘');

  // ============================================
  // 1. Sistema - Public Schema
  // ============================================
  const publicExists = await companyRepo.findOne({
    where: { subdomain: 'public' },
  });

  if (!publicExists) {
    const publicCompany: DeepPartial<CompanyEntity> = {
      name: 'Sistema - Public Schema',
      subdomain: 'public',
      schema: 'public',
      is_active: true,
      ruc: '000000000',
      email: 'system@reports-tb.com',
      pais: 'Sistema',
      ciudad: 'Sistema',
      timezone: 'America/Santo_Domingo',
      country_code: 'DO',
      currency_code: 'USD',
      currency_symbol: '$',
      date_format: 'DD/MM/YYYY',
      settings: {
        description: 'Schema público para usuarios sin empresa asignada',
      },
    };

    await companyRepo.save(companyRepo.create(publicCompany));
    console.log('  ✅ Company "Sistema - Public Schema" creada');
  } else {
    console.log('  ⏭️  Company "Sistema - Public Schema" ya existe');
  }

  // ============================================
  // 2. Taco Bell República Dominicana (Premium)
  // ============================================
  const tacoBellRDExists = await companyRepo.findOne({
    where: { subdomain: 'republica' },
  });

  if (!tacoBellRDExists) {
    const tacoBellRD: DeepPartial<CompanyEntity> = {
      name: 'Taco Bell Republica Dominicana',
      subdomain: 'republica',
      domain: 'republica.reports-tb.com',
      schema: 'taco_bell_rd',
      is_active: true,
      plan: 'premium',
      ruc: '101234567',
      email: 'admin@tacobell.do',
      pais: 'República Dominicana',
      ciudad: 'Santo Domingo',
      timezone: 'America/Santo_Domingo',
      country_code: 'DO',
      currency_code: 'DOP',
      currency_symbol: 'RD$',
      date_format: 'DD/MM/YYYY',
      tax_config: {
        tax_rate: 0.18,
        tax_name: 'ITBIS',
        tax_included: true,
      },
      settings: {
        features: ['pos', 'inventory', 'reports', 'multi-user'],
        max_users: 20,
        max_products: 500,
      },
    };

    await companyRepo.save(companyRepo.create(tacoBellRD));
    console.log('  ✅ Company "Taco Bell Republica Dominicana" creada (premium)');
  } else {
    console.log('  ⏭️  Company "Taco Bell Republica Dominicana" ya existe');
  }

  // ============================================
  // 3. Taco Bell Colombia (Basic)
  // ============================================
  const tacoBellCOExists = await companyRepo.findOne({
    where: { subdomain: 'colombia' },
  });

  if (!tacoBellCOExists) {
    const tacoBellCO: DeepPartial<CompanyEntity> = {
      name: 'Taco Bell Colombia',
      subdomain: 'colombia',
      domain: 'colombia.reports-tb.com',
      schema: 'taco_bell_co',
      is_active: true,
      plan: 'basic',
      ruc: '900123456',
      email: 'admin@tacobell.co',
      pais: 'Colombia',
      ciudad: 'Bogotá',
      timezone: 'America/Bogota',
      country_code: 'CO',
      currency_code: 'COP',
      currency_symbol: '$',
      date_format: 'DD/MM/YYYY',
      tax_config: {
        tax_rate: 0.19,
        tax_name: 'IVA',
        tax_included: true,
      },
      settings: {
        features: ['pos', 'inventory'],
        max_users: 5,
        max_products: 200,
      },
    };

    await companyRepo.save(companyRepo.create(tacoBellCO));
    console.log('  ✅ Company "Taco Bell Colombia" creada (basic)');
  } else {
    console.log('  ⏭️  Company "Taco Bell Colombia" ya existe');
  }

  // ============================================
  // 4. Taco Bell Estados Unidos (Free - Inactiva)
  // ============================================
  const tacoBellUSExists = await companyRepo.findOne({
    where: { subdomain: 'unitstates' },
  });

  if (!tacoBellUSExists) {
    const tacoBellUS: DeepPartial<CompanyEntity> = {
      name: 'Taco Bell Estados Unidos',
      subdomain: 'unitstates',
      domain: 'unitstates.reports-tb.com',
      schema: 'taco_bell_eu',
      is_active: false, // ❌ Inactiva para testing
      plan: 'free',
      ruc: '123456789',
      email: 'admin@tacobell.us',
      pais: 'Estados Unidos',
      ciudad: 'Miami',
      timezone: 'America/New_York',
      country_code: 'US',
      currency_code: 'USD',
      currency_symbol: '$',
      date_format: 'MM/DD/YYYY',
      tax_config: {
        tax_rate: 0.07,
        tax_name: 'Sales Tax',
        tax_included: false,
      },
      settings: {
        features: ['pos'],
        max_users: 2,
        max_products: 50,
      },
    };

    await companyRepo.save(companyRepo.create(tacoBellUS));
    console.log('  ✅ Company "Taco Bell Estados Unidos" creada (free, INACTIVA)');
  } else {
    console.log('  ⏭️  Company "Taco Bell Estados Unidos" ya existe');
  }

  // ============================================
  // RESUMEN
  // ============================================
  const totalCompanies = await companyRepo.count();
  const activeCompanies = await companyRepo.count({ where: { is_active: true } });

  console.log('\n  📊 Resumen:');
  console.log(`     Total companies: ${totalCompanies}`);
  console.log(`     Activas: ${activeCompanies}`);
  console.log(`     Inactivas: ${totalCompanies - activeCompanies}`);
  console.log('\n  ✅ Companies seeded successfully');
}
