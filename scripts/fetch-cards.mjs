// Fetches every card / evolution / hero / tower troop from the API and writes:
//   data/cards.json            normalized card data (committed, used by the site)
//   design-kit/cards.md        readable card reference for designers
//   design-kit/cards.csv       same data as a spreadsheet
//   design-kit/images/...      card art (normal / evolution / hero / tower troops)
// Usage: node scripts/fetch-cards.mjs [--no-images]
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
const withImages = !process.argv.includes('--no-images');

const res = await fetch(`${base}/cards`, { headers: { Authorization: `Bearer ${env.CR_API_KEY}` } });
if (!res.ok) throw new Error(`/cards -> ${res.status} ${await res.text()}`);
const { items, supportItems } = await res.json();

// Card id prefix tells the type: 26 = troop, 27 = building, 28 = spell
const TYPES = { 26: 'Troop', 27: 'Building', 28: 'Spell' };
const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary', 'champion'];
const slug = (s) => s.toLowerCase().replace(/\./g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const cards = items
  .map((c) => ({
    id: c.id,
    name: c.name,
    slug: slug(c.name),
    type: TYPES[String(c.id).slice(0, 2)] ?? 'Unknown',
    rarity: c.rarity,
    elixir: c.elixirCost ?? null,
    maxLevel: c.maxLevel,
    // maxEvolutionLevel: 1 = evolution, 2 = hero, 3 = both
    hasEvolution: c.maxEvolutionLevel === 1 || c.maxEvolutionLevel === 3,
    hasHero: c.maxEvolutionLevel === 2 || c.maxEvolutionLevel === 3,
    icons: {
      normal: c.iconUrls?.medium ?? null,
      evolution: c.iconUrls?.evolutionMedium ?? null,
      hero: c.iconUrls?.heroMedium ?? null,
    },
  }))
  .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || (a.elixir ?? 99) - (b.elixir ?? 99) || a.name.localeCompare(b.name));

const towerTroops = supportItems.map((c) => ({
  id: c.id,
  name: c.name,
  slug: slug(c.name),
  rarity: c.rarity,
  maxLevel: c.maxLevel,
  icon: c.iconUrls?.medium ?? null,
}));

const fetchedAt = new Date().toISOString();
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'cards.json'), JSON.stringify({ fetchedAt, cards, towerTroops }, null, 2) + '\n');

// ---- Design kit ----
const kit = path.join(root, 'design-kit');
fs.mkdirSync(kit, { recursive: true });

const csvRow = (vals) => vals.map((v) => (v == null ? '' : /[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(',');
fs.writeFileSync(
  path.join(kit, 'cards.csv'),
  [
    csvRow(['name', 'type', 'rarity', 'elixir', 'max_level', 'has_evolution', 'has_hero', 'image', 'evolution_image', 'hero_image']),
    ...cards.map((c) => csvRow([c.name, c.type, cap(c.rarity), c.elixir, c.maxLevel, c.hasEvolution, c.hasHero, c.icons.normal, c.icons.evolution, c.icons.hero])),
    ...towerTroops.map((t) => csvRow([t.name, 'Tower Troop', cap(t.rarity), '', t.maxLevel, false, false, t.icon, '', ''])),
  ].join('\n') + '\n',
);

const count = (f) => cards.filter(f).length;
const table = (list) =>
  ['| Card | Type | Elixir | Evo | Hero |', '|---|---|---|---|---|', ...list.map((c) => `| ${c.name} | ${c.type} | ${c.elixir ?? '—'} | ${c.hasEvolution ? '✅' : ''} | ${c.hasHero ? '✅' : ''} |`)].join('\n');

const md = [
  '# Clash Royale card reference',
  '',
  `Pulled from the official Clash Royale API on ${fetchedAt.slice(0, 10)}.`,
  '',
  `**${cards.length} cards** (${count((c) => c.type === 'Troop')} troops, ${count((c) => c.type === 'Building')} buildings, ${count((c) => c.type === 'Spell')} spells), ` +
    `**${count((c) => c.hasEvolution)} evolutions**, **${count((c) => c.hasHero)} heroes**, **${towerTroops.length} tower troops**.`,
  '',
  '## Rules for the UI',
  '',
  '- Rarities: Common, Rare, Epic, Legendary, Champion. Each has its own frame colour.',
  '- In-game, every card levels up to **16**. The API reports levels on an older per-rarity scale, so the site adds an offset: Common +0 (max 16), Rare +2 (max 14→16), Epic +5 (max 11→16), Legendary +8 (max 8→16), Champion +10 (max 6→16). Always display the in-game level.',
  '- A card can have an **Evolution** (alternate art, purple/magenta frame), a **Hero** (alternate art, gold frame), or **both** (Knight, Valkyrie, Musketeer, Wizard).',
  '- A deck is 8 cards + 1 tower troop. Average elixir is shown to 1 decimal place.',
  '- Elixir "—" means variable cost (e.g. Mirror = last card played +1).',
  '- Images are in `images/cards`, `images/evolutions`, `images/heroes` and `images/tower-troops`, named by card slug (e.g. `mini-pekka.png`).',
  '',
  ...RARITY_ORDER.flatMap((r) => [`## ${cap(r)} (${count((c) => c.rarity === r)})`, '', table(cards.filter((c) => c.rarity === r)), '']),
  '## Evolutions',
  '',
  cards.filter((c) => c.hasEvolution).map((c) => c.name).join(', '),
  '',
  '## Heroes',
  '',
  cards.filter((c) => c.hasHero).map((c) => c.name).join(', '),
  '',
  '## Tower troops',
  '',
  '| Tower troop | Rarity |',
  '|---|---|',
  ...towerTroops.map((t) => `| ${t.name} | ${cap(t.rarity)} |`),
  '',
].join('\n');
fs.writeFileSync(path.join(kit, 'cards.md'), md);

console.log(`${cards.length} cards, ${count((c) => c.hasEvolution)} evolutions, ${count((c) => c.hasHero)} heroes, ${towerTroops.length} tower troops`);

if (withImages) {
  const jobs = [
    ...cards.map((c) => ['cards', c.slug, c.icons.normal]),
    ...cards.filter((c) => c.hasEvolution).map((c) => ['evolutions', c.slug, c.icons.evolution]),
    ...cards.filter((c) => c.hasHero).map((c) => ['heroes', c.slug, c.icons.hero]),
    ...towerTroops.map((t) => ['tower-troops', t.slug, t.icon]),
  ].filter(([, , url]) => url);
  let done = 0;
  const failed = [];
  for (let i = 0; i < jobs.length; i += 10) {
    await Promise.all(
      jobs.slice(i, i + 10).map(async ([dir, name, url]) => {
        const r = await fetch(url);
        // Some brand-new evolutions/heroes are listed before their art is published
        if (!r.ok) return failed.push(`${dir}/${name} (${r.status})`);
        fs.mkdirSync(path.join(kit, 'images', dir), { recursive: true });
        fs.writeFileSync(path.join(kit, 'images', dir, `${name}.png`), Buffer.from(await r.arrayBuffer()));
        done++;
      }),
    );
  }
  console.log(`downloaded ${done}/${jobs.length} images${failed.length ? `; failed: ${failed.join(', ')}` : ''}`);
}
