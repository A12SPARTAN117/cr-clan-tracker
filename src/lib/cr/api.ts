import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { cacheLife, cacheTag } from 'next/cache';
import type {
  Battle,
  Clan,
  ClanRanking,
  ClanSearchItem,
  CurrentRiverRace,
  EventLeaderboard,
  EventRanked,
  Location,
  Paged,
  Player,
  PolRankedPlayer,
  RiverRaceLogEntry,
} from './types';
import { cardById } from '../cards';
import { limiter } from './limiter';

/**
 * Typed, cached access to the official Clash Royale API (through the RoyaleAPI proxy).
 * Every call returns a result object instead of throwing, so pages can render precise
 * empty / not-found / error states. Successful responses are cached with the `cr` or
 * `crLive` profiles from next.config.ts; failures with the short `crError` profile.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; reason: string };

// Settings are trimmed: a key pasted into a host's dashboard often brings a space or line break.
const BASE = (process.env.CR_API_BASE?.trim() || 'https://proxy.royaleapi.dev/v1').replace(/\/+$/, '');

export const enc = (tag: string) => encodeURIComponent('#' + tag.replace(/^#/, '').toUpperCase());

/** Cache tags, so the dashboard's Refresh button can revalidate exactly one clan. */
export const tags = {
  player: (tag: string) => `player:${tag.replace(/^#/, '').toUpperCase()}`,
  clan: (tag: string) => `clan:${tag.replace(/^#/, '').toUpperCase()}`,
};

// On globalThis: each route is bundled on its own, and module state isn't shared between bundles.
const g = globalThis as unknown as { __crBackground?: AsyncLocalStorage<true> };
const background = (g.__crBackground ??= new AsyncLocalStorage<true>());

/** Runs `work` as background work (the cron jobs): its API calls wait until visitors' calls are through. */
export const inBackground = <T>(work: () => Promise<T>): Promise<T> => background.run(true, work);

const BUSY = { ok: false, status: 503, reason: 'The Clash Royale API is busy; try again in a moment' } as const;
const SKIPPED = { ok: false, status: 503, reason: 'Skipped while the Clash Royale API is busy' } as const;

/**
 * For the optional per-member calls behind clan pages (member levels, the dashboard's 50 profiles
 * and battle logs): skipped while visitors' calls are queued more than a second deep, so a new
 * clan can't take the whole budget from everyone else. A skip is never cached (the call isn't
 * made); the page shows what it has, and its own short error lifetime retries soon.
 */
export function unlessBusy<T>(call: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
  return limiter.backlog() > 1000 ? Promise.resolve(SKIPPED) : call();
}

/**
 * Answers worth one more try: the proxy's Cloudflare front fails 1–2% of calls at any pace (520,
 * 525…, measured 2026-10-23), and plain 5xx or network blips. Not 429 (the limiter handles it).
 */
const TRANSIENT = (status: number) => status === 0 || status === 500 || status === 502 || status === 504 || (status >= 520 && status <= 527);

async function request<T>(path: string): Promise<ApiResult<T>> {
  const key = process.env.CR_API_KEY?.trim();
  if (!key) return { ok: false, status: 0, reason: 'CR_API_KEY is not set' };
  const opts = { background: background.getStore() === true, onBusy: () => ({ status: 503, result: BUSY as ApiResult<T> }) };
  // Every call goes through the shared gate (rate, visitor-first, 429 back-off, shedding when busy).
  const once = () => limiter.run(async () => {
    try {
      const res = await fetch(BASE + path, {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return { status: res.status, result: { ok: true, data: (await res.json()) as T } as ApiResult<T> };
      let reason = res.statusText;
      try {
        const body = (await res.json()) as { reason?: string; message?: string };
        reason = body.reason || body.message || reason;
      } catch {}
      return { status: res.status, retryAfter: Number(res.headers.get('retry-after')) || null, result: { ok: false, status: res.status, reason } as ApiResult<T> };
    } catch (e) {
      return { status: 0, result: { ok: false, status: 0, reason: e instanceof Error ? e.message : 'network error' } as ApiResult<T> };
    }
  }, opts);
  let r = await once();
  if (TRANSIENT(r.status)) {
    await new Promise((ok) => setTimeout(ok, 300));
    r = await once();
  }
  return r.result;
}

/** Applies the right lifetime: `profile` on success or 404, `crError` otherwise. */
function settle<T>(r: ApiResult<T>, profile: 'cr' | 'crLive'): ApiResult<T> {
  if (!r.ok && r.status !== 404) cacheLife('crError');
  else if (profile === 'crLive') cacheLife('crLive');
  else cacheLife('cr');
  return r;
}

/**
 * True when any of these calls failed for a reason other than 404. A cache built on top of them
 * sets its own `cacheLife`, which overrides theirs, so it must check this and use `crError`
 * itself, or one rate-limited call sticks for the whole lifetime.
 */
export function anyFailed(rs: readonly (ApiResult<unknown> | null)[]): boolean {
  return rs.some((r) => r !== null && !r.ok && r.status !== 404);
}

export async function getPlayer(tag: string) {
  'use cache';
  cacheTag(tags.player(tag));
  return settle(await request<Player>(`/players/${enc(tag)}`), 'cr');
}

/**
 * Cached entries are stored serialized and decoded on every read, so the two biggest answers are
 * slimmed first. A battle log's deck cards drop their image URLs when the card table has the
 * card (about half the log's size; toDeckCard takes the table's art); tower troops keep theirs.
 */
function slimLog(log: Battle[]): Battle[] {
  for (const b of log)
    for (const side of [...b.team, ...b.opponent])
      for (const c of side.cards ?? []) if (cardById(c.id)) c.iconUrls = {} as typeof c.iconUrls;
  return log;
}

export async function getBattleLog(tag: string) {
  'use cache';
  cacheTag(tags.player(tag));
  const r = await request<Battle[]>(`/players/${enc(tag)}/battlelog`);
  return settle(r.ok ? { ...r, data: slimLog(r.data) } : r, 'crLive');
}

export async function getClan(tag: string) {
  'use cache';
  cacheTag(tags.clan(tag));
  return settle(await request<Clan>(`/clans/${enc(tag)}`), 'cr');
}

export async function getCurrentRiverRace(tag: string) {
  'use cache';
  cacheTag(tags.clan(tag));
  return settle(await request<CurrentRiverRace>(`/clans/${enc(tag)}/currentriverrace`), 'crLive');
}

/**
 * A race log lists every clan's participants in every race (about 300 KB); only the asking
 * clan's are ever read (dashboard, profile, recap, player war history). Other clans keep their
 * standing, without the participant lists.
 */
export async function getRiverRaceLog(tag: string, limit = 10) {
  'use cache';
  cacheTag(tags.clan(tag));
  const r = await request<Paged<RiverRaceLogEntry>>(`/clans/${enc(tag)}/riverracelog?limit=${limit}`);
  if (r.ok) {
    const ours = enc(tag);
    for (const e of r.data.items) for (const s of e.standings) if (encodeURIComponent(s.clan.tag) !== ours) s.clan.participants = [];
  }
  return settle(r, 'cr');
}

/** Clan search. The API needs at least one filter; a name must be 3+ characters. */
export async function searchClans(opts: { name?: string; locationId?: number; minMembers?: number; limit?: number }) {
  'use cache';
  const q = new URLSearchParams({ limit: String(opts.limit ?? 30) });
  if (opts.name) q.set('name', opts.name);
  if (opts.locationId) q.set('locationId', String(opts.locationId));
  if (opts.minMembers) q.set('minMembers', String(opts.minMembers));
  return settle(await request<Paged<ClanSearchItem>>(`/clans?${q}`), 'cr');
}

/** Path of Legends ranked leaderboard ("global" or a location id). */
export async function getPolLeaderboard(location: string | number = 'global', limit = 100) {
  'use cache';
  return settle(await request<Paged<PolRankedPlayer>>(`/locations/${location}/pathoflegend/players?limit=${limit}`), 'cr');
}

export async function getClanRankings(location: string | number = 'global', limit = 100) {
  'use cache';
  return settle(await request<Paged<ClanRanking>>(`/locations/${location}/rankings/clans?limit=${limit}`), 'cr');
}

export async function getClanWarRankings(location: string | number = 'global', limit = 100) {
  'use cache';
  return settle(await request<Paged<ClanRanking>>(`/locations/${location}/rankings/clanwars?limit=${limit}`), 'cr');
}

/** Event leaderboards (2v2 League, Merge Tactics, Touchdown…). Many entries have no name. */
export async function getEventLeaderboards() {
  'use cache';
  return settle(await request<Paged<EventLeaderboard>>('/leaderboards'), 'cr');
}

export async function getEventLeaderboard(id: number, limit = 100) {
  'use cache';
  return settle(await request<Paged<EventRanked>>(`/leaderboard/${id}?limit=${limit}`), 'cr');
}

/**
 * Everyone on an event leaderboard (the API goes about 10,000 deep) as tag → [rank, score], so a
 * player's place can be looked up. Cached in this compact form instead of the full listing.
 */
export async function getEventRankIndex(id: number): Promise<Record<string, [number, number]> | null> {
  'use cache';
  const r = await request<Paged<EventRanked>>(`/leaderboard/${id}?limit=10000`);
  if (!r.ok) {
    if (r.status === 404) cacheLife('cr');
    else cacheLife('crError');
    return null;
  }
  cacheLife('cr');
  return Object.fromEntries(r.data.items.map((p) => [p.tag.replace(/^#/, '').toUpperCase(), [p.rank, p.score]]));
}

export async function getLocations() {
  'use cache';
  const r = await request<Paged<Location>>(`/locations?limit=300`);
  if (r.ok) cacheLife('days');
  else cacheLife('crError');
  return r;
}
