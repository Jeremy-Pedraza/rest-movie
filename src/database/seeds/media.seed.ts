import { DataSource } from 'typeorm';
import { SEED_DATA } from '@constants';
import { MediaEntity } from '@modules/media/entities/media.entity';
import { GenreEntity } from '@modules/genre/entities/genre.entity';
import { DirectorEntity } from '@modules/director/entities/director.entity';
import { ProducerEntity } from '@modules/producer/entities/producer.entity';
import { TypeEntity } from '@modules/type/entities/type.entity';

type SeedMediaItem = (typeof SEED_DATA.media)[number];

export async function seedMedia(dataSource: DataSource): Promise<void> {
  const mediaRepository = dataSource.getRepository(MediaEntity);
  const genreRepository = dataSource.getRepository(GenreEntity);
  const directorRepository = dataSource.getRepository(DirectorEntity);
  const producerRepository = dataSource.getRepository(ProducerEntity);
  const typeRepository = dataSource.getRepository(TypeEntity);

  for (const media of SEED_DATA.media) {
    const genre = await genreRepository.findOne({ where: { name: media.genreName } });
    const director = await directorRepository.findOne({ where: { names: media.directorName } });
    const producer = await producerRepository.findOne({ where: { name: media.producerName } });
    const type = await typeRepository.findOne({ where: { name: media.typeName } });

    validateRelation(media, 'genero', genre?.id);
    validateRelation(media, 'director', director?.id);
    validateRelation(media, 'productora', producer?.id);
    validateRelation(media, 'tipo', type?.id);

    const payload = {
      serial: media.serial,
      title: media.title,
      synopsis: media.synopsis,
      url: media.url,
      coverImage: media.coverImage,
      releaseYear: media.releaseYear,
      genreId: genre.id,
      directorId: director.id,
      producerId: producer.id,
      typeId: type.id,
    };

    const existing = await mediaRepository.findOne({ where: { serial: media.serial } });
    if (!existing) {
      await mediaRepository.save(mediaRepository.create(payload));
      continue;
    }

    await mediaRepository.save(
      mediaRepository.create({
        ...existing,
        ...payload,
      }),
    );
  }

  console.log(`  -> Media seeded: ${SEED_DATA.media.length} records`);
}

function validateRelation(
  media: SeedMediaItem,
  relationName: string,
  relationId: string | undefined,
): asserts relationId is string {
  if (!relationId) {
    throw new Error(
      `No se encontro ${relationName} configurado para "${media.title}" durante el seed de media.`,
    );
  }
}
