import type { Player } from '../cr/types';

/** Where Trophy Road ends and the month's seasonal trophy road begins. */
export const TROPHY_ROAD_TOP = 14_000;

/**
 * The seasonal trophy road entry of `progress` ("seasonal-trophy-road-YYYYMM"). The road starts
 * where Trophy Road ends; the API sends every player below that a placeholder entry (14,000
 * trophies, best 0), so it only counts once their Trophy Road trophies reach 14,000. An entry
 * of 0 trophies is the same as none.
 */
export function seasonalOf(p: Pick<Player, 'progress' | 'trophies'>): { arena: string; trophies: number; best: number } | null {
  const e = Object.entries(p.progress ?? {}).find(([k]) => k.startsWith('seasonal-trophy-road'))?.[1];
  if (!e?.trophies || p.trophies < TROPHY_ROAD_TOP) return null;
  // Best is 0 until a game is played on the road this season; it is never below the current count.
  return { arena: e.arena?.name ?? 'Seasonal arena', trophies: e.trophies, best: Math.max(e.bestTrophies ?? 0, e.trophies ?? 0) };
}
