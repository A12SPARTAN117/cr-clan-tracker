// Small same-origin copies of the official card art, for every card in data/cards.json:
//   public/cards/art/<slug>[-evo|-hero].avif     288 px wide (big tiles, detail pages, 3D fan)
//   public/cards/art/<slug>[-evo|-hero].s.avif   192 px wide (deck rows, collections)
// The CDN only serves 300 px PNGs of ~165 KB each; these are 5-8 KB (AVIF at quality 50 looks
// the same as the PNG at twice the size shown), so a page of decks went from about 5 MB of art to
// about 250 KB. CardTile falls back to the CDN for anything missing or a browser without AVIF.
// Run after scripts/fetch-cards.mjs adds cards. Existing files are kept (pass --force to redo).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'public', 'cards', 'art');
const force = process.argv.includes('--force');
fs.mkdirSync(out, { recursive: true });

const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'cards.json'), 'utf8'));
const jobs = [];
for (const c of data.cards) {
  if (c.icons.normal) jobs.push([c.slug, c.icons.normal]);
  if (c.icons.evolution) jobs.push([`${c.slug}-evo`, c.icons.evolution]);
  if (c.icons.hero) jobs.push([`${c.slug}-hero`, c.icons.hero]);
}
for (const t of data.towerTroops ?? []) if (t.icon) jobs.push([t.slug, t.icon]);

let made = 0;
let bytes = 0;
for (const [name, url] of jobs) {
  const full = path.join(out, `${name}.avif`);
  const small = path.join(out, `${name}.s.avif`);
  if (!force && fs.existsSync(full) && fs.existsSync(small)) continue;
  const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) {
    console.warn(`skip ${name}: ${r.status}`);
    continue;
  }
  const png = Buffer.from(await r.arrayBuffer());
  for (const [file, width] of [[full, 288], [small, 192]]) {
    const avif = await sharp(png).resize({ width, withoutEnlargement: true }).avif({ quality: 50, effort: 6 }).toBuffer();
    fs.writeFileSync(file, avif);
    bytes += avif.length;
  }
  made++;
}
console.log(`card art: ${made} of ${jobs.length} made (${(bytes / 1024).toFixed(0)} KB)`);
