// Renders every social media image in brand/out from the HTML templates in this folder.
// Run from the repo root: node brand/src/render.mjs [name...]
// Uses Microsoft Edge through Playwright, so no Playwright browser download is needed.
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const out = join(here, '..', 'out');
mkdirSync(out, { recursive: true });

const logo = readFileSync(join(here, 'logo.svg'), 'utf8');
// Fonts and art are inlined: a page made with setContent can't load file:// links.
const types = { ttf: 'font/ttf', woff2: 'font/woff2', jpg: 'image/jpeg' };
const url = (p) => `data:${types[p.split('.').pop()]};base64,${readFileSync(join(root, p)).toString('base64')}`;

// Shared page head: the site's fonts and colours.
const head = `<meta charset="utf-8"><style>
@font-face { font-family: Mono; src: url('${url('assets/fonts/JetBrainsMono-ExtraBold.ttf')}'); font-weight: 800; }
@font-face { font-family: Mono; src: url('${url('assets/fonts/JetBrainsMono-Medium.ttf')}'); font-weight: 500; }
@font-face { font-family: Sans; src: url('${url('src/app/fonts/sans-latin.woff2')}'); font-weight: 300 700; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #07080a; color: #f3f4f6; }
.logo svg { width: 100%; height: 100%; display: block; }
.word { font: 800 1em/1 Mono; letter-spacing: 0.04em; white-space: nowrap; }
.word i { font-style: normal; color: #80868f; }
.tag { font: 500 1em/1.3 Sans; color: #a4a9b4; }
.url { font: 500 1em/1 Mono; letter-spacing: 0.06em; color: #8ccbff; text-shadow: 0 0 12px rgba(58,160,255,.7); }
.vein { position: absolute; inset: 0; opacity: .05; background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='2000' height='2000'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.0025 0.012' numOctaves='5' seed='11'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -2.2 1.35'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>") center / 2000px 2000px no-repeat; }
.scene { position: absolute; inset: 0; background: url('${url('public/scenes/arena.jpg')}') center / cover; filter: grayscale(1) contrast(1.1) brightness(.55); }
.strip { position: absolute; height: 2px; background: linear-gradient(90deg, transparent, #8ccbff, transparent); box-shadow: 0 0 12px #3aa0ff, 0 0 30px rgba(58,160,255,.6); }
</style>`;

const word = 'CR·CLAN<i>/</i>TRACKER';
const noGlow = logo.replace('id="glow-layer"', 'id="glow-layer" display="none"');

// Profile picture: the mark alone on obsidian, sized to sit inside the round crop.
const pfp = `<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, #1d2127 0%, #0d0f12 55%, #07080a 100%)"></div>
<div class="vein"></div>
<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 52%, rgba(58,160,255,.32) 0%, rgba(58,160,255,.08) 34%, transparent 55%)"></div>
<div style="position:absolute;inset:4.5%;border-radius:50%;border:max(1px,.25vw) solid rgba(140,203,255,.35);box-shadow:0 0 2vw rgba(58,160,255,.35), inset 0 0 2vw rgba(58,160,255,.2)"></div>
<div class="logo" style="position:absolute;left:12%;top:12%;width:76%;height:76%">${logo}</div>`;

// A wide banner with the arena behind and the mark + wordmark on one line.
// size: font size of the wordmark; box: where the lockup sits.
const banner = ({ size, box, glowAt = '50% 50%', tagline = true, scrim }) => `<div class="scene"></div>
<div style="position:absolute;inset:0;background:${scrim}"></div>
<div class="vein"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse ${size * 9}px ${size * 3}px at ${glowAt}, rgba(58,160,255,.22), transparent 70%)"></div>
<div style="position:absolute;${box};display:flex;align-items:center;gap:${size * 0.55}px;font-size:${size}px">
  <div class="logo" style="width:${size * 3.3}px;height:${size * 3.3}px;flex:none;margin:-${size * 0.8}px -${size * 0.25}px;filter:drop-shadow(0 0 ${size * 0.25}px rgba(58,160,255,.55))">${logo}</div>
  <div>
    <div class="word" style="text-shadow:0 0 24px rgba(58,160,255,.45)">${word}</div>
    ${tagline ? `<div class="tag" style="font-size:${size * 0.36}px;margin-top:${size * 0.32}px">Clash Royale stats &amp; clan management</div>
    <div class="url" style="font-size:${size * 0.3}px;margin-top:${size * 0.3}px">cr-clan-tracker.vercel.app</div>` : ''}
  </div>
</div>`;

// A tall welcome post for Instagram and TikTok, which have no profile banner.
const poster = ({ top, logoW, size, gap }) => `<div class="scene" style="background-position:50% 50%"></div>
<div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(7,8,10,.55) 0%, rgba(7,8,10,.35) 30%, rgba(7,8,10,.85) 62%, #07080a 100%)"></div>
<div class="vein"></div>
<div style="position:absolute;left:0;right:0;top:${top}px;display:flex;flex-direction:column;align-items:center;text-align:center;font-size:${size}px">
  <div class="logo" style="width:${logoW}px;height:${logoW}px">${logo}</div>
  <div class="word" style="font-size:${size}px;margin-top:${gap * 0.2}px;text-shadow:0 0 24px rgba(58,160,255,.5)">${word}</div>
  <div class="tag" style="font-size:${size * 0.5}px;margin-top:${gap * 0.5}px;color:#f3f4f6">Clash Royale stats &amp; clan management</div>
  <div style="position:relative;width:70%;height:2px;margin:${gap}px 0"><div class="strip" style="left:0;right:0;top:0"></div></div>
  <div class="tag" style="font-size:${size * 0.44}px;line-height:1.75">
    Who's active, who plays war, who's earned a promotion<br>Live meta decks from top Path of Legends players<br>Player profiles, leaderboards, compare
  </div>
  <div class="url" style="font-size:${size * 0.46}px;margin-top:${gap}px">FREE · LINK IN BIO</div>
</div>`;

// The site's link preview (Open Graph / X card): the lockup over the arena, with what the site does.
const og = `<div class="scene" style="background-position:50% 40%"></div>
<div style="position:absolute;inset:0;background:linear-gradient(90deg, rgba(7,8,10,.94) 0%, rgba(7,8,10,.8) 55%, rgba(7,8,10,.55) 100%)"></div>
<div class="vein"></div>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 520px 340px at 24% 50%, rgba(58,160,255,.2), transparent 70%)"></div>
<div class="logo" style="position:absolute;left:46px;top:115px;width:400px;height:400px;filter:drop-shadow(0 0 22px rgba(58,160,255,.5))">${logo}</div>
<div style="position:absolute;left:470px;right:60px;top:150px">
  <div class="word" style="font-size:56px;text-shadow:0 0 24px rgba(58,160,255,.45)">${word}</div>
  <div class="tag" style="font-size:27px;margin-top:22px;color:#f3f4f6">Clash Royale stats &amp; clan management</div>
  <div style="position:relative;height:2px;margin:30px 0 28px"><div class="strip" style="left:0;right:0;top:0"></div></div>
  <div class="tag" style="font-size:21px;line-height:1.65">Who's active, who plays war, who's earned a promotion<br>Live meta decks from the top Path of Legends players</div>
  <div class="url" style="font-size:20px;margin-top:30px">FREE · NO SIGN-UP · CR-CLAN-TRACKER.VERCEL.APP</div>
</div>`;

const jobs = {
  // Link preview for every page, and the icon phones save to the home screen. Written into the app.
  'opengraph-image': { w: 1200, h: 630, type: 'jpeg', html: og, dest: 'src/app' },
  'apple-icon': { w: 180, h: 180, html: pfp, scale: 2, dest: 'src/app' },
  // Profile pictures. Every platform crops these to a circle.
  'x-pfp': { w: 400, h: 400, html: pfp },
  'instagram-pfp': { w: 1080, h: 1080, html: pfp },
  'tiktok-pfp': { w: 1080, h: 1080, html: pfp },
  'reddit-icon': { w: 256, h: 256, html: pfp, scale: 2 },
  // X header: the profile picture covers the bottom left, phones crop the top and bottom.
  'x-header': {
    w: 1500, h: 500, type: 'jpeg',
    html: banner({ size: 58, box: 'left:540px;top:150px', glowAt: '62% 50%', scrim: 'linear-gradient(90deg, rgba(7,8,10,.5) 0%, rgba(7,8,10,.72) 40%, rgba(7,8,10,.88) 100%)' }),
  },
  // Reddit crops the banner to a thin strip on desktop, so everything sits in the middle band.
  'reddit-banner': {
    w: 1920, h: 384, type: 'jpeg',
    html: banner({ size: 48, box: 'left:0;right:0;top:0;bottom:0;justify-content:center', tagline: false, scrim: 'radial-gradient(ellipse 40% 60% at 50% 50%, rgba(7,8,10,.85), rgba(7,8,10,.45))' }),
  },
  'instagram-welcome': { w: 1080, h: 1350, type: 'jpeg', html: poster({ top: 150, logoW: 520, size: 64, gap: 56 }) },
  'tiktok-welcome': { w: 1080, h: 1920, type: 'jpeg', html: poster({ top: 330, logoW: 560, size: 64, gap: 60 }) },
  // The bare mark, for anywhere else the logo is needed.
  'logo-dark': { w: 1024, h: 1024, transparent: true, html: `<div class="logo" style="position:absolute;inset:0">${logo}</div>` },
  'logo-light': { w: 1024, h: 1024, transparent: true, html: `<div class="logo" style="position:absolute;inset:0">${noGlow}</div>` },
};

const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge' });
for (const [name, job] of Object.entries(jobs)) {
  if (only.length && !only.includes(name)) continue;
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: job.scale ?? 1 });
  const bg = job.transparent ? '<style>html,body{background:transparent}</style>' : '';
  await page.setContent(`<!doctype html><html><head>${head}${bg}</head><body><div style="position:relative;width:100%;height:100%">${job.html}</div></body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const type = job.type ?? 'png';
  const file = join(job.dest ? join(root, job.dest) : out, `${name}.${type === 'jpeg' ? 'jpg' : 'png'}`);
  if (job.scale) {
    // Rendered at 2x and scaled back down for crisper small icons.
    const buf = await page.screenshot({ type: 'png' });
    const small = await browser.newPage({ viewport: { width: job.w, height: job.h } });
    await small.setContent(`<body style="margin:0"><img style="width:${job.w}px;height:${job.h}px;display:block" src="data:image/png;base64,${buf.toString('base64')}">`);
    await small.screenshot({ path: file, type: 'png' });
    await small.close();
  } else {
    await page.screenshot({ path: file, type, quality: type === 'jpeg' ? 92 : undefined, omitBackground: !!job.transparent });
  }
  await page.close();
  console.log('wrote', file);
}
await browser.close();
