import { expect, test } from '@playwright/test';

/**
 * Security checks against the running site: headers, the art proxy's allowlist, the cron
 * secret, and the per-visitor limits. Each rate-limit test sends its own X-Real-IP so it gets a
 * fresh budget and doesn't throttle the other tests (on a real host the platform sets that
 * header itself and a visitor can't change it).
 */
const ip = () => `198.18.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

for (const path of ['/', '/players', '/player/ZZZZZZ', '/api/search?q=ab']) {
  test(`security headers on ${path}`, async ({ request }) => {
    const res = await request.get(path, { headers: { 'x-real-ip': ip() } });
    const h = res.headers();
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy']).toContain("object-src 'none'");
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy']).toContain('camera=()');
    expect(h['x-powered-by']).toBeUndefined();
  });
}

test('the art proxy only fetches official Clash Royale art', async ({ request }) => {
  for (const src of ['https://example.com/a.png', 'http://169.254.169.254/latest/meta-data/', 'https://api-assets.clashroyale.com.evil.example/a.png', 'file:///etc/passwd']) {
    const res = await request.get(`/api/art?src=${encodeURIComponent(src)}`, { headers: { 'x-real-ip': ip() } });
    expect(res.status(), src).toBe(400);
  }
});

test('cron jobs need the secret', async ({ request }) => {
  for (const path of ['/api/cron/snapshot', '/api/cron/directory']) {
    for (const auth of [undefined, 'Bearer wrong']) {
      const res = await request.get(path, { headers: auth ? { authorization: auth } : {} });
      expect(res.status(), `${path} ${auth ?? 'no auth'}`).toBe(401);
    }
  }
});

test('API endpoints answer 429 with Retry-After when hammered', async ({ request }) => {
  const me = ip();
  let last = 0;
  let retry: string | undefined;
  for (let i = 0; i < 45 && last !== 429; i++) {
    const res = await request.get(`/api/search?q=zz${i}`, { headers: { 'x-real-ip': me } });
    last = res.status();
    retry = res.headers()['retry-after'];
  }
  expect(last).toBe(429);
  expect(Number(retry)).toBeGreaterThan(0);
});

test('pages that cost API calls are limited per visitor; prefetches have a far larger budget', async ({ request }) => {
  test.setTimeout(180_000);
  // An invalid tag renders the "not found" page without calling the API, so this is cheap.
  const me = ip();
  for (let i = 0; i < 70; i++) {
    // What a browser prefetch looks like to the proxy (Next.js strips its own router headers).
    const res = await request.get('/player/ZZZZZZ', { headers: { 'x-real-ip': me, 'sec-fetch-dest': 'empty', 'sec-fetch-mode': 'cors' } });
    expect(res.status(), 'prefetches stay within their own budget').not.toBe(429);
  }
  let last = 0;
  for (let i = 0; i < 61 && last !== 429; i++) last = (await request.get('/player/ZZZZZZ', { headers: { 'x-real-ip': me, 'sec-fetch-dest': 'document' } })).status();
  expect(last).toBe(429);
  // The visitor can still use pages that don't cost API calls.
  expect((await request.get('/help', { headers: { 'x-real-ip': me } })).status()).toBe(200);
});
