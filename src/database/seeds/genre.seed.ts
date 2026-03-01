import { DataSource } from 'typeorm';

export async function seedGenres(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository('GenreEntity');

  const genres = [
    { name: 'Accion', description: 'Peliculas con escenas de accion y combate', isActive: true },
    { name: 'Aventura', description: 'Peliculas de exploracion y aventuras', isActive: true },
    { name: 'Ciencia Ficcion', description: 'Peliculas basadas en conceptos cientificos y futuristas', isActive: true },
    { name: 'Drama', description: 'Peliculas con narrativas emotivas y profundas', isActive: true },
    { name: 'Terror', description: 'Peliculas disenadas para generar miedo y suspenso', isActive: true },
    { name: 'Comedia', description: 'Peliculas con humor y situaciones comicas', isActive: true },
    { name: 'Romance', description: 'Peliculas centradas en relaciones amorosas', isActive: true },
    { name: 'Animacion', description: 'Peliculas creadas con tecnicas de animacion', isActive: true },
  ];

  for (const genre of genres) {
    const exists = await repository.findOne({ where: { name: genre.name } });
    if (!exists) {
      await repository.save(repository.create(genre));
    }
  }

  console.log(`  -> Genres seeded: ${genres.length} records`);
}
