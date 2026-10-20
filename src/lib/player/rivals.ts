import type { Battle } from '../cr/types';
import { outcome } from '../battle';
import { parseApiDate } from '../format';

/** One 1v1 game as Rivals counts it. */
export type H2HGame = { time: string; oppTag: string; oppName: string; oppClan: string | null; kind: string; result: -1 | 0 | 1; crowns: number; oppCrowns: number };

export type Rival = {
  tag: string;
  name: string;
  clan: string | null;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  /** Newest first, for the result strip. */
  results: (-1 | 0 | 1)[];
  lastMet: string;
  /** Game kinds they met in, most common first (ladder, ranked, friendly…). */
  kinds: string[];
};

export type Rivals = { rivals: Rival[]; games: number; since: string | null };

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

/**
 * A battle as a head-to-head game, or null when it has no single opponent: 2v2, and boat
 * battles (attacks on a clan's boat, not a game against the defender).
 */
export function h2hGame(b: Battle, kind: string): H2HGame | null {
  if (b.type === 'boatBattle' || b.team.length !== 1 || b.opponent.length !== 1) return null;
  const opp = b.opponent[0];
  const time = parseApiDate(b.battleTime);
  if (!opp?.tag || !time) return null;
  return { time: time.toISOString(), oppTag: bare(opp.tag), oppName: opp.name, oppClan: opp.clan?.name ?? null, kind, result: outcome(b), crowns: b.team[0].crowns, oppCrowns: opp.crowns };
}

/**
 * Opponents met at least `min` times, most games first (then the most recent). Games are
 * de-duplicated by time, so the stored history and the live log can simply be passed together.
 */
export function rivalsOf(games: H2HGame[], min = 2, limit = 8): Rivals {
  const unique = [...new Map(games.map((g) => [g.time, g])).values()].sort((a, b) => b.time.localeCompare(a.time));
  const by = new Map<string, H2HGame[]>();
  for (const g of unique) by.set(g.oppTag, [...(by.get(g.oppTag) ?? []), g]);
  const rivals = [...by.entries()]
    .filter(([, gs]) => gs.length >= min)
    .map(([tag, gs]): Rival => {
      const kinds = new Map<string, number>();
      for (const g of gs) kinds.set(g.kind, (kinds.get(g.kind) ?? 0) + 1);
      return {
        tag,
        name: gs[0].oppName,
        clan: gs[0].oppClan,
        games: gs.length,
        wins: gs.filter((g) => g.result > 0).length,
        losses: gs.filter((g) => g.result < 0).length,
        draws: gs.filter((g) => g.result === 0).length,
        results: gs.map((g) => g.result),
        lastMet: gs[0].time,
        kinds: [...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k),
      };
    })
    .sort((a, b) => b.games - a.games || b.lastMet.localeCompare(a.lastMet))
    .slice(0, limit);
  return { rivals, games: unique.length, since: unique.at(-1)?.time ?? null };
}
