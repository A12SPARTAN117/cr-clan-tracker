import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getPlayer, tags } from '@/lib/cr/api';
import { getPlayerHistory } from '@/lib/history';
import { metricsOf, type Metric } from '@/lib/player/goals';
import { getPlayerProfile } from '@/lib/player/profile';

export type GoalsPage = { ok: true; name: string; tag: string; metrics: Metric[]; today: string; trackedSince: string | null } | { ok: false; status: number };

/** The goals page's data, cached per player for a minute so the page reads nothing per request. */
export async function goalsPage(tag: string): Promise<GoalsPage> {
  'use cache';
  cacheTag(tags.player(tag));
  const r = await getPlayer(tag);
  if (!r.ok) {
    if (r.status === 404) cacheLife('cr');
    else cacheLife('crError');
    return { ok: false, status: r.status };
  }
  const [p, h] = await Promise.all([getPlayerProfile(tag), getPlayerHistory(tag)]);
  if (!p) {
    cacheLife('crError');
    return { ok: false, status: 0 };
  }
  cacheLife('crLive');
  const metrics = metricsOf({
    trophies: p.trophies,
    seasonalTrophies: p.seasonal?.trophies ?? null,
    polLeague: p.pol.current?.league ?? null,
    polRating: p.pol.current && p.pol.current.league >= 7 ? p.pol.current.rating : null,
    warWins: p.totals.warWins,
    wins: p.totals.wins,
    collectionLevel: p.collectionLevel,
    maxCards: p.collection.filter((x) => x.owned && x.level === 16).length,
    days: h?.days ?? [],
  });
  // The day of the profile read sets the pace window.
  return { ok: true, name: p.name, tag: p.tag, metrics, today: p.generatedAt.slice(0, 10), trackedSince: h?.trackedSince ?? null };
}
