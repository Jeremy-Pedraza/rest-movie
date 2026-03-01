import { DataSource } from 'typeorm';

export async function seedDirectors(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('DirectorEntity');

  const directors = [
    { names: 'Christopher Nolan', isActive: true },
    { names: 'Steven Spielberg', isActive: true },
    { names: 'Martin Scorsese', isActive: true },
    { names: 'Quentin Tarantino', isActive: true },
    { names: 'James Cameron', isActive: true },
    { names: 'Ridley Scott', isActive: true },
  ];

  for (const director of directors) {
    const exists = await repository.findOne({ where: { names: director.names } });
    if (!exists) {
      await repository.save(repository.create(director));
    }
  }

  console.log(`  -> Directors seeded: ${directors.length} records`);
}
