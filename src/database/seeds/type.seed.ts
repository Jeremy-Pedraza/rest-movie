import { DataSource } from 'typeorm';
import { SEED_DATA } from '@constants';

export async function seedTypes(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('TypeEntity');

  for (const type of SEED_DATA.types) {
    const exists = await repository.findOne({ where: { name: type.name } });
    if (!exists) {
      await repository.save(repository.create({ ...type }));
    }
  }

  console.log(`  -> Types seeded: ${SEED_DATA.types.length} records`);
}
