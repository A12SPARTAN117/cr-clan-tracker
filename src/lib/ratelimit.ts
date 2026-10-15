import 'server-only';
import { headers } from 'next/headers';

/**
 * Small per-key request limiter for the endpoints that are cheap to call in a loop (typeahead,
 * summaries, art, refresh buttons). Each uncached call costs a Clash Royale API request, and the
 * key has a shared rate limit, so one script hammering us would break the site for everyone.
 *
 * Counters live in this server's memory: exact on a long-running server, per-instance on
 * serverless hosts (still enough to stop a single client looping). For page-level limits, add
 * a rate-limit rule at the host or CDN (Cloudflare, Vercel Firewall).
 */

type Window = { n: number; reset: number };

const g = globalThis as unknown as { __crLimits?: Map<string, Window> };
const hits = (g.__crLimits ??= new Map());

/** Above this many keys, expired windows are swept so the map can't grow without bound. */
const MAX_KEYS = 20_000;

function sweep(now: number) {
  for (const [k, w] of hits) if (w.reset <= now) hits.delete(k);
  if (hits.size > MAX_KEYS) hits.clear();
}

/** Counts one hit for `key`. Returns 0 when allowed, otherwise the seconds until it resets. */
export function hit(key: string, max: number, windowMs: number): number {
  const now = Date.now();
  let w = hits.get(key);
  if (!w || w.reset <= now) {
    if (hits.size >= MAX_KEYS) sweep(now);
    w = { n: 0, reset: now + windowMs };
    hits.set(key, w);
  }
  w.n++;
  return w.n > max ? Math.ceil((w.reset - now) / 1000) : 0;
}

/** The visitor's IP as reported by the host's proxy (first X-Forwarded-For entry). */
export function clientIp(h: Headers): string {
  return h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}

/** Per-IP limits, per minute, for each kind of endpoint. */
export const LIMITS = {
  search: 40,
  summary: 60,
  art: 150,
  route: 40,
  refresh: 10,
} as const;

/**
 * For the Refresh buttons (server actions): each player/clan can be refreshed once per 20 s
 * by anyone, and each visitor gets 10 refreshes a minute. A blocked refresh just keeps the
 * cached data, which is at most 20 s old anyway.
 */
export async function allowRefresh(key: string): Promise<boolean> {
  if (hit(`refresh:${clientIp(await headers())}`, LIMITS.refresh, 60_000)) return false;
  return !hit(`refresh-key:${key}`, 1, 20_000);
}

/** Rate-limits a request by IP. Returns a 429 response to send back, or null to carry on. */
export function limitRequest(req: Request, kind: keyof typeof LIMITS): Response | null {
  const wait = hit(`${kind}:${clientIp(req.headers)}`, LIMITS[kind], 60_000);
  if (!wait) return null;
  return new Response('Too many requests. Please slow down.', {
    status: 429,
    headers: { 'Retry-After': String(wait), 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
