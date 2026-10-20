import { describe, expect, it } from 'vitest';
import { leagueName, polLabel, polLeague } from '@/lib/leagues';
import { seasonalOf } from '@/lib/player/trophies';
import { outcome } from '@/lib/battle';

// Shapes taken from real profiles (clan #Q9YLY80P, October 2026).
const road = (trophies: number, bestTrophies: number) => ({ 'seasonal-trophy-road-202610': { arena: { id: 1, name: 'Seasonal Arena I' }, trophies, bestTrophies } });

describe('seasonal trophy road', () => {
  it('ignores the placeholder entry the API sends players below 14,000', () => {
    // Toxic: 13,803 on Trophy Road, and a seasonal entry of 14,000 / best 0 they never reached.
    expect(seasonalOf({ trophies: 13_803, progress: road(14_000, 0) })).toBeNull();
  });

  it('uses the road once Trophy Road is complete', () => {
    expect(seasonalOf({ trophies: 14_000, progress: road(14_060, 14_119) })).toMatchObject({ trophies: 14_060, best: 14_119 });
  });

  it('never shows a best below the current count (best is 0 before the first game of the season)', () => {
    expect(seasonalOf({ trophies: 14_000, progress: road(14_000, 0) })).toMatchObject({ trophies: 14_000, best: 14_000 });
  });

  it('is null without the entry', () => {
    expect(seasonalOf({ trophies: 14_000, progress: {} })).toBeNull();
  });
});

describe('Path of Legends leagues', () => {
  it('reads the current and previous seasons on the live 1–7 scale', () => {
    expect(polLeague(4, 0, 'current')).toEqual({ league: 4, atLeast: false });
    expect(leagueName(4)).toBe('Champion');
    expect(polLeague(7, 1840, 'last')).toEqual({ league: 7, atLeast: false });
  });

  it('converts old 10-league seasons', () => {
    expect(polLeague(10, 1774, 'best')).toEqual({ league: 7, atLeast: false });
    expect(polLeague(9, 0, 'best')).toEqual({ league: 6, atLeast: false });
    expect(leagueName(polLeague(8, 0, 'best').league)).toBe('Grand Champion');
  });

  it('treats a rating as Ultimate Champion on either scale', () => {
    expect(polLeague(7, 2488, 'best')).toEqual({ league: 7, atLeast: false });
  });

  it('reads a best of league 7 without a rating as the old Champion', () => {
    expect(polLeague(7, 0, 'best', [1, 1])).toEqual({ league: 4, atLeast: false });
  });

  it('uses the live scale when the old one would rank below a later season', () => {
    // Mates: best 5, previous season 5 (Grand Champion). Old 5 would be Master II, lower.
    expect(polLeague(5, 0, 'best', [4, 5])).toEqual({ league: 5, atLeast: false });
  });

  it('gives a lower bound when both readings fit', () => {
    // Best 6 with recent seasons in Master III: old Master III or live Royal Champion.
    const x = polLeague(6, 0, 'best', [3, 3]);
    expect(x).toEqual({ league: 3, atLeast: true });
    expect(polLabel(x)).toBe('Master III or higher');
  });

  it('names the old Challenger leagues', () => {
    expect(leagueName(polLeague(1, 0, 'best', [-5]).league)).toBe('Challenger I');
    expect(leagueName(null)).toBe('No league');
  });
});

describe('battle outcome', () => {
  const side = (crowns: number, rounds?: number[]) => ({ tag: '#A', name: 'a', crowns, cards: [], rounds: rounds?.map((c) => ({ crowns: c })) });
  it('goes by crowns in a normal battle', () => {
    expect(outcome({ team: [side(2)], opponent: [side(1)] })).toBe(1);
    expect(outcome({ team: [side(1)], opponent: [side(1)] })).toBe(0);
  });

  it('decides a war duel by rounds, not total crowns (a real 3–3 duel lost 1–2)', () => {
    expect(outcome({ team: [side(3, [0, 3, 0])], opponent: [side(3, [1, 1, 1])] })).toBe(-1);
    expect(outcome({ team: [side(3, [3, 0, 0])], opponent: [side(2, [0, 1, 1])] })).toBe(-1);
  });

  it('counts a 2v2 team once', () => {
    expect(outcome({ team: [side(1), side(1)], opponent: [side(0), side(0)] })).toBe(1);
  });
});
