import { clientIp } from './ip';

/**
 * Per-visitor limit for the pages that cost Clash Royale API calls to render (profiles, clans,
 * compare, search, tag lookups, deck stats). Used by src/proxy.ts. A person browsing never gets
 * near it; a script walking through random tags does, and would otherwise spend the API key's
 * shared rate limit for everyone.
 *
 * Next.js strips its own router headers (rsc, next-router-prefetch…) before the proxy runs, so a
 * link prefetch can't be told apart from a client-side navigation there. What the proxy can see
 * is the browser's Sec-Fetch-Dest: full page loads are "document", the app's own requests
 * (prefetches and in-app navigation) are "empty". Those get separate budgets: page loads a tight
 * one, app requests a far larger one, because one profile can prefetch dozens of links. A request
 * without the header (scripts, old clients) counts as a page load.
 */

export const PAGE_LIMIT = 60; // full page loads per minute, per IP
export const APP_LIMIT = 600; // prefetches + in-app navigations per minute, per IP
const WINDOW_MS = 60_000;
const MAX_KEYS = 20_000;

/** The pages that call the API when rendered. */
export const LIMITED_PAGES = /^\/(player|clan|t)\/|^\/(compare|search)(\/|$)|^\/decks\/[^/]+/;

type Window = { n: number; reset: number };
const g = globalThis as unknown as { __crPageHits?: Map<string, Window> };
const hits = (g.__crPageHits ??= new Map());

/** True for requests the app makes itself (prefetch, client-side navigation), not page loads. */
export const isAppRequest = (h: Headers) =>
  h.get('sec-fetch-dest') === 'empty' || h.get('next-router-prefetch') === '1' || h.get('rsc') === '1' || h.get('sec-purpose')?.includes('prefetch') === true;

/** Counts a page request. Returns 0 to let it through, or the seconds to wait. */
export function checkPage(pathname: string, h: Headers, now = Date.now()): number {
  if (!LIMITED_PAGES.test(pathname)) return 0;
  const app = isAppRequest(h);
  const key = `${app ? 'app' : 'page'}:${clientIp(h)}`;
  let w = hits.get(key);
  if (!w || w.reset <= now) {
    if (hits.size >= MAX_KEYS) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    if (hits.size >= MAX_KEYS) hits.clear();
    w = { n: 0, reset: now + WINDOW_MS };
    hits.set(key, w);
  }
  w.n++;
  return w.n > (app ? APP_LIMIT : PAGE_LIMIT) ? Math.max(1, Math.ceil((w.reset - now) / 1000)) : 0;
}

/** For tests. */
export const resetPageLimits = () => hits.clear();

/** The page a limited visitor sees: plain, self-contained, and it tries again by itself. */
export function slowDownPage(wait: number): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="${wait}"><title>Slow down · CR Clan Tracker</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#07080a;color:#f3f4f6;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px}h1{font:800 32px/1.1 ui-monospace,monospace;margin:0 0 10px}p{color:#a4a9b4;margin:0}</style></head><body><main><h1>Slow down</h1><p>That's a lot of pages in a minute. This page reloads itself in ${wait} seconds.</p></main></body></html>`;
}
