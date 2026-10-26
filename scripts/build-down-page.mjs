// Writes public/down.html and public/sw.js from scripts/down-page/, filling in the donate buttons
// (NEXT_PUBLIC_DONATE_*_URL from .env or the host) and a cache version for the service worker.
// Runs automatically before `npm run dev` and `npm run build`.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import nextEnv from '@next/env';

const root = path.resolve(import.meta.dirname, '..');
nextEnv.loadEnvConfig(root, process.env.npm_lifecycle_event === 'predev');

// Same links, labels and rule as src/lib/donate.ts: https only, nothing that could break out of the attribute.
const LINKS = [
  ['NEXT_PUBLIC_DONATE_PAYPAL_URL', 'Donate with PayPal'],
  ['NEXT_PUBLIC_DONATE_PAYFAST_URL', 'Donate with Payfast'],
  ['NEXT_PUBLIC_DONATE_YOCO_URL', 'Donate with Yoco'],
  ['NEXT_PUBLIC_DONATE_URL', 'Donate'],
];
const links = [];
for (const [key, label] of LINKS) {
  // Trimmed: a link pasted into a host's dashboard often brings a space or line break.
  const raw = process.env[key]?.trim() ?? '';
  if (/^https:\/\/[^\s"'<>]+$/.test(raw)) links.push({ url: raw, label });
  else if (raw) console.warn(`[down-page] ${key} must be an https:// link; its Donate button is hidden.`);
}
const HEART =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z"/></svg>';
// The first link is the main button; the others are outlined. A lone link keeps the long label.
const buttons = links
  .map(
    (l, i) =>
      `<a class="btn ${i ? 'btn-alt' : 'btn-donate'}" href="${l.url.replaceAll('&', '&amp;')}" target="_blank" rel="noopener noreferrer">${HEART}${
        links.length === 1 ? 'Donate to keep the site running' : l.label
      }</a>`,
  )
  .join('\n    ');

const src = (f) => readFileSync(path.join(root, 'scripts/down-page', f), 'utf8');
// The three-crowned scene (three.js, prebuilt by bundle-down-scene.mjs, ~580 KB) is its own file.
// The service worker caches the 14 KB page for every visitor and the scene only for returning
// ones (see sw.js); without it the page shows its static crown.
const scene = existsSync(path.join(root, 'scripts/down-page/scene.bundle.js')) ? src('scene.bundle.js') : '';
const html = src('down.html')
  .replace('<!--DONATE_BUTTONS-->', () => buttons)
  .replaceAll('%DONATE_STATE%', links.length ? '' : 'no-donate')
  .replace('<!--SCENE-->', () => (scene ? '<script src="/down-scene.js" defer></script>' : ''));
const version = createHash('sha256').update(html).update(scene).update(src('sw.js')).digest('hex').slice(0, 12);
const sw = src('sw.js').replaceAll('%VERSION%', version);

writeFileSync(path.join(root, 'public/down.html'), html);
writeFileSync(path.join(root, 'public/down-scene.js'), scene);
writeFileSync(path.join(root, 'public/sw.js'), sw);
console.log(`[down-page] public/down.html + down-scene.js + sw.js (${version}), ${links.length ? `donate buttons: ${links.map((l) => l.label.replace('Donate with ', '')).join(', ')}` : 'donate buttons off: set NEXT_PUBLIC_DONATE_*_URL'}`);
