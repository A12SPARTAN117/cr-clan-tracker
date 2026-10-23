import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { anyFailed, getClan, getClanWarRankings, searchClans, tags, type ApiResult } from '@/lib/cr/api';
import type { Clan } from '@/lib/cr/types';
import { pool } from '@/lib/pool';
import type { ClanRow } from './ClanCard';

export type ClanList = { rows: ClanRow[]; title: string; failed: boolean };

type ClanFacts = { type: Clan['type']; requiredTrophies: number; members: number; location: string | undefined };

/**
 * The few fields a ranking row lacks, per clan, kept 30 minutes (they rarely change): the list
 * re-ranks every 5 minutes without re-reading 60 clans each time.
 */
async function clanFacts(tag: string): Promise<ApiResult<ClanFacts>> {
  'use cache';
  cacheTag(tags.clan(tag));
  const r = await getClan(tag);
  if (!r.ok) {
    if (r.status === 404) cacheLife('members');
    else cacheLife('crError');
    return r;
  }
  cacheLife('members');
  const c = r.data;
  return { ok: true, data: { type: c.type, requiredTrophies: c.requiredTrophies, members: c.members, location: c.location?.name } };
}

/**
 * Clans by name (3+ characters) or, without one, the top war clans of a location (or the world),
 * each with its own record merged in (type, members, required trophies; rankings lack them).
 * Cached per name and location, so the default list is part of the static /clans page and other
 * lists come from /api/clans, which the CDN keeps. Type, members and war trophies filter in the
 * browser.
 */
export async function clanList(q: string, loc: number | null): Promise<ClanList> {
  'use cache';
  if (q.length >= 3) {
    const r = await searchClans({ name: q, locationId: loc ?? undefined, limit: 100 });
    if (r.ok) cacheLife('cr');
    else cacheLife('crError');
    return { rows: r.ok ? r.data.items.map((c) => ({ ...c, location: c.location?.name })) : [], title: `Clans named "${q}"`, failed: !r.ok };
  }
  const r = await getClanWarRankings(loc ?? 'global', 60);
  if (!r.ok) {
    cacheLife('crError');
    return { rows: [], title: 'Top war clans', failed: true };
  }
  const own = await pool(r.data.items, 10, (c) => clanFacts(c.tag.replace('#', '')));
  if (anyFailed(own)) cacheLife('crError');
  else cacheLife('cr');
  const rows = r.data.items.map((c, i): ClanRow => {
    const d = own[i]?.ok ? own[i].data : null;
    return {
      tag: c.tag,
      name: c.name,
      badgeId: c.badgeId,
      rank: c.rank,
      members: d?.members ?? c.members,
      // In the clan-war ranking, clanScore holds the war trophies.
      clanWarTrophies: c.clanScore ?? c.clanWarTrophies,
      location: d?.location ?? c.location?.name,
      ...(d ? { type: d.type, requiredTrophies: d.requiredTrophies } : {}),
    };
  });
  return { rows, title: 'Top war clans', failed: false };
}
