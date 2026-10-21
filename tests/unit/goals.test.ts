import { describe, expect, it } from 'vitest';
import { metricsOf, paceOf, progressOf } from '@/lib/player/goals';
import type { PlayerDay } from '@/lib/history/playerDaily';

const day = (d: string, x: Partial<PlayerDay> = {}): PlayerDay => ({ day: d, trophies: 9000, seasonalTrophies: null, polLeague: 5, polRating: 0, polRank: null, wins: 1000, battleCount: 2000, collectionLevel: 1500, warWins: 100, ...x });

describe('season goals', () => {
  it('estimates a finish date from the pace over the last 30 days', () => {
    const m = { current: 120, series: [['2026-10-01', 100], ['2026-10-11', 120]] as [string, number][] };
    const p = paceOf(m, 200, '2026-10-11');
    expect(p.perDay).toBe(2);
    expect(p.eta).toBe('2026-11-20'); // 80 more at 2 a day
  });

  it('gives no date without two snapshots a day apart, or when the number isn’t moving', () => {
    expect(paceOf({ current: 5, series: [['2026-10-11', 5]] }, 10, '2026-10-11').why).toBe('history');
    expect(paceOf({ current: 5, series: [['2026-10-01', 5], ['2026-10-11', 5]] }, 10, '2026-10-11').why).toBe('stalled');
    expect(paceOf({ current: 12, series: [] }, 10, '2026-10-11').done).toBe(true);
  });

  it('ignores snapshots older than the window', () => {
    const m = { current: 130, series: [['2026-08-01', 0], ['2026-10-01', 100], ['2026-10-11', 130]] as [string, number][] };
    expect(paceOf(m, 160, '2026-10-11').perDay).toBe(3);
  });

  it('measures progress from where the history starts', () => {
    expect(progressOf({ current: 150, series: [['2026-10-01', 100]] }, 200)).toBe(0.5);
    expect(progressOf({ current: 250, series: [] }, 200)).toBe(1);
  });

  it('uses the season count and its history once a player is past 14,000', () => {
    const ms = metricsOf({ trophies: 14000, seasonalTrophies: 14300, polLeague: 7, polRating: 1800, warWins: 900, wins: 5000, collectionLevel: 2000, maxCards: 40, days: [day('2026-10-01', { trophies: 14000, seasonalTrophies: 14100 })] });
    const t = ms.find((m) => m.key === 'trophies')!;
    expect(t.label).toBe('Season trophies');
    expect(t.current).toBe(14300);
    expect(t.series).toEqual([['2026-10-01', 14100]]);
  });
});
