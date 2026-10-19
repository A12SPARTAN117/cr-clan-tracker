import 'server-only';
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

/**
 * Typed, cached access to the official Clash Royale API (through the RoyaleAPI proxy).
 * Every call returns a result object instead of throwing, so pages can render precise
 * empty / not-found / error states. Successful responses are cached with the `cr` or
 * `crLive` profiles from next.config.ts; failures with the short `crError` profile.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; reason: string };

const BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';

export const enc = (tag: string) => encodeURIComponent('#' + tag.replace(/^#/, '').toUpperCase());

/** Cache tags, so the dashboard's Refresh button can revalidate exactly one clan. */
export const tags = {
  player: (tag: string) => `player:${tag.replace(/^#/, '').toUpperCase()}`,
  clan: (tag: string) => `clan:${tag.replace(/^#/, '').toUpperCase()}`,
};

async function request<T>(path: string): Promise<ApiResult<T>> {
  const key = process.env.CR_API_KEY;
  if (!key) return { ok: false, status: 0, reason: 'CR_API_KEY is not set' };
  try {
    const res = await fetch(BASE + path, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true, data: (await res.json()) as T };
    let reason = res.statusText;
    try {
      const body = (await res.json()) as { reason?: string; message?: string };
      reason = body.reason || body.message || reason;
    } catch {}
    return { ok: false, status: res.status, reason };
  } catch (e) {
    return { ok: false, status: 0, reason: e instanceof Error ? e.message : 'network error' };
  }
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

export async function getBattleLog(tag: string) {
  'use cache';
  cacheTag(tags.player(tag));
  return settle(await request<Battle[]>(`/players/${enc(tag)}/battlelog`), 'crLive');
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

export async function getRiverRaceLog(tag: string, limit = 10) {
  'use cache';
  cacheTag(tags.clan(tag));
  return settle(await request<Paged<RiverRaceLogEntry>>(`/clans/${enc(tag)}/riverracelog?limit=${limit}`), 'cr');
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

export async function getLocations() {
  'use cache';
  const r = await request<Paged<Location>>(`/locations?limit=300`);
  if (r.ok) cacheLife('days');
  else cacheLife('crError');
  return r;
}
