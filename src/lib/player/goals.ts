import type { PlayerDay } from '../history/playerDaily';
import { leagueName } from '../leagues';

/**
 * Season goals: what a player can aim for, where they stand, and how fast they're getting there
 * from their own daily snapshots. Pure, so it's testable and runs the same everywhere.
 */

export type MetricKey = 'trophies' | 'polLeague' | 'polRating' | 'warWins' | 'wins' | 'collection' | 'maxCards';

export type Metric = {
  key: MetricKey;
  label: string;
  /** Where the player is now; null when the API doesn't say (e.g. no rating below Ultimate Champion). */
  current: number | null;
  /** Daily values from snapshots, oldest first; empty when the metric has no history. */
  series: [string, number][];
  /** Shown instead of the raw number (league names). */
  format?: 'league';
};

const series = (days: PlayerDay[], f: (d: PlayerDay) => number | null): [string, number][] =>
  days.flatMap((d) => {
    const v = f(d);
    return v == null ? [] : [[d.day, v] as [string, number]];
  });

/** Every goal metric for a player, from their profile numbers and daily snapshots. */
export function metricsOf(p: {
  trophies: number;
  seasonalTrophies: number | null;
  polLeague: number | null;
  polRating: number | null;
  warWins: number | null;
  wins: number;
  collectionLevel: number | null;
  maxCards: number;
  days: PlayerDay[];
}): Metric[] {
  const d = p.days;
  return [
    // Above 14,000 the month's seasonal road is the live count; its history is the seasonal column.
    {
      key: 'trophies',
      label: p.seasonalTrophies != null ? 'Season trophies' : 'Trophies',
      current: p.seasonalTrophies ?? p.trophies,
      series: series(d, (x) => (p.seasonalTrophies != null ? x.seasonalTrophies : x.trophies)),
    },
    { key: 'polLeague', label: 'Path of Legends league', current: p.polLeague, series: series(d, (x) => x.polLeague), format: 'league' },
    { key: 'polRating', label: 'Ultimate Champion rating', current: p.polRating, series: series(d, (x) => (x.polLeague != null && x.polLeague >= 7 ? x.polRating : null)) },
    { key: 'warWins', label: 'War wins', current: p.warWins, series: series(d, (x) => x.warWins) },
    { key: 'wins', label: 'Total wins', current: p.wins, series: series(d, (x) => x.wins) },
    { key: 'collection', label: 'Collection level', current: p.collectionLevel, series: series(d, (x) => x.collectionLevel) },
    { key: 'maxCards', label: 'Max-level cards', current: p.maxCards, series: [] },
  ];
}

export const show = (m: Pick<Metric, 'format'>, v: number) => (m.format === 'league' ? leagueName(v) : v.toLocaleString('en-US'));

export type Pace = {
  /** Change a day over the window; null when there isn't enough history. */
  perDay: number | null;
  /** Days of history the pace covers. */
  days: number;
  /** When the goal is reached at this pace (ISO date), or null when it can't be estimated. */
  eta: string | null;
  done: boolean;
  /** Why there's no estimate. */
  why: 'done' | 'history' | 'stalled' | null;
};

const DAY = 86_400_000;

/**
 * How fast a metric is moving: the change between the first and last snapshot of the last
 * `window` days, as a daily rate, and when it reaches `target` at that rate. Needs two snapshots
 * at least a day apart; a flat or falling metric has no finish date.
 */
export function paceOf(m: Pick<Metric, 'current' | 'series'>, target: number, today: string, window = 30): Pace {
  const cur = m.current;
  if (cur != null && cur >= target) return { perDay: null, days: 0, eta: null, done: true, why: 'done' };
  const from = Date.parse(today) - window * DAY;
  const pts = m.series.filter(([d]) => Date.parse(d) >= from);
  if (pts.length < 2) return { perDay: null, days: 0, eta: null, done: false, why: 'history' };
  const [d0, v0] = pts[0];
  const [d1, v1] = pts[pts.length - 1];
  const days = (Date.parse(d1) - Date.parse(d0)) / DAY;
  if (days < 1) return { perDay: null, days, eta: null, done: false, why: 'history' };
  const perDay = (v1 - v0) / days;
  const base = cur ?? v1;
  if (perDay <= 0) return { perDay, days, eta: null, done: false, why: 'stalled' };
  const eta = new Date(Date.parse(today) + Math.ceil((target - base) / perDay) * DAY).toISOString().slice(0, 10);
  return { perDay, days, eta, done: false, why: null };
}

/** How far along a goal is, 0–1, measured from where the stored history starts. */
export function progressOf(m: Pick<Metric, 'current' | 'series'>, target: number): number {
  const cur = m.current ?? m.series.at(-1)?.[1] ?? null;
  if (cur == null) return 0;
  if (cur >= target) return 1;
  const start = Math.min(cur, m.series[0]?.[1] ?? 0);
  return target > start ? Math.max(0, Math.min(1, (cur - start) / (target - start))) : 0;
}
