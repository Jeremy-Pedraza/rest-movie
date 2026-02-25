// src/database/seeds/company.seed.ts

/**
 * @fileoverview Seed para crear/actualizar companies de desarrollo
 * @module database/seeds
 */

import { DataSource, DeepPartial } from 'typeorm';
import { CompanyEntity } from '@modules/company/entities';
import { GeoCountryEntity } from '@modules/geography/entities';

interface CompanySeedDefinition {
  subdomain: string;
  geoCountryCode?: string;
  data: DeepPartial<CompanyEntity>;
}

const COMPANY_DEFINITIONS: CompanySeedDefinition[] = [
  {
    subdomain: 'public',
    geoCountryCode: 'DO',
    data: {
      name: 'Sistema - Public Schema',
      subdomain: 'public',
      schema: 'public',
      is_active: true,
      ruc: '000000000',
      email: 'system@reports-tb.com',
      telefono: '+1-809-000-0000',
      direccion: 'Sistema Interno - Sin direccion fisica',
      pais: 'Sistema',
      ciudad: 'Sistema',
      timezone: 'America/Santo_Domingo',
      country_code: 'DO',
      currency_code: 'USD',
      currency_symbol: '$',
      date_format: 'DD/MM/YYYY',
      settings: {
        description: 'Schema publico para usuarios sin empresa asignada',
      },
    },
  },
  {
    subdomain: 'republica',
    geoCountryCode: 'DO',
    data: {
      name: 'Taco Bell Republica Dominicana',
      subdomain: 'republica',
      domain: 'republica.reports-tb.com',
      schema: 'taco_bell_rd',
      is_active: true,
      plan: 'premium',
      ruc: '101234567',
      email: 'admin@tacobell.do',
      telefono: '+1-809-555-0100',
      direccion: 'Av. Winston Churchill #93, Torre Empresarial, Piso 8, Piantini, Santo Domingo',
      pais: 'Republica Dominicana',
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
    },
  },
  {
    subdomain: 'colombia',
    geoCountryCode: 'CO',
    data: {
      name: 'Taco Bell Colombia',
      subdomain: 'colombia',
      domain: 'colombia.reports-tb.com',
      schema: 'taco_bell_co',
      is_active: true,
      plan: 'basic',
      ruc: '900123456',
      email: 'admin@tacobell.co',
      telefono: '+57-1-555-0100',
      direccion: 'Calle 93 #11A-28, Oficina 501, Chico Norte, Bogota',
      pais: 'Colombia',
      ciudad: 'Bogota',
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
    },
  },
  {
    subdomain: 'unitstates',
    geoCountryCode: 'US',
    data: {
      name: 'Taco Bell Estados Unidos',
      subdomain: 'unitstates',
      domain: 'unitstates.reports-tb.com',
      schema: 'taco_bell_eu',
      is_active: false,
      plan: 'free',
      ruc: '123456789',
      email: 'admin@tacobell.us',
      telefono: '+1-305-555-0100',
      direccion: '1900 Brickell Ave, Suite 400, Miami, FL 33129',
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
    },
  },
];

/**
 * Seed de companies
 *
 * Crea o actualiza las companies del sistema Taco Bell multi-tenant.
 */
export async function seedCompanies(dataSource: DataSource): Promise<void> {
  const companyRepo = dataSource.getRepository(CompanyEntity);
  const geoCountryRepo = dataSource.getRepository(GeoCountryEntity);

  console.log('\n[COMPANIES] Seeding companies...');

  const geoCountries = await geoCountryRepo.find();
  const geoByCode = new Map(geoCountries.map((country) => [country.code, country.id]));

  let created = 0;
  let updated = 0;

  for (const definition of COMPANY_DEFINITIONS) {
    const existingCompany = await companyRepo.findOne({
      where: { subdomain: definition.subdomain },
    });

    const geoCountryId = definition.geoCountryCode
      ? geoByCode.get(definition.geoCountryCode)
      : undefined;

    const payload: DeepPartial<CompanyEntity> = {
      ...definition.data,
      ...(geoCountryId ? { geo_country_id: geoCountryId } : {}),
    };

    if (existingCompany) {
      await companyRepo.save(
        companyRepo.create({
          id: existingCompany.id,
          ...payload,
        }),
      );
      updated++;
      console.log(`  [UPDATE] Company "${definition.data.name}" actualizada`);
      continue;
    }

    await companyRepo.save(companyRepo.create(payload));
    created++;
    console.log(`  [CREATE] Company "${definition.data.name}" creada`);
  }

  const totalCompanies = await companyRepo.count();
  const activeCompanies = await companyRepo.count({ where: { is_active: true } });

  console.log('\n  Resumen companies:');
  console.log(`     Creadas: ${created}`);
  console.log(`     Actualizadas: ${updated}`);
  console.log(`     Total companies: ${totalCompanies}`);
  console.log(`     Activas: ${activeCompanies}`);
  console.log(`     Inactivas: ${totalCompanies - activeCompanies}`);
}
