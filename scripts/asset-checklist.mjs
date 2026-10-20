// Builds docs/asset-checklist.md (+ .csv): every Clash Royale asset we know of, and whether the site
// already has its art. Re-run each season, as new badges, arenas and modes appear:
//   node scripts/asset-checklist.mjs            (samples ~3,000 players; takes a few minutes)
//   node scripts/asset-checklist.mjs --cached   (reuses the last sample)
//
// Sources: the official API (badges and their per-level art from a broad sample of real players,
// cards, arenas players are in), RoyaleAPI/cr-api-data (emotes, magic items, chests, game modes,
// arenas, clan badges; last updated 2023, so newer items only show up via the API sample), and the
// art already on disk. Everything the API and the data can't list is in MANUAL below.
//
// Badge levels the site has recorded from real profile views come from /api/badge-art on the
// running site (SITE_URL, default http://localhost:3000); any we still need are saved as copies
// in public/player-badges. Commit those so the site can fall back to them.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const cacheFile = path.join(os.tmpdir(), 'cr-asset-sample.json');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const BASE = process.env.CR_API_BASE || env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const KEY = process.env.CR_API_KEY || env.CR_API_KEY;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(p) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(BASE + p, { headers: { Authorization: `Bearer ${KEY}` } }).catch(() => null);
    if (r?.ok) return r.json();
    if (r?.status === 404) return null;
    await sleep(1500);
  }
  return null;
}
const enc = (t) => encodeURIComponent(`#${t.replace('#', '')}`);
async function pool(items, n, fn) {
  const q = [...items];
  await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.pop()); }));
}
const data = async (name) => (await fetch(`https://raw.githubusercontent.com/RoyaleAPI/cr-api-data/master/docs/json/${name}.json`)).json();

// ---------- 1. Sample real players ----------
async function sample() {
  const tags = new Set();
  (await api('/locations/global/pathoflegend/players?limit=300'))?.items.forEach((p) => tags.add(p.tag));
  const locs = (await api('/locations?limit=300'))?.items.filter((l) => l.isCountry) ?? [];
  const clans = new Set();
  for (const loc of ['global', ...locs.slice(0, 25).map((l) => l.id)])
    for (const kind of ['clanwars', 'clans']) (await api(`/locations/${loc}/rankings/${kind}?limit=${loc === 'global' ? 15 : 3}`))?.items.forEach((c) => clans.add(c.tag));
  for (const name of ['royale', 'legends', 'kings', 'family', 'chill', 'war', 'elite', 'casual'])
    (await api(`/clans?name=${name}&minMembers=40&limit=4`))?.items.forEach((c) => clans.add(c.tag));
  await pool(clans, 6, async (ct) => (await api(`/clans/${enc(ct)}`))?.memberList.forEach((m, i) => i % 3 === 0 && tags.add(m.tag)));
  console.log(`[assets] sampling ${tags.size} players from ${clans.size} clans…`);

  const badges = {};
  const arenas = {};
  let n = 0;
  await pool(tags, 10, async (t) => {
    const p = await api(`/players/${enc(t)}`);
    if (!p) return;
    n++;
    for (const b of p.badges ?? []) {
      const e = (badges[b.name] ??= { maxLevel: b.maxLevel ?? 1, owners: 0, levels: {} });
      e.owners++;
      if (b.iconUrls?.large) e.levels[b.level ?? 1] ??= b.iconUrls.large;
    }
    if (p.arena) arenas[p.arena.id] = p.arena.name;
    for (const v of Object.values(p.progress ?? {})) if (v.arena) arenas[v.arena.id] = v.arena.name;
  });
  const s = { players: n, clans: clans.size, badges, arenas, cards: await api('/cards'), at: new Date().toISOString() };
  fs.writeFileSync(cacheFile, JSON.stringify(s));
  return s;
}
const S = process.argv.includes('--cached') && fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : await sample();

// Badge levels the site has recorded from real profile views (/api/badge-art). The site has to
// be running; SITE_URL points at a deployed one instead of the local dev server.
const SITE = process.env.SITE_URL || env.SITE_URL || 'http://localhost:3000';
const recorded = await fetch(`${SITE}/api/badge-art`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
if (!recorded) console.warn(`[assets] couldn't read recorded badge art from ${SITE}/api/badge-art (is the site running?)`);
const seenLevels = {}; // name -> level -> url, from profile views
// Only official art: the record comes over the network, so never fetch anything else from it.
const official = (u) => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname === 'api-assets.clashroyale.com'; } catch { return false; } };
for (const r of (recorded?.rows ?? []).filter((r) => official(r.url) && /^[A-Za-z0-9_]+$/.test(r.name) && Number.isInteger(r.level))) {
  (seenLevels[r.name] ??= {})[r.level] = r.url;
  const b = (S.badges[r.name] ??= { maxLevel: r.maxLevel ?? 1, owners: 0, levels: {} });
  b.maxLevel = Math.max(b.maxLevel, r.maxLevel ?? 1, r.level);
}

// Which badge-level images actually load (the CDN has dropped some).
const urls = [...new Set([...Object.values(S.badges).flatMap((b) => Object.values(b.levels)), ...Object.values(seenLevels).flatMap((l) => Object.values(l))])];
const live = new Set();
await pool(urls, 16, async (u) => { const r = await fetch(u, { method: 'HEAD' }).catch(() => null); if (r?.ok) live.add(u); });
console.log(`[assets] ${S.players} players, ${Object.keys(S.badges).length} badges, ${live.size}/${urls.length} badge images load, ${recorded?.count ?? 0} levels recorded by the site`);

// Save a copy of every badge level we still need that a visitor's profile has shown us. Copies
// are shrunk to 256 px (the site draws badges at 92 px) so the repo stays small; the Badges tab
// falls back to them whenever Supercell's server doesn't load an image.
const { createRequire } = await import('node:module');
const sharp = createRequire(path.join(root, 'package.json'))('sharp');
const badgeFile = (name, max, level) => `public/player-badges/${max > 1 ? `${name}_L${level}` : name}.png`;
fs.mkdirSync(path.join(root, 'public/player-badges'), { recursive: true });
let saved = 0;
await pool(
  Object.entries(seenLevels).flatMap(([name, levels]) => Object.entries(levels).map(([level, url]) => ({ name, level: +level, url }))),
  6,
  async ({ name, level, url }) => {
    const b = S.badges[name];
    const fromSample = b.levels[level] && live.has(b.levels[level]);
    const file = path.join(root, badgeFile(name, b.maxLevel, level));
    if (fromSample || fs.existsSync(file) || !live.has(url)) return;
    const img = await fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
    if (!img) return;
    await sharp(Buffer.from(img)).resize(256, 256, { fit: 'inside' }).png({ palette: true, quality: 90 }).toFile(file);
    saved++;
  },
);
if (saved) console.log(`[assets] saved ${saved} new badge copies to public/player-badges`);
// The Badges tab only tries copies listed here, so it never requests one that isn't there.
fs.writeFileSync(
  path.join(root, 'data/player-badges.json'),
  JSON.stringify(fs.readdirSync(path.join(root, 'public/player-badges')).filter((f) => f.endsWith('.png')).sort(), null, 1) + '\n',
);

const [emotes, consumables, gameModes, arenaData, clanBadges] = await Promise.all(
  ['emotes', 'consumables', 'game_modes', 'arenas', 'alliance_badges'].map(data),
);
const onDisk = (rel) => fs.existsSync(path.join(root, rel));

// ---------- 2. Build the rows ----------
const rows = []; // CSV: category, name, detail, status, save as
const add = (category, name, detail, have, saveAs) => rows.push({ category, name, detail, have, saveAs });
const md = [];
const h = (s) => md.push('', s, '');
const table = (head, body) => {
  md.push(`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`);
  for (const r of body) md.push(`| ${r.map((c) => String(c ?? '').replace(/\|/g, '/')).join(' | ')} |`);
};
const tick = (have) => (have ? '✅' : '⬜');

// Badges
const badgeGroup = (n) =>
  n.startsWith('Mastery') ? 'Card mastery' :
  /^SeasonalBadge|YearBadge$/.test(n) ? 'Seasonal & yearly' :
  /^Crl|Supercell|Creator/.test(n) ? 'Esports & special' :
  /^(YearsPlayed|BattleWins|ClanWarsVeteran|ClanWarWins|ClanDonations|Classic12Wins|Grand12Wins|EmoteCollection|BannerCollection|CollectionLevel|Draft|SuddenDeath|RampUp|2xElixir|2v2)$/.test(n) ? 'Achievements & milestones' :
  'Events, leagues & tournaments';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (n) => {
  const season = /^SeasonalBadge_(\d{4})(\d{2})/.exec(n);
  if (season) return `Season ${MON[+season[2] - 1]} ${season[1]}`;
  return n
    .replace(/^Mastery/, 'Mastery: ')
    .replace(/_v\d+$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z]{2,})(\d)/g, '$1 $2')
    .replace(/(\d)([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
};
const badgeRows = {};
for (const [name, b] of Object.entries(S.badges).sort(([a], [c]) => a.localeCompare(c))) {
  const levels = Array.from({ length: Math.max(1, b.maxLevel) }, (_, i) => i + 1);
  // Have: the official image loads (from the sample), or we've saved a copy.
  const have = levels.filter((l) => (b.levels[l] && live.has(b.levels[l])) || onDisk(badgeFile(name, b.maxLevel, l)));
  const need = levels.filter((l) => !have.includes(l));
  const file = b.maxLevel > 1 ? `public/player-badges/${name}_L<level>.png` : `public/player-badges/${name}.png`;
  (badgeRows[badgeGroup(name)] ??= []).push([label(name), `\`${name}\``, b.maxLevel > 1 ? b.maxLevel : 1, have.join(', ') || '—', need.join(', ') || '—', need.length ? `\`${file}\`` : 'all set']);
  for (const l of levels) add('Player badge', label(name), b.maxLevel > 1 ? `level ${l}` : '', have.includes(l), b.maxLevel > 1 ? `public/player-badges/${name}_L${l}.png` : `public/player-badges/${name}.png`);
}

// Emotes (2023 data: newer emotes aren't listed anywhere public)
const packOf = (e) => (e.sc_file ?? '').replace(/^sc\/|\.sc$/g, '').replace(/^emotes_/, '').replace(/_dl$/, '');
const emoteRows = emotes.map((e) => {
  const sound = (e.sfx_file ?? '').replace(/^sfx\/emotes\//, '').replace(/\.ogg$/, '').replace(/_dl$/, '').replace(/^emotes_/, '');
  const file = `public/emotes/${e.key}.png`;
  add('Emote', e.name, `${packOf(e)} · ${sound}`, onDisk(file), file);
  return [e.name, packOf(e), sound, e.available ? '' : 'retired', e.exclusive ? 'exclusive' : '', `\`${file}\``];
});

// Magic items
const ITEM = {
  WildcardCommon: 'Common Wild Card', WildcardRare: 'Rare Wild Card', WildcardEpic: 'Epic Wild Card', WildcardLegendary: 'Legendary Wild Card',
  WildcardChampion: 'Champion Wild Card', WildcardElite: 'Elite Wild Card', WildcardShard: 'Wild Card shard (internal name)',
  BookCardCommon: 'Common Book', BookCardRare: 'Rare Book', BookCardEpic: 'Epic Book', BookCardLegendary: 'Legendary Book', BookCardAll: 'Book of Books',
  GoldCoin: 'Magic Coin', ChestKey: 'Chest Key', CosmeticsToken: 'Cosmetics token (internal name)', BoostSingleCard: 'Card boost (internal name)', SeasonalToken: 'Season Tokens',
};
const itemRows = consumables.map((c) => {
  const file = `public/ui/items/${c.name}.png`;
  add('Magic item', ITEM[c.name] ?? c.name, c.name, onDisk(file), file);
  return [ITEM[c.name] ?? c.name, `\`${c.name}\``, `\`${file}\``];
});

// Chests the game has had (trophy road, shop, pass, clan), with RoyaleAPI's file for each when it has one.
const CHESTS = {
  Wooden: 'wooden', Silver: 'silver', Gold: 'gold', Giant: 'giant', Magical: 'magical', 'Super Magical': 'supermagical', Epic: 'epic', Legendary: 'legendary',
  King: 'king', 'Legendary King': 'kinglegendary', Lightning: 'lightning', 'Mega Lightning': 'megalightning', Fortune: 'fortune', 'Gold Fortune': 'gold-fortune',
  'Royal Wild': 'royalwild', Draft: 'draft', 'Gold Crate': 'goldcrate', 'Plentiful Gold Crate': 'plentifulgoldcrate', 'Overflowing Gold Crate': 'overflowgoldcrate',
  Champion: null, Star: null, 'Clan War': null, Crown: null, Clan: null, 'Season Pass tier 1': null, 'Season Pass tier 2': null, 'Season Pass tier 3': null,
  'Season Pass tier 4': null, 'Shop small': null, 'Shop large legendary': null, 'Lucky Drop': null,
};
const chestRows = Object.entries(CHESTS).map(([n, f]) => {
  const have = !!f && onDisk(`vendor/cr-api-assets/chests/chest-${f}.png`);
  const file = `public/ui/chests/${n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  add('Chest', n, '', have, file);
  return [tick(have), n, have ? 'have' : `\`${file}\``];
});

// Arenas: data (to 2023) plus every arena the API sample put players in.
const arenaMap = new Map();
for (const a of arenaData) arenaMap.set(a.id, { id: a.id, name: a.title || a.name, key: a.key, kind: a.key?.startsWith('league') ? 'Path of Legends' : 'Trophy Road / event' });
// Ladder leagues (ids from 168000000) repeat the same names across modes and seasons ("Bronze I"
// exists many times) and share art, so they're one row per name.
const ladder = new Map();
for (const [id, name] of Object.entries(S.arenas)) {
  if (arenaMap.has(+id)) continue;
  if (+id >= 168000000) ladder.set(name, [...(ladder.get(name) ?? []), +id]);
  else arenaMap.set(+id, { id: +id, name, key: null, kind: 'Trophy Road (new)' });
}
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const arenaRows = [...arenaMap.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.id - b.id).map((a) => {
  const have = (a.key && /^arena\d+$/.test(a.key) && a.key !== 'arena0' && onDisk(`vendor/cr-api-assets/arenas/${a.key}.png`)) || (a.key && /^league\d+$/.test(a.key));
  const file = `public/arenas/${a.id}.png`;
  add('Arena', a.name, `${a.kind} · id ${a.id}`, !!have, file);
  return [tick(have), a.name, a.kind, a.id, have ? 'have' : `\`${file}\``];
});
for (const [name, ids] of [...ladder].sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))) {
  const file = `public/arenas/ladder-${slug(name)}.png`;
  add('Arena', name, `Mode / seasonal ladder league · ids ${ids.join(', ')}`, false, file);
  arenaRows.push([tick(false), name, 'Mode / seasonal ladder league', ids.length > 3 ? `${ids.length} ids` : ids.join(', '), `\`${file}\``]);
}

// Game modes: icon art the game files name, plus modes the API sample shows.
const modeIcons = [...new Set(gameModes.map((m) => m.icon).filter(Boolean))].sort();
const modeRows = modeIcons.map((i) => {
  const file = `public/ui/modes/${i.replace(/^icon_/, '')}.png`;
  add('Game mode icon', i.replace(/^icon_(mode_)?/, '').replace(/_/g, ' '), i, onDisk(file), file);
  return [i.replace(/^icon_(mode_)?/, '').replace(/_/g, ' '), `\`${i}\``, `\`${file}\``];
});
const modeNames = [...new Set(gameModes.map((m) => m.name))].length;

// Cards (all art comes from the API; listed so the checklist is complete).
const cards = S.cards?.items ?? [];
const towers = S.cards?.supportItems ?? [];
for (const c of cards) {
  add('Card', c.name, c.rarity, true, 'from the API');
  if ((c.maxEvolutionLevel ?? 0) === 1 || c.maxEvolutionLevel === 3) add('Card evolution', c.name, '', true, 'from the API');
  if (c.maxEvolutionLevel === 2 || c.maxEvolutionLevel === 3) add('Card hero', c.name, '', true, 'from the API');
}
for (const t of towers) add('Tower troop', t.name, '', true, 'from the API');
for (const b of clanBadges) add('Clan badge', b.name, `id ${b.id}`, onDisk(`public/badges/${b.name}.png`), `public/badges/${b.name}.png`);

// ---------- 3. Things no data source lists (from the game itself) ----------
const MANUAL = {
  'Currencies & resources': [
    ['Gold', 'public/ui/gold.png'], ['Gems', 'public/ui/gems.png'], ['Elite Wild Cards', 'public/ui/elite-wild-card.png'], ['Star Points', 'public/ui/star-points.png'],
    ['Trophy', 'public/ui/trophy.png'], ['Clan war trophy', 'public/ui/war-trophy.png'], ['Path of Legends / Ultimate Champion medal', 'public/ui/medal.png'],
    ['River Race medal (fame)', 'public/ui/river-medal.png'], ['Crown (blue)', 'public/ui/crown-blue.png'], ['Crown (red)', 'public/ui/crown-red.png'],
    ['Elixir', 'public/ui/elixir.png'], ['Evolution Shard', 'public/ui/items/evolution-shard.png'], ['Season Tokens', 'public/ui/items/SeasonalToken.png'],
    ['Banner Tokens', 'public/ui/items/banner-token.png'], ['Trade Tokens (common / rare / epic / legendary)', 'have (vendor/cr-api-assets/trade-tokens)'],
    ['Experience (king level) star', 'have (public/ui/experience.png)'],
  ],
  'Site icons (drawn by us today)': [
    ['Donations given', 'public/ui/donations.png'], ['Donations received', 'public/ui/donations-received.png'], ['Members', 'public/ui/members.png'],
    ['Battle (crossed swords)', 'public/ui/battle.png'], ['Cards / collection', 'public/ui/cards.png'], ['King tower', 'public/ui/king-tower.png'], ['Clan war', 'public/ui/clan-war.png'],
  ],
  'Clan roles': [['Leader', 'public/ui/roles/leader.png'], ['Co-leader', 'public/ui/roles/co-leader.png'], ['Elder', 'public/ui/roles/elder.png'], ['Member', 'public/ui/roles/member.png']],
  'Clan war leagues (frames)': ['bronze', 'silver', 'gold', 'legendary'].flatMap((k) => [1, 2, 3].map((t) => [`${k[0].toUpperCase()}${k.slice(1)} ${'I'.repeat(t)}`, `public/ui/clan-leagues/${k}-${t}.png`])),
  'Card frames & levels': [
    ['Card star level 1', 'public/ui/stars/star-1.png'], ['Card star level 2', 'public/ui/stars/star-2.png'], ['Card star level 3', 'public/ui/stars/star-3.png'],
    ['Card level frame', 'public/ui/stars/level-frame.png'], ['Card mastery frames (silver → gold → diamond)', 'public/ui/mastery-frames/<tier>.png'],
  ],
};
for (const [cat, list] of Object.entries(MANUAL)) for (const [name, file] of list) add(cat, name, '', file.startsWith('have'), file.startsWith('have') ? '' : file);

// ---------- 4. Write ----------
const count = (cat) => { const r = rows.filter((x) => x.category === cat); return [r.length, r.filter((x) => x.have).length]; };
const cats = [...new Set(rows.map((r) => r.category))];
md.push(
  '# Clash Royale asset checklist',
  '',
  `_Generated ${S.at.slice(0, 10)} by \`node scripts/asset-checklist.mjs\` from ${S.players.toLocaleString('en-US')} real players in ${S.clans} clans, the official API and RoyaleAPI's game data. Re-run it each season._`,
  '',
  '✅ = the site already has this art (nothing to do). ⬜ = please find it. Save transparent PNGs (256 px or larger) **at the exact path shown**, and tell me when a batch is in. The same list is in `docs/asset-checklist.csv` for ticking off in a spreadsheet.',
  '',
  '**Best sources:** the Supercell Fan Kit (fankit.supercell.com → Clash Royale) for official art, and the Clash Royale Fandom wiki galleries for badges, emotes, arenas and cosmetics.',
);
h('## Summary');
table(['What', 'Total', 'Already have', 'To find'], cats.map((c) => { const [t, hv] = count(c); return [c, t, hv, t - hv]; }));
const T = rows.length, HV = rows.filter((r) => r.have).length;
md.push('', `**${T.toLocaleString('en-US')} assets in total: ${HV.toLocaleString('en-US')} already on the site, ${(T - HV).toLocaleString('en-US')} to find.**`);

h('## 1. Player badges');
md.push(
  `Every badge held by the ${S.players.toLocaleString('en-US')} players sampled. **Each level has its own art** (mastery frames, the ×10 → ×100 laurels…), so a badge with 10 levels is 10 images. "Have" lists the levels we already load from the official API or have saved a copy of. **These fill in by themselves:** whenever anyone opens a profile, the site records each badge level's art, and the next run of this script saves a copy of every level still missing (${recorded?.count ?? 0} levels recorded so far). Badges nobody has shown yet (very old or very rare ones) aren't listed; add any you know of as \`<Name>_L<level>.png\`.`,
);
for (const g of ['Achievements & milestones', 'Card mastery', 'Events, leagues & tournaments', 'Seasonal & yearly', 'Esports & special']) {
  if (!badgeRows[g]) continue;
  h(`### ${g} (${badgeRows[g].length})`);
  table(['Badge', 'Internal name', 'Levels', 'Have', 'Need', 'Save as'], badgeRows[g]);
}
h(`## 2. Emotes (${emoteRows.length})`);
md.push('From the game data, which stops in 2023: emotes added since then (2024+) are not in any public list, so add those from the wiki. Internal names only: the pack and sound name tell you which emote it is (e.g. `king_01` · `king_laughter` = the laughing King).', '');
table(['Emote', 'Pack', 'Sound (which emote)', 'Retired', 'Exclusive', 'Save as'], emoteRows);
h(`## 3. Magic items (${itemRows.length})`);
table(['Item', 'Internal name', 'Save as'], itemRows);
md.push('', 'Also worth having (not in the data file): Evolution Shard, Banner Token, Lucky Drop boxes (every rarity tier) and the current shop offers. See section 9.');
h(`## 4. Chests (${chestRows.length})`);
table(['', 'Chest', 'Save as'], chestRows);
h(`## 5. Arenas & leagues (${arenaRows.length})`);
md.push('Trophy Road arenas from the game data plus every arena players in the sample are in right now (which includes the new arenas and the seasonal / mode ladder leagues like Bronze I → Diamond). Path of Legends league icons are already on the site.', '');
table(['', 'Arena', 'Kind', 'Arena id', 'Save as'], arenaRows);
h(`## 6. Game mode icons (${modeRows.length})`);
md.push(`The game data defines ${modeNames} modes that share these ${modeRows.length} icons. Current modes the API shows (Merge Tactics, Touchdown, Spooky Chess, Royals 2v2, Mega Draft, Goblin Road…) may have newer icons: add them as \`public/ui/modes/<mode>.png\`.`, '');
table(['Icon', 'Internal name', 'Save as'], modeRows);
h(`## 7. Cards, evolutions, heroes and tower troops (${count('Card')[0]} cards)`);
md.push(`✅ All art comes from the official API, nothing to find: ${count('Card')[0]} cards, ${count('Card evolution')[0]} evolutions, ${count('Card hero')[0]} heroes, ${count('Tower troop')[0]} tower troops (${towers.map((t) => t.name).join(', ')}).`);
h(`## 8. Clan badges (${clanBadges.length})`);
md.push(`✅ ${count('Clan badge')[1]} of ${clanBadges.length} are already in \`public/badges\`.`);
h('## 9. Currencies, icons, roles, frames');
for (const [cat, list] of Object.entries(MANUAL)) {
  h(`### ${cat}`);
  table(['', 'Asset', 'Save as'], list.map(([n, f]) => [tick(f.startsWith('have')), n, f.startsWith('have') ? f : `\`${f}\``]));
}
h('## 10. Cosmetics with no public list');
md.push(
  'No data source lists these, so they can only be collected from the wiki galleries or in-game. We don\'t show any of them yet, so they\'re nice-to-have:',
  '',
  '- **Tower skins** (every princess and king tower skin) → `public/cosmetics/tower-skins/<name>.png`',
  '- **Banners**: frames, decorations and the banner badge pieces → `public/cosmetics/banners/<name>.png`',
  '- **Emotes added since 2024** → `public/emotes/<name>.png`',
  '- **King / champion skins and card skins** → `public/cosmetics/skins/<name>.png`',
  '- **Pass Royale and seasonal art** (season logos, pass tiers) → `public/cosmetics/seasons/<season>.png`',
);

fs.writeFileSync(path.join(root, 'docs/asset-checklist.md'), md.join('\n') + '\n');
const csv = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync(
  path.join(root, 'docs/asset-checklist.csv'),
  ['Category,Name,Detail,Have,Save as', ...rows.map((r) => [r.category, r.name, r.detail, r.have ? 'yes' : 'no', r.saveAs].map(csv).join(','))].join('\n') + '\n',
);
console.log(`[assets] ${T} assets: ${HV} have, ${T - HV} to find → docs/asset-checklist.md + .csv`);
