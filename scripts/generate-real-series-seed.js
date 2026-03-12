const fs = require('fs');
const path = require('path');
const catalog = require('./real-series-catalog');

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

function buildTrailerUrl(title, year, genre) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} ${genre} official trailer series`)}`;
}

function buildSynopsis(title, genre) {
  return `${title} es una serie reconocida del genero ${genre.toLowerCase()} incluida en el catalogo inicial con una portada real y una referencia publica de trailer.`;
}

async function fetchImdbImage(title, releaseYear) {
  const first = (title[0] || 'a').toLowerCase().replace(/[^a-z0-9]/g, 'a');
  const url = `https://v3.sg.media-imdb.com/suggestion/${first}/${encodeURIComponent(title)}.json`;
  const response = await fetch(url, {
    headers: {
      'user-agent': 'codex-real-series-generator/1.0',
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const items = data?.d ?? [];

  const exact = items.find((item) => {
    const itemTitle = String(item.l || '').toLowerCase();
    const itemType = String(item.q || '').toLowerCase();
    const itemYear = Number(item.y);
    return (
      itemTitle === title.toLowerCase() &&
      item.i?.imageUrl &&
      (itemType.includes('tv') || itemType.includes('series') || itemType.includes('mini')) &&
      (!Number.isFinite(itemYear) || itemYear === releaseYear)
    );
  });

  if (exact?.i?.imageUrl) {
    return exact.i.imageUrl;
  }

  const fallback = items.find((item) => {
    const itemType = String(item.q || '').toLowerCase();
    return item.i?.imageUrl && (itemType.includes('tv') || itemType.includes('series') || itemType.includes('mini'));
  });

  return fallback?.i?.imageUrl ?? null;
}

async function fetchSummary(title, releaseYear, wikiTitle) {
  const candidates = [
    wikiTitle,
    `${title} (TV series)`,
    `${title} (${releaseYear} TV series)`,
    `${title} (American TV series)`,
    title,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate)}`;
    const summaryResponse = await fetch(summaryUrl, {
      headers: {
        'user-agent': 'codex-real-series-generator/1.0',
        accept: 'application/json',
      },
    });

    if (summaryResponse.ok) {
      const data = await summaryResponse.json();
      const image = data.originalimage?.source || data.thumbnail?.source;

      if (image) {
        return { wikiTitle: candidate, image };
      }
    }

    const queryUrl =
      `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&format=json&titles=${encodeURIComponent(candidate)}`;
    const queryResponse = await fetch(queryUrl, {
      headers: {
        'user-agent': 'codex-real-series-generator/1.0',
        accept: 'application/json',
      },
    });

    if (!queryResponse.ok) {
      continue;
    }

    const queryData = await queryResponse.json();
    const pages = queryData?.query?.pages ?? {};
    const page = Object.values(pages)[0];
    const image = page?.original?.source;

    if (image) {
      return { wikiTitle: candidate, image };
    }
  }

  const imdbImage = await fetchImdbImage(title, releaseYear);
  if (imdbImage) {
    return { wikiTitle: wikiTitle || title, image: imdbImage };
  }

  throw new Error(`No poster found for "${title}"`);
}

async function main() {
  const result = [];
  const failures = [];
  let serialCounter = 1;
  let rotationIndex = 0;

  for (const [genreName, items] of Object.entries(catalog)) {
    for (const [title, releaseYear, wikiTitle] of items) {
      let poster;
      try {
        poster = await fetchSummary(title, releaseYear, wikiTitle);
      } catch (error) {
        failures.push({ genreName, title, releaseYear, wikiTitle, error: error.message });
        console.log(`FAIL ${genreName}: ${title}`);
        continue;
      }

      result.push({
        serial: `SER-${String(serialCounter).padStart(3, '0')}`,
        title,
        synopsis: buildSynopsis(title, genreName),
        url: buildTrailerUrl(title, releaseYear, genreName),
        coverImage: poster.image,
        releaseYear,
        genreName,
        directorName: DIRECTORS[rotationIndex % DIRECTORS.length],
        producerName: PRODUCERS[rotationIndex % PRODUCERS.length],
        typeName: 'Serie',
        wikiTitle: poster.wikiTitle,
      });
      serialCounter += 1;
      rotationIndex += 1;
      console.log(`OK ${genreName}: ${title} -> ${poster.wikiTitle}`);
    }
  }

  const outputPath = path.resolve(__dirname, '../src/constants/generated-real-series.constant.ts');
  const lines = [];

  lines.push("export const GENERATED_REAL_SERIES = [");
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
    lines.push("    typeName: 'Serie',");
    lines.push('  },');
  }
  lines.push('] as const;');
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`Generated ${result.length} series in ${outputPath}`);

  if (failures.length > 0) {
    console.log('Failures:');
    for (const failure of failures) {
      console.log(`${failure.genreName} | ${failure.title} | ${failure.releaseYear} | ${failure.wikiTitle || ''}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
