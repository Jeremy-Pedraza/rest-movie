import { DataSource } from 'typeorm';
import { SEED_DATA } from '@constants';

export async function seedGenres(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('GenreEntity');

  for (const genre of SEED_DATA.genres) {
    const exists = await repository.findOne({ where: { name: genre.name } });
    if (!exists) {
      await repository.save(repository.create({ ...genre }));
    }
  }

  console.log(`  -> Genres seeded: ${SEED_DATA.genres.length} records`);
}
