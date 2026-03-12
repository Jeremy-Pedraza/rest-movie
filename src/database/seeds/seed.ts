import dataSource from '../../config/database/data-source';
import { seedGenres } from './genre.seed';
import { seedDirectors } from './director.seed';
import { seedProducers } from './producer.seed';
import { seedTypes } from './type.seed';
import { seedMedia } from './media.seed';
import { seedRoles } from './role.seed';
import { seedAdminUser } from './user.seed';

async function runSeeds(): Promise<void> {
  console.log('Initializing database connection...');
  await dataSource.initialize();
  console.log('Database connected.\n');

  console.log('Running seeds...');

  try {
    // Auth seeds (roles primero, luego admin user)
    await seedRoles(dataSource);
    await seedAdminUser(dataSource);

    // Catalog seeds
    await seedGenres(dataSource);
    await seedDirectors(dataSource);
    await seedProducers(dataSource);
    await seedTypes(dataSource);
    await seedMedia(dataSource);

    console.log('\nAll seeds completed successfully!');
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

void runSeeds();
