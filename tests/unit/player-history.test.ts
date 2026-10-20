import { describe, expect, it } from 'vitest';
import type { Player } from '@/lib/cr/types';
import { playerDayOf, polChanges, withChanges, type PlayerDay } from '@/lib/history/playerDaily';
import { datedBadgeLabel, reconstructFromBadges } from '@/lib/player/reconstruct';
import { monthStr } from '@/lib/format';

const profile = (extra: Partial<Player> = {}) =>
  ({
    tag: '#UVQJRQQ9L',
    name: 'Tester',
    trophies: 14000,
    wins: 3187,
    battleCount: 6298,
    collectionLevel: 1801,
    progress: {
      AutoChess_2026_Season_11: { trophies: 103, bestTrophies: 103 },
      'seasonal-trophy-road-202610': { trophies: 14062, bestTrophies: 14062 },
    },
    currentPathOfLegendSeasonResult: { leagueNumber: 7, trophies: 2961, rank: 1 },
    ...extra,
  }) as unknown as Player;

const day = (d: string, x: Partial<PlayerDay> = {}): PlayerDay => ({
  day: d,
  trophies: 14000,
  seasonalTrophies: null,
  polLeague: 5,
  polRating: 0,
  polRank: null,
  wins: 100,
  battleCount: 200,
  collectionLevel: 1800,
  ...x,
});

describe('tracked player snapshots', () => {
  it('turns a profile into a daily row', () => {
    expect(playerDayOf(profile(), '2026-10-20')).toEqual({
      day: '2026-10-20',
      trophies: 14000,
      seasonalTrophies: 14062,
      polLeague: 7,
      polRating: 2961,
      polRank: 1,
      wins: 3187,
      battleCount: 6298,
      collectionLevel: 1801,
    });
  });

  it('leaves seasonal and Path of Legends empty when the profile has none', () => {
    const d = playerDayOf(profile({ progress: { 'seasonal-trophy-road-202610': { trophies: 0, bestTrophies: 0 } }, currentPathOfLegendSeasonResult: undefined, collectionLevel: undefined }), '2026-10-20');
    expect(d).toMatchObject({ seasonalTrophies: null, polLeague: null, polRating: null, polRank: null, collectionLevel: null });
  });

  it('measures each snapshot against the one before, newest first', () => {
    const rows = withChanges([day('2026-10-19', { trophies: 14010, wins: 110, battleCount: 220 }), day('2026-10-17'), day('2026-10-20', { trophies: 13990, wins: 112, battleCount: 225 })]);
    expect(rows.map((r) => r.day)).toEqual(['2026-10-20', '2026-10-19', '2026-10-17']);
    expect(rows[0]).toMatchObject({ prevDay: '2026-10-19', trophyChange: -20, winsGained: 2, battlesPlayed: 5 });
    // A gap day: changes cover both days since the 17th.
    expect(rows[1]).toMatchObject({ prevDay: '2026-10-17', trophyChange: 10, winsGained: 10, battlesPlayed: 20 });
    expect(rows[2]).toMatchObject({ prevDay: null, trophyChange: null, winsGained: null, battlesPlayed: null });
  });

  it('shows a counter that went down as unknown, not negative', () => {
    const [latest] = withChanges([day('2026-10-19', { wins: 110 }), day('2026-10-20', { wins: 90 })]);
    expect(latest.winsGained).toBeNull();
  });

  it('keeps only the days Path of Legends moved', () => {
    const rows = polChanges([
      day('2026-10-17', { polLeague: 6, polRating: 0 }),
      day('2026-10-18', { polLeague: 6, polRating: 0 }),
      day('2026-10-19', { polLeague: 7, polRating: 1500 }),
      day('2026-10-20', { polLeague: 7, polRating: 1500 }),
      day('2026-10-21', { polLeague: null, polRating: null }),
    ]);
    expect(rows.map((r) => r.day)).toEqual(['2026-10-19', '2026-10-17']);
  });
});

describe('history reconstructed from badges', () => {
  const now = new Date('2026-10-20T12:00:00Z');
  // As the live API sends them (#20PURRGR2, Oct 2026).
  const badges = [
    { id: 'YearsPlayed', level: 10, maxLevel: 11, progress: 3748 },
    { id: 'BattleWins', level: 8, maxLevel: 8, progress: 31890 },
    { id: 'Crl20Wins2022', level: null, maxLevel: null, progress: 17 },
    { id: 'LadderTop1000', level: 10, maxLevel: 10, progress: 21 },
    { id: 'LadderTournamentTop1000', level: 6, maxLevel: 10, progress: 6 },
    { id: 'GoblinJourney2024', level: 1, maxLevel: 5, progress: 1 },
    { id: 'Royals2v2_2024', level: 2, maxLevel: 2, progress: 2 },
    { id: 'ClassicRoyale_2025', level: 2, maxLevel: 2, progress: 2 },
    { id: 'SeasonalBadge_202507_v2', level: 3, maxLevel: 3, progress: 6 },
    { id: 'SeasonalBadge_202511', level: 3, maxLevel: 3, progress: 6 },
    { id: 'SeasonalBadge_202509', level: 2, maxLevel: 3, progress: 4 },
    { id: '2025YearBadge', level: null, maxLevel: null, progress: 1 },
    { id: 'MasteryHogRider2024', level: 3, maxLevel: 10, progress: 1 },
    { id: '2v2LeagueRank', level: 1, maxLevel: 10, progress: 1 },
  ];

  it('dates the account from YearsPlayed (progress counts days)', () => {
    const r = reconstructFromBadges(badges, now);
    expect(r.playingSince).toEqual({ date: '2016-07-16T12:00:00.000Z', days: 3748, years: 10 });
  });

  it('falls back to whole years when YearsPlayed has no progress', () => {
    const r = reconstructFromBadges([{ id: 'YearsPlayed', level: 11, maxLevel: 11, progress: null }], now);
    expect(r.playingSince).toEqual({ date: null, days: null, years: 11 });
  });

  it('lists seasonal badges by month, newest first', () => {
    expect(reconstructFromBadges(badges, now).seasons).toEqual([
      { month: '2025-11', level: 3, maxLevel: 3 },
      { month: '2025-09', level: 2, maxLevel: 3 },
      { month: '2025-07', level: 3, maxLevel: 3 },
    ]);
  });

  it('picks up yearly badges, dated event badges and top-1,000 finishes', () => {
    const r = reconstructFromBadges(badges, now);
    expect(r.years).toEqual([2025]);
    expect(r.dated).toEqual([
      { year: 2025, label: 'Classic Royale' },
      { year: 2024, label: 'Goblin Journey' },
      { year: 2024, label: 'Royals 2v2' },
      { year: 2022, label: 'CRL 20 Wins' },
    ]);
    expect(r.finishes).toEqual([
      { label: 'Ladder top 1,000 finishes', count: 21 },
      { label: 'Global tournament top 1,000 finishes', count: 6 },
    ]);
  });

  it('labels dated badges without the year', () => {
    expect(datedBadgeLabel('Crl20Wins2022')).toBe('CRL 20 Wins');
    expect(datedBadgeLabel('Royals2v2_2024')).toBe('Royals 2v2');
    expect(datedBadgeLabel('GoblinJourney2024')).toBe('Goblin Journey');
    expect(monthStr('2025-07')).toBe('Jul 2025');
  });
});
