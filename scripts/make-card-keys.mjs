// Builds data/card-keys.json (game-internal card names -> our slugs, for mastery badges) and
// data/upgrades.json (cards and gold per level, by rarity) from vendor/cr-api-data.
// Run after `node scripts/fetch-royaleapi-assets.mjs`.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const ours = read('data/cards.json').cards;
const bySlug = new Map(ours.map((c) => [c.slug, c]));
const byId = new Map(ours.map((c) => [c.id, c]));

const keys = {};
for (const c of read('vendor/cr-api-data/cards.json')) {
  const o = byId.get(c.id) ?? bySlug.get(c.key);
  if (o && c.sc_key) keys[c.sc_key.replace(/\s+/g, '')] = o.slug;
}
// Cards newer than cr-api-data, or whose internal name differs a lot from the display name.
const manual = {
  GiantBuffer: 'rune-giant', MergeMaiden: 'spirit-empress', DarkMagic: 'void', Elixir: 'elixir-collector', ElixirCollector: 'elixir-collector',
  BossBandit: 'boss-bandit', Goblinstein: 'goblinstein', Berserker: 'berserker', Vines: 'vines', Ronin: 'ronin', SuspiciousBush: 'suspicious-bush',
  GoblinMachine: 'goblin-machine', GoblinDemolisher: 'goblin-demolisher', GoblinCurse: 'goblin-curse', LittlePrince: 'little-prince',
};
for (const [k, slug] of Object.entries(manual)) if (bySlug.has(slug)) keys[k] = slug;
fs.writeFileSync(path.join(root, 'data/card-keys.json'), JSON.stringify(keys, null, 1) + '\n');

const upgrades = {};
for (const r of read('vendor/cr-api-data/rarities.json')) {
  upgrades[r.name.toLowerCase()] = { cards: r.upgrade_material_count, gold: r.upgrade_cost, levels: r.level_count, offset: r.relative_level };
}
// Levels 11–16 changed in the November 2025 update (Elite Wild Cards removed, level 16 added).
// Copies and gold needed to reach each level; gold is the same for every rarity.
// Checks out: a maxed common has collected 23,086 copies, as RoyaleAPI shows.
upgrades.modern = {
  gold: { 11: 15000, 12: 25000, 13: 40000, 14: 60000, 15: 90000, 16: 120000 },
  cards: {
    common: { 11: 1000, 12: 1500, 13: 2500, 14: 3500, 15: 5500, 16: 7500 },
    rare: { 11: 300, 12: 400, 13: 550, 14: 750, 15: 1000, 16: 1400 },
    epic: { 11: 30, 12: 50, 13: 70, 14: 100, 15: 130, 16: 180 },
    legendary: { 11: 4, 12: 6, 13: 9, 14: 12, 15: 14, 16: 20 },
    champion: { 11: 1, 12: 2, 13: 5, 14: 8, 15: 11, 16: 15 },
  },
};
fs.writeFileSync(path.join(root, 'data/upgrades.json'), JSON.stringify(upgrades, null, 1) + '\n');
console.log(Object.keys(keys).length, 'card keys;', Object.keys(upgrades).join(', '));
