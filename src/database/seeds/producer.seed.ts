import { DataSource } from 'typeorm';

export async function seedProducers(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('ProducerEntity');

  const producers = [
    { name: 'Walt Disney Pictures', slogan: 'Where Dreams Come True', description: 'Compania de entretenimiento multinacional', isActive: true },
    { name: 'Warner Bros. Pictures', slogan: 'If You Can Dream It, We Can Film It', description: 'Estudio de cine y entretenimiento', isActive: true },
    { name: 'Paramount Pictures', slogan: 'A Viacom Company', description: 'Estudio cinematografico estadounidense', isActive: true },
    { name: 'Metro-Goldwyn-Mayer', slogan: 'Ars Gratia Artis', description: 'Compania de medios estadounidense', isActive: true },
    { name: 'Universal Pictures', slogan: null, description: 'Estudio de produccion cinematografica', isActive: true },
    { name: '20th Century Studios', slogan: null, description: 'Estudio de produccion de peliculas y television', isActive: true },
  ];

  for (const producer of producers) {
    const exists = await repository.findOne({ where: { name: producer.name } });
    if (!exists) {
      await repository.save(repository.create(producer));
    }
  }

  console.log(`  -> Producers seeded: ${producers.length} records`);
}
