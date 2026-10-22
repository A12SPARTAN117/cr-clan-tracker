// Service worker. Source: scripts/down-page/sw.js, copied to public/sw.js by
// scripts/build-down-page.mjs (which fills in the cache version).
//
// It only touches page navigations, and only when they fail: if the server can't be reached or
// the host answers with a gateway/outage error, the visitor sees the cached /down.html page
// instead of the browser's error screen. Everything else goes straight to the network.
//
// The page (14 KB) is cached for every visitor. Its three.js scene (/down-scene.js, ~580 KB) is
// cached only the third time someone opens the site (in-app navigations aren't page loads, and
// the first load happens before this worker is in charge), and never with Save-Data on, so a
// one-off visit doesn't download it; without the scene the page shows its static crown.
//
// Emergency off switch: replace this file's contents with
//   self.addEventListener('install', () => self.skipWaiting());
//   self.addEventListener('activate', () => self.registration.unregister());
const CACHE = 'down-%VERSION%';
const DOWN = '/down.html';
const SCENE = '/down-scene.js';
/** A tiny cached counter of page loads this worker saw (resets with each new version). */
const VISITS = '/__visits';
const SCENE_AFTER = 2;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add(new Request(DOWN, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
      // Starts the page request while the worker boots, so it adds no delay to navigations.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

/** Outage answers from a host or CDN (not from our app, whose pages handle their own errors). */
function isOutage(r) {
  if (r.status === 502 || r.status === 503 || r.status === 504 || (r.status >= 520 && r.status <= 524)) return true;
  // A 500 that didn't come from Next.js (its responses always vary on RSC) is the host's crash page.
  return r.status === 500 && !/\brsc\b/i.test(r.headers.get('vary') || '');
}

async function downPage(status) {
  const cached = await caches.match(DOWN, { cacheName: CACHE });
  return cached ? new Response(cached.body, { status, statusText: 'Service Unavailable', headers: cached.headers }) : null;
}

/** Counts a page load; from SCENE_AFTER on, caches the scene if it isn't yet. */
async function noteVisit(saveData) {
  const c = await caches.open(CACHE);
  if (await c.match(SCENE)) return;
  const n = Number(await (await c.match(VISITS))?.text()) + 1 || 1;
  await c.put(VISITS, new Response(String(n)));
  if (n >= SCENE_AFTER && !saveData) await c.add(new Request(SCENE, { cache: 'reload' })).catch(() => {});
}

self.addEventListener('fetch', (e) => {
  // The scene for the down page: from the cache when we have it (the server may be down).
  if (e.request.method === 'GET' && new URL(e.request.url).pathname === SCENE) {
    e.respondWith(caches.match(SCENE, { cacheName: CACHE }).then((hit) => hit || fetch(e.request)));
    return;
  }
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    (async () => {
      try {
        const r = (await e.preloadResponse) || (await fetch(e.request));
        if (isOutage(r)) return (await downPage(r.status)) || r;
        e.waitUntil(noteVisit(e.request.headers.get('save-data') === 'on').catch(() => {}));
        return r;
      } catch {
        return (await downPage(503)) || Response.error();
      }
    })(),
  );
});
