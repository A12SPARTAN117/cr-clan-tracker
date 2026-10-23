import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { fetchPlayer, tags, type ApiResult } from '../cr/api';

/** What the clan pages show from a member's own profile. */
export type MemberProfile = { exp: number; coll: number | null; league: number | null; polTrophies: number | null };

/**
 * A member's profile facts, cached per member for 30 minutes (the `members` profile): a clan page
 * needs about 50 of them, the dashboard and the clan page share them, and a roster change only
 * fetches the newcomers. Callers wrap this in unlessBusy, so a skip is never cached.
 */
export async function memberProfile(tag: string): Promise<ApiResult<MemberProfile>> {
  'use cache';
  cacheTag(tags.player(tag));
  const r = await fetchPlayer(tag);
  if (!r.ok) {
    if (r.status === 404) cacheLife('members');
    else cacheLife('crError');
    return r;
  }
  cacheLife('members');
  const pol = r.data.currentPathOfLegendSeasonResult;
  return {
    ok: true,
    data: { exp: r.data.expLevel, coll: r.data.collectionLevel ?? null, league: pol?.leagueNumber ?? null, polTrophies: pol?.trophies ?? null },
  };
}
