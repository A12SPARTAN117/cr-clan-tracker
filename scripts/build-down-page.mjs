// Writes public/down.html and public/sw.js from scripts/down-page/, filling in the donate link
// (NEXT_PUBLIC_DONATE_URL from .env or the host) and a cache version for the service worker.
// Runs automatically before `npm run dev` and `npm run build`.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import nextEnv from '@next/env';

const root = path.resolve(import.meta.dirname, '..');
nextEnv.loadEnvConfig(root, process.env.npm_lifecycle_event === 'predev');

const raw = process.env.NEXT_PUBLIC_DONATE_URL ?? '';
// Same rule as src/lib/donate.ts: https only, nothing that could break out of the attribute.
const url = /^https:\/\/[^\s"'<>]+$/.test(raw) ? raw : '';
if (raw && !url) console.warn('[down-page] NEXT_PUBLIC_DONATE_URL must be an https:// link; the Donate button is hidden.');

const src = (f) => readFileSync(path.join(root, 'scripts/down-page', f), 'utf8');
// The three-crowned scene (three.js, prebuilt by bundle-down-scene.mjs) goes inline, so the page
// stays one self-contained file that the service worker can cache.
const scene = existsSync(path.join(root, 'scripts/down-page/scene.bundle.js')) ? src('scene.bundle.js').replaceAll('</script', '<\\/script') : '';
const html = src('down.html')
  .replaceAll('%DONATE_URL%', url.replaceAll('&', '&amp;'))
  .replaceAll('%DONATE_STATE%', url ? '' : 'no-donate')
  .replace('<!--SCENE-->', () => (scene ? `<script>${scene}</script>` : ''));
const version = createHash('sha256').update(html).update(src('sw.js')).digest('hex').slice(0, 12);
const sw = src('sw.js').replaceAll('%VERSION%', version);

writeFileSync(path.join(root, 'public/down.html'), html);
writeFileSync(path.join(root, 'public/sw.js'), sw);
console.log(`[down-page] public/down.html + sw.js (${version}), donate button ${url ? 'on' : 'off: set NEXT_PUBLIC_DONATE_URL'}`);
