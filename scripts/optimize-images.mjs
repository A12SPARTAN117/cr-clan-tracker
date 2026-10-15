// Shrinks the game art in public/ in place: PNGs become 8-bit palette PNGs (transparency kept,
// no visible change at the sizes the site shows them), JPEGs are re-encoded with mozjpeg.
// A file is only replaced when that saves at least 10%, so running it again is harmless.
//   node scripts/optimize-images.mjs            all art folders
//   node scripts/optimize-images.mjs public/x   just one folder
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const dirs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['characters', 'cards', 'badges', 'leagues', 'scenes'].map((d) => path.join('public', d));

let before = 0;
let after = 0;
for (const dir of dirs) {
  for (const name of readdirSync(path.join(root, dir))) {
    const file = path.join(root, dir, name);
    if (!statSync(file).isFile() || !/\.(png|jpe?g)$/i.test(name)) continue;
    const input = readFileSync(file);
    const img = sharp(input);
    const out = /\.png$/i.test(name)
      ? await img.png({ palette: true, quality: 90, effort: 10, compressionLevel: 9, dither: 1 }).toBuffer()
      : await img.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
    before += input.length;
    if (out.length < input.length * 0.9) {
      writeFileSync(file, out);
      after += out.length;
    } else after += input.length;
  }
}
console.log(`images: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
