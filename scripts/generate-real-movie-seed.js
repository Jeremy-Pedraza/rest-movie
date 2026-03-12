const fs = require('fs');
const path = require('path');
const catalog = require('./real-movie-catalog');

const DIRECTORS = [
  'Christopher Nolan',
  'Steven Spielberg',
  'Martin Scorsese',
  'Quentin Tarantino',
  'James Cameron',
  'Ridley Scott',
];

const PRODUCERS = [
  'Walt Disney Pictures',
  'Warner Bros. Pictures',
  'Paramount Pictures',
  'Metro-Goldwyn-Mayer',
  'Universal Pictures',
  '20th Century Studios',
  'DreamWorks Pictures',
  'Miramax Films',
];

function escapeTs(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildTrailerUrl(title, year) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} official trailer`)}`;
}

function buildSynopsis(title, genre) {
  return `${title} es una pelicula reconocida del genero ${genre.toLowerCase()} incluida en el catalogo inicial con una portada real y una referencia publica de trailer.`;
}

async function fetchSummary(title, releaseYear, wikiTitle) {
  const candidates = [
    wikiTitle,
    title,
    `${title} (${releaseYear} film)`,
    `${title} (film)`,
    `${title} (${releaseYear})`,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate)}`;
    const response = await fetch(url, {
      headers: {
        'user-agent': 'codex-real-seed-generator/1.0',
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const image = data.originalimage?.source || data.thumbnail?.source;

    if (image) {
      return { wikiTitle: candidate, image };
    }
  }

  throw new Error(`No poster found for "${title}"`);
}

async function main() {
  const result = [];
  let serialCounter = 1;
  let rotationIndex = 0;

  for (const [genreName, items] of Object.entries(catalog)) {
    for (const [title, releaseYear, wikiTitle] of items) {
      const poster = await fetchSummary(title, releaseYear, wikiTitle);
      result.push({
        serial: `MOV-${String(serialCounter).padStart(3, '0')}`,
        title,
        synopsis: buildSynopsis(title, genreName),
        url: buildTrailerUrl(title, releaseYear),
        coverImage: poster.image,
        releaseYear,
        genreName,
        directorName: DIRECTORS[rotationIndex % DIRECTORS.length],
        producerName: PRODUCERS[rotationIndex % PRODUCERS.length],
        typeName: 'Pelicula',
        wikiTitle: poster.wikiTitle,
      });
      serialCounter += 1;
      rotationIndex += 1;
      console.log(`OK ${genreName}: ${title} -> ${poster.wikiTitle}`);
    }
  }

  const outputPath = path.resolve(__dirname, '../src/constants/generated-real-movies.constant.ts');
  const lines = [];

  lines.push("export const GENERATED_REAL_MOVIES = [");
  for (const item of result) {
    lines.push('  {');
    lines.push(`    serial: '${escapeTs(item.serial)}',`);
    lines.push(`    title: '${escapeTs(item.title)}',`);
    lines.push(`    synopsis: '${escapeTs(item.synopsis)}',`);
    lines.push(`    url: '${escapeTs(item.url)}',`);
    lines.push(`    coverImage: '${escapeTs(item.coverImage)}',`);
    lines.push(`    releaseYear: ${item.releaseYear},`);
    lines.push(`    genreName: '${escapeTs(item.genreName)}',`);
    lines.push(`    directorName: '${escapeTs(item.directorName)}',`);
    lines.push(`    producerName: '${escapeTs(item.producerName)}',`);
    lines.push("    typeName: 'Pelicula',");
    lines.push('  },');
  }
  lines.push('] as const;');
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`Generated ${result.length} movies in ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
