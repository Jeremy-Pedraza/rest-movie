// src/database/seeds/latam-geography.seed.ts

/**
 * @fileoverview Seed geografico para Republica Dominicana, Costa Rica,
 *               Colombia y Estados Unidos.
 * @module database/seeds
 *
 * Incluye:
 * - 4 paises (DO, CR, CO, US)
 * - Divisiones administrativas por pais
 * - Ciudades cabecera y ciudades relevantes para tiendas
 */

import { DataSource } from 'typeorm';
import { GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity } from '@modules/geography/entities';

interface CitySeed {
  name: string;
  aliases?: string[];
  population?: number;
  is_country_capital?: boolean;
  is_capital?: boolean;
}

interface DepartmentSeed {
  code: string;
  name: string;
  division_type: string;
  is_capital: boolean;
  cities: CitySeed[];
}

interface CountrySeed {
  country: {
    code: string;
    code_alpha3: string;
    code_numeric: number;
    name: string;
    name_en: string;
    timezone: string;
    currency_code: string;
    currency_symbol: string;
    phone_code: string;
    tax_name: string;
    tax_rate: number;
    date_format: string;
    display_order: number;
  };
  departments: DepartmentSeed[];
}

// ══════════════════════════════════════════════════════════════
// República Dominicana
// ══════════════════════════════════════════════════════════════

const DOMINICAN_REPUBLIC: CountrySeed = {
  country: {
    code: 'DO',
    code_alpha3: 'DOM',
    code_numeric: 214,
    name: 'Republica Dominicana',
    name_en: 'Dominican Republic',
    timezone: 'America/Santo_Domingo',
    currency_code: 'DOP',
    currency_symbol: 'RD$',
    phone_code: '+1-809',
    tax_name: 'ITBIS',
    tax_rate: 0.18,
    date_format: 'DD/MM/YYYY',
    display_order: 1,
  },
  departments: [
    {
      code: 'DN',
      name: 'Distrito Nacional',
      division_type: 'distrito',
      is_capital: true,
      cities: [
        {
          name: 'Santo Domingo',
          aliases: ['Santo Domingo de Guzman'],
          population: 965040,
          is_country_capital: true,
          is_capital: true,
        },
      ],
    },
    {
      code: 'AZ',
      name: 'Azua',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Azua de Compostela', aliases: ['Azua'], is_capital: true }],
    },
    {
      code: 'BA',
      name: 'Baoruco',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Neiba', aliases: ['Neyba'], is_capital: true }],
    },
    {
      code: 'BR',
      name: 'Barahona',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Santa Cruz de Barahona', aliases: ['Barahona'], is_capital: true }],
    },
    {
      code: 'DA',
      name: 'Dajabon',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Dajabon', is_capital: true }],
    },
    {
      code: 'DU',
      name: 'Duarte',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'San Francisco de Macoris', aliases: ['SFM'], is_capital: true }],
    },
    {
      code: 'EP',
      name: 'Elias Pina',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Comendador', is_capital: true }],
    },
    {
      code: 'SE',
      name: 'El Seibo',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Santa Cruz de El Seibo', aliases: ['El Seibo'], is_capital: true }],
    },
    {
      code: 'ES',
      name: 'Espaillat',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Moca', is_capital: true }],
    },
    {
      code: 'HM',
      name: 'Hato Mayor',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Hato Mayor del Rey', aliases: ['Hato Mayor'], is_capital: true }],
    },
    {
      code: 'HE',
      name: 'Hermanas Mirabal',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Salcedo', is_capital: true }],
    },
    {
      code: 'IN',
      name: 'Independencia',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Jimani', is_capital: true }],
    },
    {
      code: 'AL',
      name: 'La Altagracia',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Salvaleon de Higuey', aliases: ['Higuey'], is_capital: true }],
    },
    {
      code: 'LR',
      name: 'La Romana',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'La Romana', is_capital: true }],
    },
    {
      code: 'LV',
      name: 'La Vega',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Concepcion de La Vega', aliases: ['La Vega'], is_capital: true }],
    },
    {
      code: 'MT',
      name: 'Maria Trinidad Sanchez',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Nagua', is_capital: true }],
    },
    {
      code: 'MN',
      name: 'Monsenor Nouel',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Bonao', is_capital: true }],
    },
    {
      code: 'MC',
      name: 'Monte Cristi',
      division_type: 'provincia',
      is_capital: false,
      cities: [
        { name: 'San Fernando de Monte Cristi', aliases: ['Monte Cristi'], is_capital: true },
      ],
    },
    {
      code: 'MP',
      name: 'Monte Plata',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Monte Plata', is_capital: true }],
    },
    {
      code: 'PE',
      name: 'Pedernales',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Pedernales', is_capital: true }],
    },
    {
      code: 'PR',
      name: 'Peravia',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Bani', is_capital: true }],
    },
    {
      code: 'PP',
      name: 'Puerto Plata',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'San Felipe de Puerto Plata', aliases: ['Puerto Plata'], is_capital: true }],
    },
    {
      code: 'SM',
      name: 'Samana',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Santa Barbara de Samana', aliases: ['Samana'], is_capital: true }],
    },
    {
      code: 'SC',
      name: 'San Cristobal',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'San Cristobal', is_capital: true }],
    },
    {
      code: 'SO',
      name: 'San Jose de Ocoa',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'San Jose de Ocoa', is_capital: true }],
    },
    {
      code: 'SJ',
      name: 'San Juan',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'San Juan de la Maguana', aliases: ['San Juan'], is_capital: true }],
    },
    {
      code: 'SP',
      name: 'San Pedro de Macoris',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'San Pedro de Macoris', is_capital: true }],
    },
    {
      code: 'SR',
      name: 'Sanchez Ramirez',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Cotui', is_capital: true }],
    },
    {
      code: 'ST',
      name: 'Santiago',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Santiago de los Caballeros', aliases: ['Santiago'], is_capital: true }],
    },
    {
      code: 'SA',
      name: 'Santiago Rodriguez',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'San Ignacio de Sabaneta', aliases: ['Sabaneta'], is_capital: true }],
    },
    {
      code: 'SD',
      name: 'Santo Domingo',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Santo Domingo Este', aliases: ['SDE'], is_capital: true }],
    },
    {
      code: 'VA',
      name: 'Valverde',
      division_type: 'provincia',
      is_capital: false,
      cities: [{ name: 'Santa Cruz de Mao', aliases: ['Mao'], is_capital: true }],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
// Costa Rica
// ══════════════════════════════════════════════════════════════

const COSTA_RICA: CountrySeed = {
  country: {
    code: 'CR',
    code_alpha3: 'CRI',
    code_numeric: 188,
    name: 'Costa Rica',
    name_en: 'Costa Rica',
    timezone: 'America/Costa_Rica',
    currency_code: 'CRC',
    currency_symbol: '₡',
    phone_code: '+506',
    tax_name: 'IVA',
    tax_rate: 0.13,
    date_format: 'DD/MM/YYYY',
    display_order: 2,
  },
  departments: [
    // ── San José (10 cantones con tiendas) ──
    {
      code: 'SJ',
      name: 'San Jose',
      division_type: 'provincia',
      is_capital: true,
      cities: [
        {
          name: 'San Jose',
          aliases: ['San José'],
          population: 342188,
          is_country_capital: true,
          is_capital: true,
        },
        { name: 'Coronado', aliases: ['Vazquez de Coronado', 'Vázquez de Coronado'] },
        { name: 'Tibas', aliases: ['Tibás'] },
        { name: 'Moravia', aliases: ['San Vicente de Moravia'] },
        { name: 'Montes de Oca', aliases: ['San Pedro', 'Sabanilla'] },
        { name: 'Curridabat' },
        { name: 'Desamparados', population: 241071 },
        { name: 'Goicoechea', aliases: ['Guadalupe'] },
        { name: 'Santa Ana', aliases: ['Lindora'] },
        {
          name: 'Perez Zeledon',
          aliases: ['Pérez Zeledón', 'San Isidro de El General'],
          population: 142950,
        },
      ],
    },
    // ── Alajuela (4 cantones con tiendas) ──
    {
      code: 'AL',
      name: 'Alajuela',
      division_type: 'provincia',
      is_capital: false,
      cities: [
        { name: 'Alajuela', population: 296634, is_capital: true },
        { name: 'San Carlos', aliases: ['Ciudad Quesada'], population: 186534 },
        { name: 'San Ramon', aliases: ['San Ramón'], population: 87032 },
        { name: 'Grecia', population: 93105 },
      ],
    },
    // ── Cartago (4 cantones con tiendas) ──
    {
      code: 'CA',
      name: 'Cartago',
      division_type: 'provincia',
      is_capital: false,
      cities: [
        { name: 'Cartago', population: 156219, is_capital: true },
        { name: 'Paraiso', aliases: ['Paraíso'], population: 68489 },
        { name: 'La Union', aliases: ['La Unión', 'Tres Rios', 'Tres Ríos'], population: 106480 },
        { name: 'El Guarco', aliases: ['Tejar'], population: 43591 },
      ],
    },
    // ── Heredia (2 cantones con tiendas) ──
    {
      code: 'HE',
      name: 'Heredia',
      division_type: 'provincia',
      is_capital: false,
      cities: [
        { name: 'Heredia', population: 137020, is_capital: true },
        {
          name: 'Flores',
          aliases: ['San Joaquin de Flores', 'San Joaquín de Flores'],
          population: 22844,
        },
      ],
    },
    // ── Guanacaste (2 cantones con tiendas) ──
    {
      code: 'GU',
      name: 'Guanacaste',
      division_type: 'provincia',
      is_capital: false,
      cities: [
        { name: 'Liberia', population: 69770, is_capital: true },
        { name: 'Abangares', aliases: ['Las Juntas'], population: 19856 },
      ],
    },
    // ── Puntarenas (2 cantones con tiendas) ──
    {
      code: 'PU',
      name: 'Puntarenas',
      division_type: 'provincia',
      is_capital: false,
      cities: [
        { name: 'Puntarenas', population: 128035, is_capital: true },
        { name: 'Garabito', aliases: ['Jaco', 'Jacó'], population: 20229 },
      ],
    },
    // ── Limón (2 cantones con tiendas) ──
    {
      code: 'LI',
      name: 'Limon',
      division_type: 'provincia',
      is_capital: false,
      cities: [
        { name: 'Limon', aliases: ['Limón'], population: 105060, is_capital: true },
        { name: 'Pococi', aliases: ['Pococí', 'Guapiles', 'Guápiles'], population: 140489 },
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
// Colombia (mínimo para geo_country_id de company)
// ══════════════════════════════════════════════════════════════

const COLOMBIA: CountrySeed = {
  country: {
    code: 'CO',
    code_alpha3: 'COL',
    code_numeric: 170,
    name: 'Colombia',
    name_en: 'Colombia',
    timezone: 'America/Bogota',
    currency_code: 'COP',
    currency_symbol: '$',
    phone_code: '+57',
    tax_name: 'IVA',
    tax_rate: 0.19,
    date_format: 'DD/MM/YYYY',
    display_order: 3,
  },
  departments: [
    {
      code: 'DC',
      name: 'Bogota D.C.',
      division_type: 'distrito capital',
      is_capital: true,
      cities: [
        {
          name: 'Bogota',
          aliases: ['Bogotá', 'Santa Fe de Bogota'],
          population: 7743955,
          is_country_capital: true,
          is_capital: true,
        },
      ],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
// Estados Unidos (mínimo para geo_country_id de company)
// ══════════════════════════════════════════════════════════════

const UNITED_STATES: CountrySeed = {
  country: {
    code: 'US',
    code_alpha3: 'USA',
    code_numeric: 840,
    name: 'Estados Unidos',
    name_en: 'United States',
    timezone: 'America/New_York',
    currency_code: 'USD',
    currency_symbol: '$',
    phone_code: '+1',
    tax_name: 'Sales Tax',
    tax_rate: 0.07,
    date_format: 'MM/DD/YYYY',
    display_order: 4,
  },
  departments: [
    {
      code: 'FL',
      name: 'Florida',
      division_type: 'state',
      is_capital: false,
      cities: [{ name: 'Miami', aliases: ['Miami-Dade'], population: 442241, is_capital: false }],
    },
  ],
};

// ══════════════════════════════════════════════════════════════
// Todos los países a seedear
// ══════════════════════════════════════════════════════════════

const ALL_COUNTRIES: CountrySeed[] = [DOMINICAN_REPUBLIC, COSTA_RICA, COLOMBIA, UNITED_STATES];

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function seedGeography(dataSource: DataSource): Promise<void> {
  const countryRepo = dataSource.getRepository(GeoCountryEntity);
  const deptRepo = dataSource.getRepository(GeoDepartmentEntity);
  const cityRepo = dataSource.getRepository(GeoCityEntity);

  console.log('Iniciando seed geografico...');

  let totalCountries = 0;
  let totalDepartments = 0;
  let totalCities = 0;

  for (const countrySeed of ALL_COUNTRIES) {
    const existing = await countryRepo.findOne({
      where: { code: countrySeed.country.code },
    });

    if (existing) {
      console.log(`  Ya existe ${countrySeed.country.code} en geo_countries. Saltando.`);
      continue;
    }

    const country = countryRepo.create({
      ...countrySeed.country,
      name_normalized: normalizeString(countrySeed.country.name),
      is_active: true,
    });
    await countryRepo.save(country);
    totalCountries++;

    for (let deptOrder = 0; deptOrder < countrySeed.departments.length; deptOrder++) {
      const deptData = countrySeed.departments[deptOrder];

      const department = deptRepo.create({
        country_id: country.id,
        code: deptData.code,
        name: deptData.name,
        name_normalized: normalizeString(deptData.name),
        division_type: deptData.division_type,
        is_capital: deptData.is_capital,
        display_order: deptData.is_capital ? 1 : 10 + deptOrder,
        is_active: true,
      });

      await deptRepo.save(department);
      totalDepartments++;

      for (let cityIdx = 0; cityIdx < deptData.cities.length; cityIdx++) {
        const cityData = deptData.cities[cityIdx];

        const city = cityRepo.create({
          department_id: department.id,
          name: cityData.name,
          name_normalized: normalizeString(cityData.name),
          aliases: cityData.aliases,
          is_capital: cityData.is_capital ?? cityIdx === 0,
          is_country_capital: cityData.is_country_capital || false,
          population: cityData.population,
          display_order: cityData.is_country_capital ? 1 : cityData.is_capital ? 2 : 5 + cityIdx,
          is_active: true,
        });

        await cityRepo.save(city);
        totalCities++;
      }
    }

    console.log(`  ${countrySeed.country.name} (${countrySeed.country.code}): seeded`);
  }

  console.log('Seed geografico completado:');
  console.log(`  Paises: ${totalCountries}`);
  console.log(`  Departamentos/Provincias: ${totalDepartments}`);
  console.log(`  Ciudades: ${totalCities}`);
}
