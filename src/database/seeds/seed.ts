import { DataSource } from 'typeorm';
import { dataSourceOptions } from '@config/database/data-source';

async function seed() {
  console.log('🌱 Starting database seeding...');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Add your seed logic here
    // Example:
    // await seedRoles(dataSource);
    // await seedPermissions(dataSource);
    // await seedUsers(dataSource);

    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

seed();
