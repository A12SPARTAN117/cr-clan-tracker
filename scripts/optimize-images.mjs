// Shrinks the game art in public/ in place: PNGs become 8-bit palette PNGs (transparency kept,
// no visible change at the sizes the site shows them), JPEGs are re-encoded with mozjpeg, and
// scene stills get an AVIF twin.
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

// Scene stills also get an AVIF twin (about 40-60% smaller); globals.css serves it to browsers that
// can pick a format (image-set with type()), and the JPEG to the rest.
for (const dir of ['public/scenes', 'public/scenes/light']) {
  for (const name of readdirSync(path.join(root, dir))) {
    if (!/\.jpe?g$/i.test(name)) continue;
    const file = path.join(root, dir, name);
    const out = file.replace(/\.jpe?g$/i, '.avif');
    writeFileSync(out, await sharp(readFileSync(file)).avif({ quality: 45, effort: 6 }).toBuffer());
  }
}
console.log('scene AVIFs written');

// Transparent art also gets a WebP twin (badges about half the size, the chest and XP art a sixth),
// which the site shows; the PNGs stay for the recap image renderer, which can't read WebP.
let png = 0;
let webp = 0;
for (const dir of ['characters', 'badges', 'ui', 'leagues']) {
  for (const name of readdirSync(path.join(root, 'public', dir))) {
    if (!/\.png$/i.test(name)) continue;
    const file = path.join(root, 'public', dir, name);
    const input = readFileSync(file);
    const out = await sharp(input).webp({ quality: 80, alphaQuality: 90, effort: 6 }).toBuffer();
    writeFileSync(file.replace(/\.png$/i, '.webp'), out);
    png += input.length;
    webp += out.length;
  }
}
console.log(`art WebPs: ${(png / 1024).toFixed(0)} KB of PNG -> ${(webp / 1024).toFixed(0)} KB`);
