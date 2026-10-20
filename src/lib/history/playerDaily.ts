import type { Player } from '../cr/types';

/**
 * A tracked player's profile as one daily snapshot row, and what changed between snapshots.
 * Pure, so the cron, the profile page and the tests share it.
 */

export type PlayerDay = {
  day: string; // YYYY-MM-DD (UTC)
  trophies: number;
  seasonalTrophies: number | null;
  polLeague: number | null;
  polRating: number | null;
  polRank: number | null;
  wins: number;
  battleCount: number;
  collectionLevel: number | null;
};

export function playerDayOf(p: Player, day: string): PlayerDay {
  const seasonal = Object.entries(p.progress ?? {}).find(([k]) => k.startsWith('seasonal-trophy-road'))?.[1];
  const pol = p.currentPathOfLegendSeasonResult;
  return {
    day,
    trophies: p.trophies,
    // Below the seasonal road the entry is missing or 0.
    seasonalTrophies: seasonal?.trophies || null,
    polLeague: pol?.leagueNumber ?? null,
    polRating: pol ? pol.trophies : null,
    polRank: pol?.rank ?? null,
    wins: p.wins,
    battleCount: p.battleCount,
    collectionLevel: p.collectionLevel ?? null,
  };
}

export type PlayerDayRow = PlayerDay & {
  /** The snapshot the changes are measured from (null for the first one). */
  prevDay: string | null;
  trophyChange: number | null;
  winsGained: number | null;
  battlesPlayed: number | null;
};

/** Snapshots (any order) → rows newest first, each with its change since the previous snapshot. */
export function withChanges(days: PlayerDay[]): PlayerDayRow[] {
  const asc = [...days].sort((a, b) => a.day.localeCompare(b.day));
  return asc
    .map((d, i) => {
      const prev = asc[i - 1];
      return {
        ...d,
        prevDay: prev?.day ?? null,
        trophyChange: prev ? d.trophies - prev.trophies : null,
        // Counters only go up; a drop means a bad read, so it shows as unknown.
        winsGained: prev && d.wins >= prev.wins ? d.wins - prev.wins : null,
        battlesPlayed: prev && d.battleCount >= prev.battleCount ? d.battleCount - prev.battleCount : null,
      };
    })
    .reverse();
}

/** Path of Legends snapshots where the league, rating or rank moved, newest first. */
export function polChanges(days: PlayerDay[]): PlayerDay[] {
  const asc = [...days].filter((d) => d.polLeague != null).sort((a, b) => a.day.localeCompare(b.day));
  const key = (d: PlayerDay) => `${d.polLeague}:${d.polRating}:${d.polRank}`;
  return asc.filter((d, i) => i === 0 || key(d) !== key(asc[i - 1])).reverse();
}
