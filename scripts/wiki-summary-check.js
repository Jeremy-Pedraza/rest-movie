const titles = process.argv.slice(2);

async function main() {
  for (const title of titles) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(url, {
      headers: {
        'user-agent': 'codex-seed-check/1.0',
        accept: 'application/json',
      },
    });

    console.log(`TITLE=${title}`);
    console.log(`STATUS=${response.status}`);

    const data = await response.json().catch(() => ({}));
    console.log(`PAGE=${data.title ?? ''}`);
    console.log(`IMAGE=${data.originalimage?.source ?? data.thumbnail?.source ?? ''}`);
    console.log(`TYPE=${data.type ?? ''}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
