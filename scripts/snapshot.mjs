/**
 * ABOUTME: Copies DevTune's published AI search ranking data files into this
 * repository: the index at verticals/data.json and each category's file at
 * verticals/<slug>/data.json, mirroring the paths on devtune.ai. Categories
 * no longer published are removed, so the tree always matches the index.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const INDEX_URL = 'https://devtune.ai/verticals/data.json';
const ROOT = 'verticals';
const HEADERS = {
  accept: 'application/json',
  'user-agent': 'ai-visibility-data-snapshot (+https://github.com/devtunehq/ai-visibility-data)',
};

async function fetchJson(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

const index = await fetchJson(INDEX_URL);
if (!Array.isArray(index.verticals) || index.verticals.length === 0) {
  throw new Error('The index lists no verticals; refusing to empty the archive.');
}

// One request at a time: the job runs weekly, so speed doesn't matter and the
// site's rate limits stay out of the way.
const files = [];
for (const vertical of index.verticals) {
  files.push([vertical.slug, await fetchJson(vertical.dataUrl)]);
}

await mkdir(ROOT, { recursive: true });
const published = new Set(files.map(([slug]) => slug));
for (const entry of await readdir(ROOT, { withFileTypes: true })) {
  if (entry.isDirectory() && !published.has(entry.name)) {
    await rm(join(ROOT, entry.name), { recursive: true });
  }
}

await writeJson(join(ROOT, 'data.json'), index);
for (const [slug, file] of files) {
  await mkdir(join(ROOT, slug), { recursive: true });
  await writeJson(join(ROOT, slug, 'data.json'), file);
}

console.log(`Wrote the index and ${files.length} category files.`);
