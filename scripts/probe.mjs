// Quick API sanity check: `node scripts/probe.mjs [#PLAYERTAG]`
// Reads CR_API_KEY / CR_API_BASE from .env and saves raw responses to .cache/ (gitignored).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const base = env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const cacheDir = path.join(root, '.cache');
fs.mkdirSync(cacheDir, { recursive: true });

async function get(endpoint, name) {
  const res = await fetch(base + endpoint, { headers: { Authorization: `Bearer ${env.CR_API_KEY}` } });
  const body = await res.text();
  fs.writeFileSync(path.join(cacheDir, `${name}.json`), body);
  console.log(`${res.status}  ${endpoint}`);
  return res.ok ? JSON.parse(body) : null;
}

const enc = (tag) => encodeURIComponent(tag.startsWith('#') ? tag : `#${tag}`);

const cards = await get('/cards', 'cards');
console.log(`  ${cards?.items.length} cards, ${cards?.supportItems.length} tower troops`);

let tag = process.argv[2];
if (!tag) {
  const top = await get('/locations/global/pathoflegend/players?limit=1', 'pol-top');
  tag = top.items[0].tag;
}
const player = await get(`/players/${enc(tag)}`, 'player');
if (!player) process.exit(1);
console.log(`  ${player.name} (${player.tag}) — clan: ${player.clan?.name ?? 'none'}`);
await get(`/players/${enc(tag)}/battlelog`, 'battlelog');

if (player.clan) {
  const ct = enc(player.clan.tag);
  await get(`/clans/${ct}`, 'clan');
  await get(`/clans/${ct}/currentriverrace`, 'currentriverrace');
  await get(`/clans/${ct}/riverracelog`, 'riverracelog');
}
