import { DataSource } from 'typeorm';
import { SEED_DATA } from '@constants';

export async function seedDirectors(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('DirectorEntity');

  for (const director of SEED_DATA.directors) {
    const exists = await repository.findOne({ where: { names: director.names } });
    if (!exists) {
      await repository.save(repository.create({ ...director }));
    }
  }

  console.log(`  -> Directors seeded: ${SEED_DATA.directors.length} records`);
}
