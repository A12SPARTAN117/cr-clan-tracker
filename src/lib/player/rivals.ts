import type { Battle } from '../cr/types';
import { outcome } from '../battle';
import { cardById, playedAsEvo, playedAsHero, realLevel } from '../cards';
import { parseApiDate } from '../format';

/**
 * One 1v1 game as Rivals and Insights count it. The fields after `oppCrowns` are null for games
 * stored before the site kept them.
 */
export type H2HGame = {
  time: string;
  oppTag: string;
  oppName: string;
  oppClan: string | null;
  kind: string;
  result: -1 | 0 | 1;
  crowns: number;
  oppCrowns: number;
  /** Elixir wasted at full elixir. */
  leak?: number | null;
  /** Hit points left on each side's surviving towers, king first ("7728,4337,4629"); "" when none. */
  towers?: string | null;
  oppTowers?: string | null;
  /** Card ids, "e" after an evo slot, "h" after a hero slot. */
  deck?: string | null;
  /** Opponent's card levels minus the player's, summed over the eight cards (+ = out-levelled). */
  levelGap?: number | null;
};

type Side = Battle['team'][number];
/** "7728,4337,4629": king then princess towers still standing ("" when every tower fell). */
const towersOf = (s: Side) => (s.kingTowerHitPoints ? [s.kingTowerHitPoints, ...(s.princessTowersHitPoints ?? [])] : []).join(',');
const levelSum = (s: Side) => s.cards.reduce((a, c) => a + (c.level && c.maxLevel ? realLevel(c.level, c.maxLevel) : 0), 0);
const deckOf = (s: Side) => s.cards.map((c) => `${c.id}${playedAsEvo(c.evolutionLevel) ? 'e' : playedAsHero(c.evolutionLevel) ? 'h' : ''}`).join(',');

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
  /** Every game against them, newest first. */
  log: Pick<H2HGame, 'time' | 'kind' | 'result' | 'crowns' | 'oppCrowns'>[];
};

/** `games`: every 1v1 game on record; `opponents`: how many different players those were against. */
export type Rivals = { rivals: Rival[]; games: number; opponents: number; since: string | null };

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
  const me = b.team[0];
  const full = me.cards?.length === 8 && opp.cards?.length === 8;
  return {
    time: time.toISOString(),
    oppTag: bare(opp.tag),
    oppName: opp.name,
    oppClan: opp.clan?.name ?? null,
    kind,
    result: outcome(b),
    crowns: me.crowns,
    oppCrowns: opp.crowns,
    leak: me.elixirLeaked ?? null,
    towers: towersOf(me),
    oppTowers: towersOf(opp),
    deck: me.cards?.length ? deckOf(me) : null,
    // Only when both decks are complete and every level is known.
    levelGap: full && me.cards.every((c) => c.level) && opp.cards.every((c) => c.level) && cardById(me.cards[0].id) ? levelSum(opp) - levelSum(me) : null,
  };
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
        log: gs.map(({ time, kind, result, crowns, oppCrowns }) => ({ time, kind, result, crowns, oppCrowns })),
      };
    })
    .sort((a, b) => b.games - a.games || b.lastMet.localeCompare(a.lastMet))
    .slice(0, limit);
  return { rivals, games: unique.length, opponents: by.size, since: unique.at(-1)?.time ?? null };
}
