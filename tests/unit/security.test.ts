import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientIp } from '@/lib/ip';
import { APP_LIMIT, checkPage, isAppRequest, LIMITED_PAGES, PAGE_LIMIT, resetPageLimits, slowDownPage } from '@/lib/pageLimit';

const H = (h: Record<string, string> = {}) => new Headers(h);

// Route handlers depend on these; the real ones would call the Clash Royale API or a database.
vi.mock('@/lib/search', () => ({ search: vi.fn(async (q: string, scope: string) => ({ q, scope, tagPlayer: null, tagClan: null, players: [], clans: [], clanError: false })) }));
vi.mock('@/lib/summary', () => ({ playerSummary: vi.fn(async () => ({ tag: 'X' })), clanSummary: vi.fn(async () => ({ tag: 'X' })) }));
vi.mock('@/lib/db', () => ({ getDb: vi.fn(async () => null), enqueue: (job: () => Promise<unknown>) => job(), schema: {} }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-real-ip': '198.51.100.7' }) }));

let n = 0;
/** A request from a fresh IP, so tests don't share rate-limit counters. */
const req = (url: string, init: RequestInit & { ip?: string } = {}) =>
  new Request(`http://localhost${url}`, { ...init, headers: { 'x-real-ip': init.ip ?? `203.0.113.${++n % 250}-${n}`, ...(init.headers as Record<string, string>) } });

describe('visitor IP (lib/ip)', () => {
  it('trusts the host-set headers first', () => {
    expect(clientIp(H({ 'cf-connecting-ip': '1.1.1.1', 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3' }))).toBe('1.1.1.1');
    expect(clientIp(H({ 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '3.3.3.3' }))).toBe('2.2.2.2');
  });
  it('ignores X-Forwarded-For entries a visitor can forge (only the last hop counts)', () => {
    expect(clientIp(H({ 'x-forwarded-for': '6.6.6.6, 10.0.0.1, 4.4.4.4' }))).toBe('4.4.4.4');
  });
  it('falls back to a single bucket when there is nothing to go on', () => {
    expect(clientIp(H())).toBe('unknown');
    expect(clientIp(H({ 'x-forwarded-for': ' , ' }))).toBe('unknown');
  });
});

describe('page limit (lib/pageLimit, src/proxy.ts)', () => {
  beforeEach(resetPageLimits);

  it('covers exactly the pages that call the API', () => {
    for (const p of ['/player/ABC', '/clan/ABC', '/clan/ABC/manage', '/t/ABC', '/compare', '/search', '/decks/26000000-26000001']) expect(LIMITED_PAGES.test(p), p).toBe(true);
    for (const p of ['/', '/decks', '/players', '/clans', '/help', '/api/search', '/_next/static/x.js', '/comparex', '/searching']) expect(LIMITED_PAGES.test(p), p).toBe(false);
  });

  it(`lets ${PAGE_LIMIT} pages a minute through, then asks the visitor to wait`, () => {
    const h = H({ 'x-real-ip': '9.9.9.9' });
    for (let i = 0; i < PAGE_LIMIT; i++) expect(checkPage('/player/X', h, 1000)).toBe(0);
    expect(checkPage('/player/X', h, 1000)).toBe(60);
    expect(checkPage('/player/X', h, 31_000)).toBe(30);
    // A new window opens after a minute.
    expect(checkPage('/player/X', h, 61_001)).toBe(0);
  });

  it('counts each visitor separately', () => {
    for (let i = 0; i <= PAGE_LIMIT; i++) checkPage('/clan/X', H({ 'x-real-ip': '1.2.3.4' }), 0);
    expect(checkPage('/clan/X', H({ 'x-real-ip': '1.2.3.4' }), 0)).toBeGreaterThan(0);
    expect(checkPage('/clan/X', H({ 'x-real-ip': '5.6.7.8' }), 0)).toBe(0);
  });

  it('gives prefetches and in-app navigation a separate, larger budget', () => {
    // Next.js strips its router headers before the proxy, so it goes by the browser's Sec-Fetch-Dest.
    const app = H({ 'x-real-ip': '7.7.7.7', 'sec-fetch-dest': 'empty' });
    const page = H({ 'x-real-ip': '7.7.7.7', 'sec-fetch-dest': 'document' });
    expect(isAppRequest(app)).toBe(true);
    expect(isAppRequest(page)).toBe(false);
    expect(isAppRequest(H({ 'next-router-prefetch': '1' }))).toBe(true);
    for (let i = 0; i < APP_LIMIT; i++) expect(checkPage('/player/X', app, 0), 'app request ' + i).toBe(0);
    expect(checkPage('/player/X', app, 0)).toBeGreaterThan(0);
    // Page loads still have their own full budget.
    expect(checkPage('/player/X', page, 0)).toBe(0);
  });

  it('treats requests without Sec-Fetch-Dest (scripts) as page loads', () => {
    const bot = H({ 'x-real-ip': '6.6.6.6' });
    expect(isAppRequest(bot)).toBe(false);
    for (let i = 0; i < PAGE_LIMIT; i++) checkPage('/clan/X', bot, 0);
    expect(checkPage('/clan/X', bot, 0)).toBeGreaterThan(0);
  });

  it("doesn't count pages that don't call the API", () => {
    for (let i = 0; i < PAGE_LIMIT * 3; i++) expect(checkPage('/', H({ 'x-real-ip': '7.7.7.8' }), 0)).toBe(0);
  });

  it('serves a static slow-down page with no scripts', () => {
    const html = slowDownPage(42);
    expect(html).toContain('42 seconds');
    expect(html).not.toMatch(/<script/i);
  });

  it('the proxy answers 429 with Retry-After once the limit is hit', async () => {
    const { proxy } = await import('@/proxy');
    const r = (path: string) => Object.assign(new Request(`http://localhost${path}`, { headers: { 'x-real-ip': '8.8.4.4' } }), { nextUrl: new URL(`http://localhost${path}`) });
    for (let i = 0; i < PAGE_LIMIT; i++) expect(proxy(r('/player/ABC') as never).status).toBe(200);
    const res = proxy(r('/player/ABC') as never);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('rewrites hidden sections (News) to the 404 page before anything renders', async () => {
    const { proxy } = await import('@/proxy');
    const r = (path: string) => Object.assign(new Request(`http://localhost${path}`, { headers: { 'x-real-ip': '8.8.8.8' } }), { nextUrl: new URL(`http://localhost${path}`) });
    for (const path of ['/news', '/news/early-access']) expect(proxy(r(path) as never).headers.get('x-middleware-rewrite')).toBe('http://localhost/_hidden');
    expect(proxy(r('/newsletter') as never).headers.get('x-middleware-rewrite')).toBeNull();
  });
});

describe('endpoint limits (lib/ratelimit)', () => {
  it('limits each kind of endpoint per IP, with Retry-After', async () => {
    const { limitRequest, LIMITS } = await import('@/lib/ratelimit');
    const r = () => new Request('http://localhost/api/search', { headers: { 'x-real-ip': '192.0.2.50' } });
    for (let i = 0; i < LIMITS.search; i++) expect(limitRequest(r(), 'search')).toBeNull();
    const res = limitRequest(r(), 'search')!;
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    // Another kind of endpoint has its own budget.
    expect(limitRequest(r(), 'summary')).toBeNull();
  });

  it('lets one clan be refreshed once per 20 seconds, whoever presses it', async () => {
    const { allowRefresh } = await import('@/lib/ratelimit');
    expect(await allowRefresh('clan:AAAA')).toBe(true);
    expect(await allowRefresh('clan:AAAA')).toBe(false);
    expect(await allowRefresh('clan:BBBB')).toBe(true);
  });
});

describe('cron secret (lib/cron-auth)', () => {
  afterEach(() => vi.unstubAllEnvs());
  const withAuth = (v?: string) => new Request('http://localhost/api/cron/snapshot', { headers: v ? { authorization: v } : {} });

  it('refuses everything when no secret is configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const { cronAuthorized } = await import('@/lib/cron-auth');
    expect(cronAuthorized(withAuth('Bearer '))).toBe(false);
    expect(cronAuthorized(withAuth())).toBe(false);
  });

  it('accepts only the exact bearer token', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    const { cronAuthorized } = await import('@/lib/cron-auth');
    expect(cronAuthorized(withAuth('Bearer s3cret'))).toBe(true);
    // (Trailing spaces never reach us: header values are trimmed by the HTTP layer.)
    for (const bad of ['Bearer s3cre', 'Bearer s3cretX', 'Bearer  s3cret', 'bearer s3cret', 's3cret', 'Basic s3cret']) expect(cronAuthorized(withAuth(bad)), bad).toBe(false);
  });

  it('cron endpoints answer 401 without the secret and touch nothing', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    for (const mod of ['@/app/api/cron/snapshot/route', '@/app/api/cron/directory/route']) {
      const { GET } = await import(mod);
      const res = await GET(withAuth('Bearer nope'));
      expect(res.status, mod).toBe(401);
    }
  });
});

describe('donate links (lib/donate)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  const KEYS = ['NEXT_PUBLIC_DONATE_PAYPAL_URL', 'NEXT_PUBLIC_DONATE_PAYFAST_URL', 'NEXT_PUBLIC_DONATE_YOCO_URL', 'NEXT_PUBLIC_DONATE_URL'];
  const load = async (env: Record<string, string>) => {
    vi.resetModules();
    for (const k of KEYS) vi.stubEnv(k, env[k] ?? '');
    return (await import('@/lib/donate')).DONATE_LINKS;
  };
  it('accepts https links only', async () => {
    expect(await load({ NEXT_PUBLIC_DONATE_URL: 'https://ko-fi.com/crclan' })).toEqual([{ id: 'other', label: 'Donate', url: 'https://ko-fi.com/crclan' }]);
    for (const bad of ['http://ko-fi.com/x', 'javascript:alert(1)', 'https://x.com/"onmouseover="alert(1)', 'https://x.com/ <script>', 'ko-fi.com/x', 'data:text/html,hi'])
      for (const k of KEYS) expect(await load({ [k]: bad }), `${k}=${bad}`).toEqual([]);
  });
  it('trims a link pasted with spaces or a line break', async () => {
    expect(await load({ NEXT_PUBLIC_DONATE_URL: ' https://ko-fi.com/crclan\n' })).toEqual([{ id: 'other', label: 'Donate', url: 'https://ko-fi.com/crclan' }]);
  });
  it('gives one button per link that is set, PayPal first', async () => {
    const links = await load({ NEXT_PUBLIC_DONATE_YOCO_URL: 'https://pay.yoco.com/r/abc', NEXT_PUBLIC_DONATE_PAYPAL_URL: 'https://paypal.me/crclan' });
    expect(links.map((l) => l.id)).toEqual(['paypal', 'yoco']);
  });
});

describe('art proxy (api/art): only official Clash Royale art, nothing else', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());
  const art = async (src: string) => (await import('@/app/api/art/route')).GET(req(`/api/art?src=${encodeURIComponent(src)}`));

  it('refuses other hosts, plain http, ports, credentials, internal addresses and non-PNG paths', async () => {
    for (const src of [
      'https://evil.example/a.png',
      'http://api-assets.clashroyale.com/cards/300/a.png',
      'https://api-assets.clashroyale.com:8443/a.png',
      'https://user:pw@api-assets.clashroyale.com/a.png',
      'https://api-assets.clashroyale.com.evil.example/a.png',
      'https://127.0.0.1/a.png',
      'https://169.254.169.254/latest/meta-data.png',
      'https://api-assets.clashroyale.com/a.svg',
      'file:///etc/passwd',
      'not a url',
    ]) {
      const res = await art(src);
      expect(res.status, src).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches official art without following redirects, and passes it through', async () => {
    fetchMock.mockResolvedValue(new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'content-type': 'image/png', 'content-length': '4' } }));
    const res = await art('https://api-assets.clashroyale.com/cards/300/knight.png');
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
  });

  it('refuses anything upstream that is not an image, or is too big', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { headers: { 'content-type': 'text/html' } }));
    expect((await art('https://api-assets.clashroyale.com/cards/300/a.png')).status).toBe(502);
    fetchMock.mockResolvedValueOnce(new Response('x', { headers: { 'content-type': 'image/png', 'content-length': '50000000' } }));
    expect((await art('https://api-assets.clashroyale.com/cards/300/a.png')).status).toBe(502);
  });
});

describe('API routes validate their input', () => {
  it('search caps the query at 40 characters and only accepts known scopes', async () => {
    const { GET } = await import('@/app/api/search/route');
    const { search } = await import('@/lib/search');
    await GET(req(`/api/search?q=${'a'.repeat(500)}&scope=admin`));
    expect(vi.mocked(search).mock.lastCall).toEqual(['a'.repeat(40), 'all', 6]);
    await GET(req('/api/search?q=x&scope=clan'));
    expect(vi.mocked(search).mock.lastCall?.[1]).toBe('clan');
  });

  it('summaries reject malformed tags without calling the API', async () => {
    const { GET } = await import('@/app/api/summary/player/[tag]/route');
    const { playerSummary } = await import('@/lib/summary');
    vi.mocked(playerSummary).mockClear();
    for (const tag of ['../../etc', 'ABC!', '%00', 'A'.repeat(40), '<script>']) {
      const res = await GET(req(`/api/summary/player/x`), { params: Promise.resolve({ tag }) } as never);
      expect(res.status, tag).toBe(400);
    }
    expect(playerSummary).not.toHaveBeenCalled();
  });

  it('badge-art needs the cron secret, then says so plainly when there is no database', async () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    const { GET } = await import('@/app/api/badge-art/route');
    expect((await GET(req('/api/badge-art'))).status).toBe(401);
    expect((await GET(req('/api/badge-art', { headers: { authorization: 'Bearer s3cret' } }))).status).toBe(503);
    vi.unstubAllEnvs();
  });

  it('every API route is rate limited', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const routes: string[] = [];
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name === 'route.ts' && routes.push(path.join(d, e.name))));
    walk(path.resolve('src/app'));
    for (const r of routes) {
      const src = fs.readFileSync(r, 'utf8');
      // The health check is free (no API, no DB); cron routes are locked behind the secret instead.
      if (r.includes(`${path.sep}up${path.sep}`)) continue;
      expect(/limitRequest\(|cronAuthorized\(/.test(src), r).toBe(true);
    }
  });
});
