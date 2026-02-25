// src/database/seeds/latam-geography.seed.ts

/**
 * @fileoverview Seed geografico enfocado en Republica Dominicana.
 * @module database/seeds
 *
 * Incluye:
 * - 1 pais (DO)
 * - 32 divisiones administrativas (31 provincias + Distrito Nacional)
 * - 32 ciudades cabecera (capitales provinciales)
 */

import { DataSource } from 'typeorm';
import { GeoCountryEntity, GeoDepartmentEntity, GeoCityEntity } from '@modules/geography/entities';

interface CitySeed {
  name: string;
  aliases?: string[];
  population?: number;
  is_country_capital?: boolean;
}

interface DepartmentSeed {
  code: string;
  name: string;
  division_type: 'provincia' | 'distrito';
  is_capital: boolean;
  city: CitySeed;
}

const DOMINICAN_REPUBLIC = {
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
    { code: 'DN', name: 'Distrito Nacional', division_type: 'distrito', is_capital: true, city: { name: 'Santo Domingo', aliases: ['Santo Domingo de Guzman'], population: 965040, is_country_capital: true } },
    { code: 'AZ', name: 'Azua', division_type: 'provincia', is_capital: false, city: { name: 'Azua de Compostela', aliases: ['Azua'] } },
    { code: 'BA', name: 'Baoruco', division_type: 'provincia', is_capital: false, city: { name: 'Neiba', aliases: ['Neyba'] } },
    { code: 'BR', name: 'Barahona', division_type: 'provincia', is_capital: false, city: { name: 'Santa Cruz de Barahona', aliases: ['Barahona'] } },
    { code: 'DA', name: 'Dajabon', division_type: 'provincia', is_capital: false, city: { name: 'Dajabon' } },
    { code: 'DU', name: 'Duarte', division_type: 'provincia', is_capital: false, city: { name: 'San Francisco de Macoris', aliases: ['SFM'] } },
    { code: 'EP', name: 'Elias Pina', division_type: 'provincia', is_capital: false, city: { name: 'Comendador' } },
    { code: 'SE', name: 'El Seibo', division_type: 'provincia', is_capital: false, city: { name: 'Santa Cruz de El Seibo', aliases: ['El Seibo'] } },
    { code: 'ES', name: 'Espaillat', division_type: 'provincia', is_capital: false, city: { name: 'Moca' } },
    { code: 'HM', name: 'Hato Mayor', division_type: 'provincia', is_capital: false, city: { name: 'Hato Mayor del Rey', aliases: ['Hato Mayor'] } },
    { code: 'HE', name: 'Hermanas Mirabal', division_type: 'provincia', is_capital: false, city: { name: 'Salcedo' } },
    { code: 'IN', name: 'Independencia', division_type: 'provincia', is_capital: false, city: { name: 'Jimani' } },
    { code: 'AL', name: 'La Altagracia', division_type: 'provincia', is_capital: false, city: { name: 'Salvaleon de Higuey', aliases: ['Higuey'] } },
    { code: 'LR', name: 'La Romana', division_type: 'provincia', is_capital: false, city: { name: 'La Romana' } },
    { code: 'LV', name: 'La Vega', division_type: 'provincia', is_capital: false, city: { name: 'Concepcion de La Vega', aliases: ['La Vega'] } },
    { code: 'MT', name: 'Maria Trinidad Sanchez', division_type: 'provincia', is_capital: false, city: { name: 'Nagua' } },
    { code: 'MN', name: 'Monsenor Nouel', division_type: 'provincia', is_capital: false, city: { name: 'Bonao' } },
    { code: 'MC', name: 'Monte Cristi', division_type: 'provincia', is_capital: false, city: { name: 'San Fernando de Monte Cristi', aliases: ['Monte Cristi'] } },
    { code: 'MP', name: 'Monte Plata', division_type: 'provincia', is_capital: false, city: { name: 'Monte Plata' } },
    { code: 'PE', name: 'Pedernales', division_type: 'provincia', is_capital: false, city: { name: 'Pedernales' } },
    { code: 'PR', name: 'Peravia', division_type: 'provincia', is_capital: false, city: { name: 'Bani' } },
    { code: 'PP', name: 'Puerto Plata', division_type: 'provincia', is_capital: false, city: { name: 'San Felipe de Puerto Plata', aliases: ['Puerto Plata'] } },
    { code: 'SM', name: 'Samana', division_type: 'provincia', is_capital: false, city: { name: 'Santa Barbara de Samana', aliases: ['Samana'] } },
    { code: 'SC', name: 'San Cristobal', division_type: 'provincia', is_capital: false, city: { name: 'San Cristobal' } },
    { code: 'SO', name: 'San Jose de Ocoa', division_type: 'provincia', is_capital: false, city: { name: 'San Jose de Ocoa' } },
    { code: 'SJ', name: 'San Juan', division_type: 'provincia', is_capital: false, city: { name: 'San Juan de la Maguana', aliases: ['San Juan'] } },
    { code: 'SP', name: 'San Pedro de Macoris', division_type: 'provincia', is_capital: false, city: { name: 'San Pedro de Macoris' } },
    { code: 'SR', name: 'Sanchez Ramirez', division_type: 'provincia', is_capital: false, city: { name: 'Cotui' } },
    { code: 'ST', name: 'Santiago', division_type: 'provincia', is_capital: false, city: { name: 'Santiago de los Caballeros', aliases: ['Santiago'] } },
    { code: 'SA', name: 'Santiago Rodriguez', division_type: 'provincia', is_capital: false, city: { name: 'San Ignacio de Sabaneta', aliases: ['Sabaneta'] } },
    { code: 'SD', name: 'Santo Domingo', division_type: 'provincia', is_capital: false, city: { name: 'Santo Domingo Este', aliases: ['SDE'] } },
    { code: 'VA', name: 'Valverde', division_type: 'provincia', is_capital: false, city: { name: 'Santa Cruz de Mao', aliases: ['Mao'] } },
  ] as DepartmentSeed[],
};

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

  console.log('Iniciando seed geografico (Republica Dominicana)...');

  const existingCountry = await countryRepo.findOne({ where: { code: DOMINICAN_REPUBLIC.country.code } });
  if (existingCountry) {
    console.log('Ya existe DO en geo_countries. Saltando seed geografico.');
    return;
  }

  const country = countryRepo.create({
    ...DOMINICAN_REPUBLIC.country,
    name_normalized: normalizeString(DOMINICAN_REPUBLIC.country.name),
    is_active: true,
  });
  await countryRepo.save(country);

  let totalDepartments = 0;
  let totalCities = 0;

  for (let deptOrder = 0; deptOrder < DOMINICAN_REPUBLIC.departments.length; deptOrder++) {
    const deptData = DOMINICAN_REPUBLIC.departments[deptOrder];

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

    const city = cityRepo.create({
      department_id: department.id,
      name: deptData.city.name,
      name_normalized: normalizeString(deptData.city.name),
      aliases: deptData.city.aliases,
      is_capital: true,
      is_country_capital: deptData.city.is_country_capital || false,
      population: deptData.city.population,
      display_order: deptData.city.is_country_capital ? 1 : 5,
      is_active: true,
    });

    await cityRepo.save(city);
    totalCities++;
  }

  console.log('Seed geografico completado:');
  console.log('  Paises: 1 (Republica Dominicana)');
  console.log(`  Departamentos/Provincias: ${totalDepartments}`);
  console.log(`  Ciudades cabecera: ${totalCities}`);
}

export default seedGeography;
