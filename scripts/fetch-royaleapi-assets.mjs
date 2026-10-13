// Pulls game art from RoyaleAPI/cr-api-assets and lookup tables from RoyaleAPI/cr-api-data
// into vendor/ (gitignored), then copies a curated set into design-kit/royaleapi/.
// RoyaleAPI asks people to clone the repo rather than hotlink it as a CDN, so we sparse-clone.
// Usage: node scripts/fetch-royaleapi-assets.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const vendor = path.join(root, 'vendor');
const assetsDir = path.join(vendor, 'cr-api-assets');
const dataDir = path.join(vendor, 'cr-api-data');
const kitDir = path.join(root, 'design-kit', 'royaleapi');

// Image folders worth having (skips music/sfx and the duplicate low-res/png8 card sets)
const FOLDERS = ['cards', 'cards-gold', 'chr', 'chr_champions', 'arenas', 'badges', 'chests', 'trade-tokens', 'ui'];

// Lookup tables: clan badge id -> image name, arena/league ids, battle game mode names, rarities, card descriptions
const DATA_FILES = ['alliance_badges', 'arenas', 'game_modes', 'rarities', 'cards', 'emotes'];

const git = (args, cwd = root) => execFileSync('git', args, { cwd, stdio: 'inherit' });

fs.mkdirSync(vendor, { recursive: true });
if (fs.existsSync(path.join(assetsDir, '.git'))) {
  git(['sparse-checkout', 'set', ...FOLDERS], assetsDir);
  git(['pull', '--depth', '1', '--quiet'], assetsDir);
} else {
  git(['clone', '--depth', '1', '--filter=blob:none', '--sparse', '--quiet', 'https://github.com/RoyaleAPI/cr-api-assets.git', assetsDir]);
  git(['sparse-checkout', 'set', ...FOLDERS], assetsDir);
}

fs.mkdirSync(dataDir, { recursive: true });
for (const name of DATA_FILES) {
  const res = await fetch(`https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/master/docs/json/${name}.json`);
  if (!res.ok) throw new Error(`${name}.json -> ${res.status}`);
  fs.writeFileSync(path.join(dataDir, `${name}.json`), await res.text());
}

// ---- Design kit copy ----
fs.rmSync(kitDir, { recursive: true, force: true });
const copyDir = (from, to, filter = () => true) => {
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(from)) {
    if (!f.endsWith('.png') || !filter(f)) continue;
    fs.copyFileSync(path.join(from, f), path.join(to, f));
    n++;
  }
  return n;
};
const counts = {
  'cards (incl. -ev1 evolution, -hero, -hero-ev1 variants)': copyDir(path.join(assetsDir, 'cards'), path.join(kitDir, 'cards'), (f) => !f.startsWith('_')),
  // `_dl` files are alternate exports; keep them only when there's no plain version
  'characters (transparent troop renders)': copyDir(path.join(assetsDir, 'chr'), path.join(kitDir, 'characters'), (f) =>
    !f.endsWith('_dl.png') || !fs.existsSync(path.join(assetsDir, 'chr', f.replace('_dl.png', '.png')))),
  'champions (hi-res renders)': copyDir(path.join(assetsDir, 'chr_champions'), path.join(kitDir, 'characters')),
  'arenas': copyDir(path.join(assetsDir, 'arenas'), path.join(kitDir, 'arenas'), (f) => f.startsWith('arena') || f === 'legendary.png'),
  'path-of-legends leagues': copyDir(path.join(assetsDir, 'arenas'), path.join(kitDir, 'leagues'), (f) => f.startsWith('league')),
  'clan badges': copyDir(path.join(assetsDir, 'badges'), path.join(kitDir, 'clan-badges')),
  'chests': copyDir(path.join(assetsDir, 'chests'), path.join(kitDir, 'chests')),
  'trade tokens': copyDir(path.join(assetsDir, 'trade-tokens'), path.join(kitDir, 'misc')),
  'ui': copyDir(path.join(assetsDir, 'ui'), path.join(kitDir, 'misc')),
};

// Clan badge lookup the site can use: API badgeId -> image file
const badges = JSON.parse(fs.readFileSync(path.join(dataDir, 'alliance_badges.json'), 'utf8'));
fs.writeFileSync(
  path.join(root, 'data', 'clan-badges.json'),
  JSON.stringify(Object.fromEntries(badges.map((b) => [b.id, `${b.name}.png`])), null, 2) + '\n',
);

for (const [k, v] of Object.entries(counts)) console.log(`${String(v).padStart(4)}  ${k}`);
console.log(`lookup data: ${DATA_FILES.join(', ')} -> vendor/cr-api-data`);
