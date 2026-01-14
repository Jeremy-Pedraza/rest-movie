// src/database/seeds/company.seed.ts

/**
 * @fileoverview Seed para crear companies de desarrollo
 * @module database/seeds
 */

import { DataSource } from 'typeorm';
import { CompanyEntity } from '@modules/company/entities';

/**
 * Seed de companies
 *
 * Crea companies de ejemplo para desarrollo y testing:
 * 1. Public Schema (ya creado en migration)
 * 2. Restaurante Demo
 * 3. Cafetería Demo
 */
export async function seedCompanies(dataSource: DataSource): Promise<void> {
  const companyRepo = dataSource.getRepository(CompanyEntity);

  console.log('🌱 Seeding companies...');

  // Verificar si ya existe la company public (creada en migration)
  const publicCompany = await companyRepo.findOne({
    where: { schema: 'public' },
  });

  if (!publicCompany) {
    // Crear company public si no existe
    const newPublicCompany = companyRepo.create({
      name: 'Sistema - Public Schema',
      schema: 'public',
      subdomain: 'public',
      isActive: true,
      settings: {
        description: 'Schema público para usuarios sin empresa asignada',
      },
    });
    await companyRepo.save(newPublicCompany);
    console.log('  ✅ Company "public" creada');
  } else {
    console.log('  ⏭️  Company "public" ya existe');
  }

  // Company 1: Restaurante Demo
  const restaurantExists = await companyRepo.findOne({
    where: { subdomain: 'restaurant-demo' },
  });

  if (!restaurantExists) {
    const restaurant = companyRepo.create({
      name: 'Restaurante Valle Demo',
      schema: 'restaurant_valle_schema',
      domain: 'restaurant-demo.miapp.com',
      subdomain: 'restaurant-demo',
      isActive: true,
      plan: 'premium',
      settings: {
        features: ['pos', 'inventory', 'reports', 'multi-user'],
        maxUsers: 20,
        maxProducts: 500,
        timezone: 'America/Bogota',
        currency: 'COP',
      },
    });
    await companyRepo.save(restaurant);
    console.log('  ✅ Company "Restaurante Valle Demo" creada');
  } else {
    console.log('  ⏭️  Company "restaurant-demo" ya existe');
  }

  // Company 2: Cafetería Demo
  const cafeExists = await companyRepo.findOne({
    where: { subdomain: 'cafe-demo' },
  });

  if (!cafeExists) {
    const cafe = companyRepo.create({
      name: 'Cafetería Bogotá Demo',
      schema: 'cafe_bogota_schema',
      domain: 'cafe-demo.miapp.com',
      subdomain: 'cafe-demo',
      isActive: true,
      plan: 'basic',
      settings: {
        features: ['pos', 'inventory'],
        maxUsers: 5,
        maxProducts: 200,
        timezone: 'America/Bogota',
        currency: 'COP',
      },
    });
    await companyRepo.save(cafe);
    console.log('  ✅ Company "Cafetería Bogotá Demo" creada');
  } else {
    console.log('  ⏭️  Company "cafe-demo" ya existe');
  }

  // Company 3: Tienda Demo (Inactiva para testing)
  const tiendaExists = await companyRepo.findOne({
    where: { subdomain: 'tienda-demo' },
  });

  if (!tiendaExists) {
    const tienda = companyRepo.create({
      name: 'Tienda Cali Demo (Inactiva)',
      schema: 'tienda_cali_schema',
      domain: 'tienda-demo.miapp.com',
      subdomain: 'tienda-demo',
      isActive: false, // Inactiva para testing
      plan: 'free',
      settings: {
        features: ['pos'],
        maxUsers: 2,
        maxProducts: 50,
        timezone: 'America/Bogota',
        currency: 'COP',
      },
    });
    await companyRepo.save(tienda);
    console.log('  ✅ Company "Tienda Cali Demo" creada (INACTIVA)');
  } else {
    console.log('  ⏭️  Company "tienda-demo" ya existe');
  }

  console.log('✅ Companies seeded successfully');
}
