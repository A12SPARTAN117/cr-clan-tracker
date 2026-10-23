import 'server-only';
import { cacheLife } from 'next/cache';
import { anyFailed, getClan, getClanWarRankings, searchClans } from '@/lib/cr/api';
import { pool } from '@/lib/pool';
import type { ClanRow } from './ClanCard';

export type ClanList = { rows: ClanRow[]; title: string; failed: boolean };

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
  const own = await pool(r.data.items, 10, (c) => getClan(c.tag.replace('#', '')));
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
      location: d?.location?.name ?? c.location?.name,
      ...(d ? { type: d.type, requiredTrophies: d.requiredTrophies } : {}),
    };
  });
  return { rows, title: 'Top war clans', failed: false };
}
