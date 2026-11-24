/**
 * ABOUTME: One-off backfill of past weeks. For one Monday (YYYY-MM-DD), copies
 * every published vertical's data file as of that day from
 * devtune.ai/verticals/<slug>/data/<date>.json into verticals/<slug>/data.json,
 * and writes an index of the files it found. Files for past days are
 * recomputed from stored runs and carry `asOf`; a vertical with no file for
 * the day (404), or with fewer platforms than it publishes today, is left out
 * of that week.
 *
 * Usage: node scripts/backfill.mjs 2026-06-01
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://devtune.ai';
const ROOT = 'verticals';
const HEADERS = {
  accept: 'application/json',
  'user-agent': 'ai-visibility-data-backfill (+https://github.com/devtunehq/ai-visibility-data)',
};

const day = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(day ?? '') || new Date(`${day}T00:00:00Z`).getUTCDay() !== 1) {
  throw new Error('Pass a Monday as YYYY-MM-DD.');
}

async function fetchJson(url, { allowMissing = false } = {}) {
  const response = await fetch(url, { headers: HEADERS });
  if (allowMissing && response.status === 404) return null;
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

const writeJson = (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);

// Today's index names the verticals; each one's past file decides whether it
// existed that week. One request at a time keeps the site's limits out of the way.
// A past week whose runs have partly expired comes back with fewer platforms
// than the vertical publishes today; it's left out rather than archived with
// rates over a different set of platforms.
const index = await fetchJson(`${SITE}/verticals/data.json`);
const files = [];
const partial = [];
for (const vertical of index.verticals) {
  const live = await fetchJson(vertical.dataUrl);
  const file = await fetchJson(
    `${SITE}/verticals/${vertical.slug}/data/${day}.json`,
    { allowMissing: true },
  );
  if (
    file &&
    file.asOf === day &&
    file.platforms.length > 0 &&
    file.platforms.length >= live.platforms.length
  ) {
    files.push(file);
  } else if (file) {
    partial.push(`${vertical.slug} (${file.platforms.map((p) => p.id).join(', ')})`);
  }
}

await rm(ROOT, { recursive: true, force: true });
await mkdir(ROOT, { recursive: true });
for (const file of files) {
  await mkdir(join(ROOT, file.vertical.slug), { recursive: true });
  await writeJson(join(ROOT, file.vertical.slug, 'data.json'), file);
}
await writeJson(join(ROOT, 'data.json'), {
  ...index,
  verticals: files.map((file) => ({
    slug: file.vertical.slug,
    name: file.vertical.name,
    url: file.vertical.url,
    dataUrl: `${SITE}/verticals/${file.vertical.slug}/data/${day}.json`,
    dataWindow: file.dataWindow,
    generatedAt: file.generatedAt,
  })),
  asOf: day,
});

console.log(
  `${day}: ${files.length} of ${index.verticals.length} verticals.` +
    (partial.length ? ` Left out with fewer platforms: ${partial.join('; ')}` : ''),
);
