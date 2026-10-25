import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { packCards, type Packed } from '@/lib/cardPack';
import { getPlayer, tags } from '@/lib/cr/api';
import { getPlayerHistory } from '@/lib/history';
import { getGames } from '@/lib/history/battles';
import { getIdentityHistory } from '@/lib/history/snapshot';
import { readStoredPlayer, saveStoredPlayer } from '@/lib/history/stored';
import { insightsOf } from '@/lib/player/insights';
import { liteOf, type PlayerLite } from '@/lib/player/lite';
import { getPlayerProfile } from '@/lib/player/profile';
import { rivalsOf } from '@/lib/player/rivals';
import { onceEvery, VIEW_WRITE_MS } from '@/lib/throttle';
import type { PlayerData } from './PlayerView';

/**
 * A player's name for page titles, kept as long as their pages (a shorter-lived read in a title
 * would make the whole page refresh at its pace).
 */
export async function playerName(tag: string): Promise<string | null> {
  'use cache';
  cacheTag(tags.player(tag));
  const r = await getPlayer(tag);
  if (!r.ok && r.status !== 404) cacheLife('crError');
  else cacheLife('pageTenMinutes');
  return r.ok ? r.data.name : null;
}

export type PlayerPage ={ ok: true; data: Packed<PlayerData> } | { ok: false; status: number };

/** The page's data around a profile: stored history, games (stored + the live log when it loads), names. */
async function around(tag: string, p: PlayerLite, stale: string | null): Promise<Packed<PlayerData>> {
  const [history, games, names] = await Promise.all([getPlayerHistory(tag), getGames(tag), getIdentityHistory(tag)]);
  // Rivals, elixir, close games, playstyle, tilt and achievements all come from the same games.
  return packCards({ p, history, rivals: rivalsOf(games), insights: insightsOf(games, p.war), names, stale });
}

/**
 * Everything a profile page shows, cached per player for 10 minutes. The page uses nothing else
 * per request, so each player's page is rendered once every 10 minutes at most however many
 * people open it, and a CDN can serve it in between. Writes a view used to trigger
 * (tracking, stored games) go through /api/seen instead; live event ranks load in the Badges tab.
 *
 * While the Clash Royale API is busy or failing, a player seen before is shown from their stored
 * copy (lib/history/stored), marked with its age, and the page tries again within seconds.
 */
export async function playerPage(tag: string): Promise<PlayerPage> {
  'use cache';
  cacheTag(tags.player(tag));
  const r = await getPlayer(tag);
  if (r.ok) {
    const p = await getPlayerProfile(tag);
    if (p) {
      cacheLife('pageTenMinutes');
      const lite = liteOf(p);
      // The stored copy follows the live profile, at most every 15 minutes per player.
      if (onceEvery(`store:${tag}`, VIEW_WRITE_MS)) void saveStoredPlayer(tag, lite);
      // The page carries what Overview shows; the other tabs load the full profile (/api/player/[tag]).
      return { ok: true, data: await around(tag, lite, null) };
    }
  } else if (r.status === 404) {
    cacheLife('cr');
    return { ok: false, status: 404 };
  }
  cacheLife('crError');
  const stored = await readStoredPlayer(tag);
  if (stored) return { ok: true, data: await around(tag, stored.p, stored.savedAt) };
  return { ok: false, status: r.ok ? 0 : r.status };
}
