import { DataSource } from 'typeorm';
import { SEED_DATA } from '@constants';

export async function seedProducers(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('ProducerEntity');

  for (const producer of SEED_DATA.producers) {
    const exists = await repository.findOne({ where: { name: producer.name } });
    if (!exists) {
      await repository.save(repository.create({ ...producer }));
    }
  }

  console.log(`  -> Producers seeded: ${SEED_DATA.producers.length} records`);
}
