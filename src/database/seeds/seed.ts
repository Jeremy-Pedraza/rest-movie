import dataSource from '../../config/database/data-source';
import { seedGenres } from './genre.seed';
import { seedDirectors } from './director.seed';
import { seedProducers } from './producer.seed';
import { seedTypes } from './type.seed';

async function runSeeds(): Promise<void> {
  console.log('Initializing database connection...');
  await dataSource.initialize();
  console.log('Database connected.\n');

  console.log('Running seeds...');

  try {
    await seedGenres(dataSource);
    await seedDirectors(dataSource);
    await seedProducers(dataSource);
    await seedTypes(dataSource);

    console.log('\nAll seeds completed successfully!');
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

runSeeds();
