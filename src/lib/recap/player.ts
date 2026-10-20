import type { PlayerHistory } from '../history';
import type { BattleRow, LeveledCard, PlayerProfile } from '../player/profile';
import { cardBySlug } from '../cards';
import { characterFor } from '../characters';
import { polLabel } from '../leagues';

/**
 * A player's season recap, built only from what the API and our snapshots actually hold.
 * Pure (no server code), so tests can feed it a profile. Every partial number says what it
 * covers: the battle log holds about 40 battles and snapshots start when a profile is first opened.
 */

/** `league` is null when it isn't on the live 1–7 ladder (an old Challenger league, or only a lower bound). */
export type RecapPol = { league: number | null; leagueName: string; rating: number | null; rank: number | null } | null;

export type PlayerRecap = {
  tag: string;
  name: string;
  clan: string | null;
  /** "2026-10" from the seasonal trophy road entry; null when the player isn't on it. */
  season: string | null;
  trophies: { value: number; best: number; seasonal: boolean };
  pol: { current: RecapPol; best: RecapPol };
  career: { wins: number; losses: number; winRate: number | null; threeCrown: number };
  favourite: { name: string; img: string | null } | null;
  /** The most played deck in the battle log (2+ games), else the current deck. */
  deck: { label: 'most' | 'current'; name: string; cards: { name: string; img: string | null }[]; games: number; wins: number } | null;
  mastery: { name: string; img: string | null; level: number; maxLevel: number } | null;
  badges: number;
  /** Longest win run in the battle log, counted like the page's streak (friendlies, boats, draws skipped). */
  bestRun: number;
  /** Battles in the log: the window bestRun and deck cover. */
  logBattles: number;
  /** Since the first snapshot of this player's profile; null without one older than today. */
  tracked: { since: string; wins: number; battles: number } | null;
  /** When this player's daily snapshots began; null when they aren't tracked (or no database). */
  trackedSince: string | null;
  generatedAt: string;
};

function recapPol(x: PlayerProfile['pol']['current']): RecapPol {
  if (!x) return null;
  // Below Ultimate Champion the API's number is progress in the league, not a rating.
  return { league: x.atLeast || x.league < 1 ? null : x.league, leagueName: polLabel(x), rating: x.league >= 7 ? x.rating : null, rank: x.rank };
}

/** The longest run of wins, skipping the games the page's streak skips. */
export function longestWinRun(battles: BattleRow[]): number {
  let best = 0;
  let run = 0;
  for (const b of battles) {
    if (b.kind === 'friendly' || b.kind === 'boat' || b.result === 'draw') continue;
    run = b.result === 'win' ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

/** Card art for a slug: the API's own icon for the form the card was played in, else ours. */
const cardImg = (c: Pick<LeveledCard, 'slug' | 'img'>) => c.img ?? cardBySlug(c.slug)?.icons.normal ?? null;

export function playerRecap(p: PlayerProfile, h: PlayerHistory | null, season: string | null): PlayerRecap {
  const { wins, losses } = p.totals;
  const most = p.decks[0];
  let deck: PlayerRecap['deck'] = null;
  if (most && most.games >= 2) deck = { label: 'most', name: most.name, cards: most.cards.map((c) => ({ name: c.name, img: cardImg(c) })), games: most.games, wins: most.wins };
  else if (p.deck) deck = { label: 'current', name: p.deck.name, cards: p.deck.cards.map((c) => ({ name: c.name, img: cardImg(c) })), games: 0, wins: 0 };

  const top = p.mastery[0];
  const fav = p.favourite;

  // Counters only go up; a drop means a bad snapshot, so nothing is shown.
  let tracked: PlayerRecap['tracked'] = null;
  const first = h?.days[0];
  const today = p.generatedAt.slice(0, 10);
  if (first && first.day < today && p.totals.wins >= first.wins && p.totals.battleCount >= first.battleCount) {
    tracked = { since: first.day, wins: p.totals.wins - first.wins, battles: p.totals.battleCount - first.battleCount };
  }

  return {
    tag: p.tag,
    name: p.name,
    clan: p.clan?.name ?? null,
    season,
    trophies: p.seasonal ? { value: p.seasonal.trophies, best: p.seasonal.best, seasonal: true } : { value: p.trophies, best: p.bestTrophies, seasonal: false },
    pol: { current: recapPol(p.pol.current), best: recapPol(p.pol.best) },
    career: { wins, losses, winRate: wins + losses ? (wins / (wins + losses)) * 100 : null, threeCrown: p.totals.threeCrown },
    favourite: fav ? { name: fav.name, img: fav.render ?? characterFor(fav.slug) ?? cardBySlug(fav.slug)?.icons.normal ?? null } : null,
    deck,
    mastery: top ? { name: top.name, img: cardBySlug(top.slug)?.icons.normal ?? null, level: top.level, maxLevel: top.maxLevel } : null,
    badges: p.badges.length,
    bestRun: longestWinRun(p.battles),
    logBattles: p.battles.length,
    tracked,
    trackedSince: h?.trackedSince ?? null,
    generatedAt: p.generatedAt,
  };
}

/** "seasonal-trophy-road-202610" in a raw profile's progress → "2026-10". */
export function seasonOf(progress: Record<string, unknown> | undefined): string | null {
  for (const k of Object.keys(progress ?? {})) {
    const m = /^seasonal-trophy-road-(\d{4})(\d{2})$/.exec(k);
    if (m) return `${m[1]}-${m[2]}`;
  }
  return null;
}
