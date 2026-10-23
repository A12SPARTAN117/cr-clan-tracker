import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { packCards, type Packed } from '@/lib/cardPack';
import { getPlayer, tags } from '@/lib/cr/api';
import { getPlayerHistory } from '@/lib/history';
import { getGames } from '@/lib/history/battles';
import { getIdentityHistory } from '@/lib/history/snapshot';
import { insightsOf } from '@/lib/player/insights';
import { getPlayerProfile } from '@/lib/player/profile';
import { rivalsOf } from '@/lib/player/rivals';
import type { PlayerData } from './PlayerView';

export type PlayerPage = { ok: true; data: Packed<PlayerData> } | { ok: false; status: number };

/**
 * Everything a profile page shows, cached per player for a minute (the battle log's pace). The
 * page uses nothing else per request, so each player's page is rendered once a minute at most
 * however many people open it, and a CDN can serve it in between. Writes a view used to trigger
 * (tracking, stored games) go through /api/seen instead; live event ranks load in the Badges tab.
 */
export async function playerPage(tag: string): Promise<PlayerPage> {
  'use cache';
  cacheTag(tags.player(tag));
  const r = await getPlayer(tag);
  if (!r.ok) {
    if (r.status === 404) cacheLife('cr');
    else cacheLife('crError');
    return { ok: false, status: r.status };
  }
  const [p, history, games, names] = await Promise.all([getPlayerProfile(tag), getPlayerHistory(tag), getGames(tag), getIdentityHistory(tag)]);
  if (!p) {
    cacheLife('crError');
    return { ok: false, status: 0 };
  }
  cacheLife('crLive');
  // Rivals, elixir, close games, playstyle, tilt and achievements all come from the same games.
  return { ok: true, data: packCards({ p, history, rivals: rivalsOf(games), insights: insightsOf(games, p.war), names }) };
}
