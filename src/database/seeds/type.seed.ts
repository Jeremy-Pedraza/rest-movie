import { DataSource } from 'typeorm';

export async function seedTypes(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('TypeEntity');

  const types = [
    { name: 'Pelicula', description: 'Contenido audiovisual de larga duracion' },
    { name: 'Serie', description: 'Contenido audiovisual dividido en episodios y temporadas' },
  ];

  for (const type of types) {
    const exists = await repository.findOne({ where: { name: type.name } });
    if (!exists) {
      await repository.save(repository.create(type));
    }
  }

  console.log(`  -> Types seeded: ${types.length} records`);
}
