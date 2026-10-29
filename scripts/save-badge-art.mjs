// Saves our own small copy of every player badge level we can find, slowly, so neither the
// Clash Royale API nor Supercell's image server ever throttles us. Run it as often as you like;
// each run picks up where the last one stopped:
//   node scripts/save-badge-art.mjs                  look up 300 new players, save up to 400 copies
//   node scripts/save-badge-art.mjs --players 0      only save copies of links we already know
//   node scripts/save-badge-art.mjs --players 1000 --max 2000 --gap 1200
//
// Badge art has no predictable address: the API only hands out the image of the level a player
// owns, so links come from looking players up (one at a time, top players and their clans first)
// and from the levels the site recorded on profile views (/api/badge-art on SITE_URL, which needs
// that site's CRON_SECRET; skipped when it can't be read).
//
// Copies are 192 px WebP (about 8 KB; the official PNG is about 240 KB and the site draws badges at
// 92 px) in public/player-badges/<Name>_L<level>.webp, and data/player-badges.json lists them for
// the site. Progress (links found, players looked up, links that failed) is kept in
// .cache/badge-art.json. Commit the new copies and the manifest.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const sharp = createRequire(path.join(root, 'package.json'))('sharp');
const env = fs.existsSync(path.join(root, '.env'))
  ? Object.fromEntries(
      fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
    )
  : {};
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const PLAYERS = arg('players', 300); // new players to look up this run
const MAX = arg('max', 400); // copies to save this run
const GAP = arg('gap', 1500); // ms between image downloads
const API_GAP = arg('api-gap', 700); // ms between API calls
const BASE = process.env.CR_API_BASE || env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const KEY = process.env.CR_API_KEY || env.CR_API_KEY;
const SITE = process.env.SITE_URL || env.SITE_URL || 'http://localhost:3000';
const SECRET = process.env.CRON_SECRET || env.CRON_SECRET;

const DIR = path.join(root, 'public/player-badges');
const MANIFEST = path.join(root, 'data/player-badges.json');
const STATE = path.join(root, '.cache/badge-art.json');
fs.mkdirSync(DIR, { recursive: true });
fs.mkdirSync(path.dirname(STATE), { recursive: true });

/** urls: name -> level -> official link; crawled: player tags looked up; failed: link -> tries. */
const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { urls: {}, crawled: [], failed: {} };
const crawled = new Set(state.crawled);
const saveState = () => fs.writeFileSync(STATE, JSON.stringify({ ...state, crawled: [...crawled] }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** A little randomness so requests never fall into a fixed rhythm. */
const pause = (ms) => sleep(ms * (0.8 + Math.random() * 0.4));
// Only official art, and only names that are safe as file names.
const official = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' && x.hostname === 'api-assets.clashroyale.com';
  } catch {
    return false;
  }
};
const safeName = (n) => typeof n === 'string' && /^[A-Za-z0-9_]+$/.test(n);
const fileOf = (name, level) => path.join(DIR, `${name}_L${level}.webp`);
let found = 0;
function learn(name, level, url) {
  if (!safeName(name) || !Number.isInteger(level) || level < 0 || !official(url)) return;
  const levels = (state.urls[name] ??= {});
  if (!levels[level]) found++;
  levels[level] = url;
}

/**
 * One request with backoff: 429 and 5xx answers wait (Retry-After when given, else 30 s, 60 s,
 * 120 s…) and try again, up to `tries` times. Returns the response, or null.
 */
async function politeFetch(url, init, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) }).catch(() => null);
    if (r && r.status !== 429 && r.status < 500) return r;
    const wait = Number(r?.headers.get('retry-after')) * 1000 || 30_000 * 2 ** i;
    console.log(`[badges] ${r ? r.status : 'no answer'} from ${new URL(url).host}, waiting ${Math.round(wait / 1000)} s`);
    await sleep(wait);
  }
  return null;
}

async function api(p) {
  await pause(API_GAP);
  const r = await politeFetch(BASE + p, { headers: { Authorization: `Bearer ${KEY}` } });
  return r?.ok ? r.json() : null;
}
const enc = (t) => encodeURIComponent(`#${t.replace('#', '')}`);

// ---------- 0. Older copies (PNG, or named without a level) become 192 px WebP ----------
for (const f of fs.readdirSync(DIR)) {
  const m = /^([A-Za-z0-9_]+?)(?:_L(\d+))?\.png$/.exec(f);
  if (!m) continue;
  const out = fileOf(m[1], Number(m[2] ?? 1));
  if (!fs.existsSync(out)) await sharp(path.join(DIR, f)).resize(192, 192, { fit: 'inside' }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out);
  fs.rmSync(path.join(DIR, f));
  console.log(`[badges] converted ${f}`);
}

// ---------- 1. Links the site recorded from profile views ----------
const recorded = await fetch(`${SITE}/api/badge-art`, { headers: SECRET ? { Authorization: `Bearer ${SECRET}` } : {}, signal: AbortSignal.timeout(20_000) })
  .then((r) => (r.ok ? r.json() : null))
  .catch(() => null);
if (recorded) for (const r of recorded.rows ?? []) learn(r.name, r.level, r.url);
console.log(recorded ? `[badges] ${recorded.count} levels recorded by ${SITE}` : `[badges] couldn't read ${SITE}/api/badge-art (site not running, or a different CRON_SECRET); looking players up only`);

// ---------- 2. Look players up, one at a time ----------
if (PLAYERS > 0 && !KEY) console.warn('[badges] no CR_API_KEY in .env, so no players are looked up');
if (PLAYERS > 0 && KEY) {
  // Top players first (they hold the rarest badges), then members of top clans around the world.
  const queue = [];
  const add = (t) => t && !crawled.has(t) && !queue.includes(t) && queue.push(t);
  (await api('/locations/global/pathoflegend/players?limit=1000'))?.items?.forEach((p) => add(p.tag));
  if (queue.length < PLAYERS) {
    const locs = ((await api('/locations?limit=300'))?.items ?? []).filter((l) => l.isCountry).sort(() => Math.random() - 0.5);
    for (const loc of ['global', ...locs.map((l) => l.id)]) {
      if (queue.length >= PLAYERS) break;
      for (const c of (await api(`/locations/${loc}/rankings/clanwars?limit=10`))?.items ?? []) {
        if (queue.length >= PLAYERS) break;
        (await api(`/clans/${enc(c.tag)}`))?.memberList?.forEach((m) => add(m.tag));
      }
    }
  }
  const todo = queue.slice(0, PLAYERS);
  console.log(`[badges] looking up ${todo.length} players (${crawled.size} done in earlier runs)…`);
  let n = 0;
  for (const t of todo) {
    const p = await api(`/players/${enc(t)}`);
    crawled.add(t);
    for (const b of p?.badges ?? []) learn(b.name, b.level ?? 1, b.iconUrls?.large);
    if (++n % 50 === 0) {
      saveState();
      console.log(`[badges] ${n}/${todo.length} players, ${found} new badge levels found`);
    }
  }
  saveState();
}

// ---------- 3. Download what we don't have yet, one at a time ----------
const want = Object.entries(state.urls)
  .flatMap(([name, levels]) => Object.entries(levels).map(([level, url]) => ({ name, level: Number(level), url })))
  .filter((x) => !fs.existsSync(fileOf(x.name, x.level)) && (state.failed[x.url] ?? 0) < 3);
const known = Object.values(state.urls).reduce((n, l) => n + Object.keys(l).length, 0);
console.log(`[badges] ${known} badge levels known, ${known - want.length} saved or given up on, ${want.length} to download (up to ${MAX} this run)`);

function writeManifest() {
  const list = {};
  for (const f of fs.readdirSync(DIR)) {
    const m = /^([A-Za-z0-9_]+)_L(\d+)\.webp$/.exec(f);
    if (m) (list[m[1]] ??= []).push(Number(m[2]));
  }
  const sorted = Object.fromEntries(Object.keys(list).sort().map((k) => [k, list[k].sort((a, b) => a - b)]));
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted) + '\n');
  return Object.values(sorted).reduce((n, l) => n + l.length, 0);
}

let saved = 0;
for (const x of want.slice(0, MAX)) {
  await pause(GAP);
  const r = await politeFetch(x.url);
  const buf = r?.ok ? Buffer.from(await r.arrayBuffer()) : null;
  if (!buf) {
    state.failed[x.url] = (state.failed[x.url] ?? 0) + 1;
    console.log(`[badges] ${x.name} level ${x.level}: ${r ? r.status : 'no answer'} (try ${state.failed[x.url]} of 3)`);
    continue;
  }
  await sharp(buf).resize(192, 192, { fit: 'inside' }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(fileOf(x.name, x.level));
  if (++saved % 25 === 0) {
    writeManifest();
    saveState();
    console.log(`[badges] saved ${saved}…`);
  }
}
saveState();
const total = writeManifest();
console.log(`[badges] saved ${saved} new copies; ${total} badge levels on disk, listed in data/player-badges.json`);
