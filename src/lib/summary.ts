import 'server-only';
import { getBattleLog, getClan, getCurrentRiverRace, getPlayer } from './cr/api';
import { streakOf } from './player/profile';
import { cardById, type Rarity } from './cards';
import { parseApiDate } from './format';
import type { ApiRole } from './cr/types';
import { seasonalOf } from './player/trophies';

export type PlayerSummary = {
  tag: string;
  name: string;
  trophies: number;
  role: ApiRole | null;
  clan: { tag: string; name: string } | null;
  streak: number;
  league: number | null;
  rating: number | null;
  favourite: { slug: string; rarity: Rarity; img: string | null } | null;
};

export type ClanSummary = {
  tag: string;
  name: string;
  badgeId: number;
  members: number;
  inactive: number;
  fame: number | null;
  raceRank: number | null;
};

export async function playerSummary(tag: string): Promise<PlayerSummary | null> {
  const [r, log] = await Promise.all([getPlayer(tag), getBattleLog(tag)]);
  if (!r.ok) return null;
  const p = r.data;
  const fav = p.currentFavouriteCard ? cardById(p.currentFavouriteCard.id) : undefined;
  const pol = p.currentPathOfLegendSeasonResult;
  return {
    tag: p.tag.replace('#', ''),
    name: p.name,
    // The seasonal road count once they are on it, as on the player page.
    trophies: seasonalOf(p)?.trophies ?? p.trophies,
    role: p.role ?? null,
    clan: p.clan ? { tag: p.clan.tag.replace('#', ''), name: p.clan.name } : null,
    // Same count as the player page; the API's own currentWinLoseStreak lags behind the battle log.
    streak: log.ok ? streakOf(log.data) : (p.currentWinLoseStreak ?? 0),
    league: pol?.leagueNumber ?? null,
    // Only Ultimate Champion has a rating; below it the API sends progress (usually 0).
    rating: pol && pol.leagueNumber >= 7 ? pol.trophies : null,
    favourite: fav ? { slug: fav.slug, rarity: fav.rarity, img: fav.icons.normal } : null,
  };
}

export async function clanSummary(tag: string, now: number): Promise<ClanSummary | null> {
  const [r, race] = await Promise.all([getClan(tag), getCurrentRiverRace(tag)]);
  if (!r.ok) return null;
  const c = r.data;
  const inactive = c.memberList.filter((m) => now - (parseApiDate(m.lastSeen)?.getTime() ?? now) >= 72 * 3600_000).length;
  let fame: number | null = null;
  let raceRank: number | null = null;
  if (race.ok) {
    const ours = race.data.clans.find((x) => x.tag === c.tag) ?? race.data.clan;
    fame = ours?.fame ?? null;
    const sorted = [...race.data.clans].sort((a, b) => b.fame - a.fame);
    const idx = sorted.findIndex((x) => x.tag === c.tag);
    raceRank = idx >= 0 ? idx + 1 : null;
  }
  return { tag: c.tag.replace('#', ''), name: c.name, badgeId: c.badgeId, members: c.members, inactive, fame, raceRank };
}
