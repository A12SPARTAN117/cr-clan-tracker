import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getClanProfile, type ClanProfile } from '@/lib/clan/profile';
import { getClan, tags } from '@/lib/cr/api';
import { getClanHistory } from '@/lib/history';

export type ClanPage = { ok: true; c: ClanProfile } | { ok: false; status: number };

/**
 * Everything the clan profile shows except member levels (which stream in from their own cache),
 * cached per clan for 10 minutes, so the page reads nothing per request. Roster indexing for name
 * search goes through /api/seen.
 */
export async function clanPage(tag: string): Promise<ClanPage> {
  'use cache';
  cacheTag(tags.clan(tag));
  const r = await getClan(tag);
  if (!r.ok) {
    if (r.status === 404) cacheLife('cr');
    else cacheLife('crError');
    return { ok: false, status: r.status };
  }
  const [data, history] = await Promise.all([getClanProfile(tag), getClanHistory(tag)]);
  if (!data) {
    cacheLife('crError');
    return { ok: false, status: 0 };
  }
  cacheLife('pageTenMinutes');
  return { ok: true, c: history ? { ...data, history: { trackedSince: history.trackedSince, events: history.rosterEvents } } : data };
}
