import { describe, expect, it } from 'vitest';
import type { Clan, RiverRaceLogEntry } from '@/lib/cr/types';
import type { ClanHistory, PlayerHistory } from '@/lib/history';
import type { BattleRow, PlayerProfile } from '@/lib/player/profile';
import type { PlayerDay } from '@/lib/history/playerDaily';
import { clanRecap } from '@/lib/recap/clan';
import { longestWinRun, playerRecap, seasonOf } from '@/lib/recap/player';
import { clanRecapImage, playerRecapImage } from '@/lib/recap/render';

const row = (result: BattleRow['result'], kind: BattleRow['kind'] = 'ladder') => ({ result, kind }) as BattleRow;
const card = (name: string) => ({ id: 1, slug: 'knight', name, rarity: 'common' as const, elixir: 3, evo: false, hero: false, img: null, level: 16 });

const profile = (extra: Partial<PlayerProfile> = {}) =>
  ({
    generatedAt: '2026-10-20T18:00:00.000Z',
    tag: 'UVQJRQQ9L',
    name: 'Tester',
    clan: { tag: 'Q9YLY80P', name: 'NRT', badgeId: 16000015 },
    seasonal: { arena: 'Seasonal', trophies: 14062, best: 14100 },
    trophies: 14000,
    bestTrophies: 14000,
    pol: { current: { league: 5, rating: 812, rank: null }, last: null, best: { league: 7, rating: 2961, rank: 1234 } },
    totals: { wins: 3000, losses: 1000, threeCrown: 900, battleCount: 4200 },
    favourite: { slug: 'witch', name: 'Witch', render: '/characters/witch.png' },
    decks: [{ key: 'a', name: 'Giant · Witch', cards: Array.from({ length: 8 }, (_, i) => card(`C${i}`)), games: 5, wins: 3, lastHours: 1, avgElixir: 3, cycle: 9 }],
    deck: null,
    mastery: [{ slug: 'mini-pekka', name: 'Mini P.E.K.K.A', level: 10, maxLevel: 10, progress: null, target: null, img: null }],
    badges: new Array(42).fill({}),
    battles: [row('win'), row('win'), row('draw'), row('win', 'friendly'), row('win'), row('loss'), row('win')],
    ...extra,
  }) as unknown as PlayerProfile;

const day = (d: string, x: Partial<PlayerDay> = {}): PlayerDay => ({ day: d, trophies: 14000, seasonalTrophies: null, polLeague: 5, polRating: 0, polRank: null, wins: 2950, battleCount: 4100, collectionLevel: 1800, warWins: null, ...x });
const history = (days: PlayerDay[]) => ({ trackedSince: `${days[0]?.day ?? '2026-10-20'}T10:00:00.000Z`, clans: [], trophies: [], war: [], days }) as PlayerHistory;

describe('player recap', () => {
  it('counts the longest win run the way the streak does (friendlies, boats and draws skipped)', () => {
    expect(longestWinRun([row('win'), row('win'), row('draw'), row('win', 'friendly'), row('win'), row('loss'), row('win')])).toBe(3);
    expect(longestWinRun([row('loss'), row('win', 'boat')])).toBe(0);
    expect(longestWinRun([])).toBe(0);
  });

  it('reads the season month from the seasonal trophy road key', () => {
    expect(seasonOf({ AutoChess_2026_Season_11: {}, 'seasonal-trophy-road-202610': {} })).toBe('2026-10');
    expect(seasonOf({})).toBeNull();
    expect(seasonOf(undefined)).toBeNull();
  });

  it('builds the recap from the profile, with a rating only from Ultimate Champion', () => {
    const r = playerRecap(profile(), null, '2026-10');
    expect(r.trophies).toEqual({ value: 14062, best: 14100, seasonal: true });
    expect(r.pol.current).toEqual({ league: 5, leagueName: 'Grand Champion', rating: null, rank: null });
    expect(r.pol.best).toEqual({ league: 7, leagueName: 'Ultimate Champion', rating: 2961, rank: 1234 });
    expect(r.career.winRate).toBe(75);
    expect(r).toMatchObject({ badges: 42, bestRun: 3, logBattles: 7, tracked: null, trackedSince: null });
    expect(r.deck).toMatchObject({ label: 'most', games: 5, wins: 3 });
    expect(r.mastery).toMatchObject({ name: 'Mini P.E.K.K.A', level: 10 });
    expect(r.favourite).toEqual({ name: 'Witch', img: '/characters/witch.png' });
  });

  it('falls back to the current deck when no deck was played twice, and to trophy road below the season', () => {
    const one = profile({ seasonal: null, decks: [{ ...profile().decks[0], games: 1 }], deck: { name: 'Now', cards: [card('X')], tower: null, avgElixir: 3, cycle: 9, link: '' } });
    const r = playerRecap(one, null, null);
    expect(r.deck).toMatchObject({ label: 'current', name: 'Now', games: 0 });
    expect(r.trophies).toEqual({ value: 14000, best: 14000, seasonal: false });
  });

  it('measures wins and battles since the first snapshot, but not from today or a bad read', () => {
    expect(playerRecap(profile(), history([day('2026-10-18'), day('2026-10-19')]), null).tracked).toEqual({ since: '2026-10-18', wins: 50, battles: 100 });
    expect(playerRecap(profile(), history([day('2026-10-20')]), null)).toMatchObject({ tracked: null, trackedSince: '2026-10-20T10:00:00.000Z' });
    expect(playerRecap(profile(), history([day('2026-10-18', { wins: 9999 })]), null).tracked).toBeNull();
  });
});

const member = (tag: string, name: string, donations = 0) => ({ tag: `#${tag}`, name, role: 'member', lastSeen: '', expLevel: 0, trophies: 0, clanRank: 1, previousClanRank: 1, donations, donationsReceived: 0 });
const clan = {
  tag: '#CLAN',
  name: 'Test Clan',
  badgeId: 16000015,
  clanWarTrophies: 3140,
  members: 3,
  memberList: [member('M1', 'One', 120), member('M2', 'Two', 300), member('M3', 'Three')],
} as unknown as Clan;
const part = (tag: string, fame: number, decksUsed: number) => ({ tag: `#${tag}`, name: tag, fame, repairPoints: 0, boatAttacks: 0, decksUsed, decksUsedToday: 0 });
const entry = (seasonId: number, sectionIndex: number, rank: number, fame: number, parts: ReturnType<typeof part>[]): RiverRaceLogEntry => ({
  seasonId,
  sectionIndex,
  createdDate: '20261012T100000.000Z',
  standings: [
    { rank, trophyChange: rank === 1 ? 20 : -5, clan: { tag: '#CLAN', name: 'Test Clan', badgeId: 1, fame, repairPoints: 0, clanScore: 0, participants: parts } },
    { rank: rank === 1 ? 2 : 1, trophyChange: 0, clan: { tag: '#OTHER', name: 'Other', badgeId: 1, fame: 1, repairPoints: 0, clanScore: 0, participants: [part('O1', 9999, 16)] } },
  ],
});
const log = [entry(130, 1, 1, 10000, [part('M1', 3000, 16), part('M2', 2000, 12), part('GONE', 5000, 16)]), entry(130, 0, 3, 8000, [part('M1', 1000, 4), part('M3', 0, 0)])];
const NOW = new Date('2026-10-20T12:00:00Z');
const clanHistory = (events: ClanHistory['rosterEvents'], trackedSince = '2026-09-01T00:00:00Z') =>
  ({ trackedSince, firstSeen: {}, baseline: [], rosterEvents: events, dailyDecks: {}, trophiesWeekAgo: {} }) as ClanHistory;

describe('clan recap', () => {
  it('sums the race log for our clan only', () => {
    const r = clanRecap(clan, log, null, NOW);
    expect(r.races).toEqual([
      { label: 'S130 · W2', rank: 1, fame: 10000, trophyChange: 20 },
      { label: 'S130 · W1', rank: 3, fame: 8000, trophyChange: -5 },
    ]);
    expect(r).toMatchObject({ totalFame: 18000, wins: 1, roster: null });
  });

  it('ranks current members by fame like the War chart, leaving out former members and zero fame', () => {
    expect(clanRecap(clan, log, null, NOW).performers).toEqual([
      { name: 'One', fame: 4000, decks: 20, races: 2 },
      { name: 'Two', fame: 2000, decks: 12, races: 1 },
    ]);
  });

  it("names this week's donations leader, or nobody before anyone donates", () => {
    expect(clanRecap(clan, log, null, NOW).donations).toEqual({ name: 'Two', donations: 300 });
    expect(clanRecap({ ...clan, memberList: [member('M1', 'One')] } as unknown as Clan, log, null, NOW).donations).toBeNull();
  });

  it('counts roster moves since tracking began, within the race-log window', () => {
    const ev = (at: string, kind: 'joined' | 'left') => ({ at, tag: 'X', name: 'X', kind });
    const r = clanRecap(clan, log, clanHistory([ev('2026-10-19T00:00:00Z', 'joined'), ev('2026-10-02T00:00:00Z', 'left'), ev('2026-10-01T00:00:00Z', 'joined')], '2026-09-30T00:00:00Z'), NOW);
    expect(r.roster).toEqual({ since: '2026-09-30T00:00:00.000Z', joined: 2, left: 1, complete: true });
    // An old clan: only the last 70 days count.
    const old = clanRecap(clan, log, clanHistory([ev('2026-10-19T00:00:00Z', 'joined'), ev('2026-01-01T00:00:00Z', 'left')], '2025-01-01T00:00:00Z'), NOW);
    expect(old.roster).toMatchObject({ since: '2026-08-11T12:00:00.000Z', joined: 1, left: 0, complete: true });
  });

  it('marks roster counts as partial when the event read was capped inside the window', () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ at: new Date(NOW.getTime() - i * 3600_000).toISOString(), tag: 'X', name: 'X', kind: 'joined' as const }));
    expect(clanRecap(clan, log, clanHistory(many, '2025-01-01T00:00:00Z'), NOW).roster).toMatchObject({ joined: 300, complete: false });
  });
});

describe('recap images', () => {
  const png = async (r: Response) => new Uint8Array(await r.arrayBuffer());
  const isPng = (b: Uint8Array) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;

  it('draws a player recap, with and without the optional parts', async () => {
    const full = playerRecap(profile(), history([day('2026-10-18')]), '2026-10');
    expect(isPng(await png(await playerRecapImage(full, 'example.test')))).toBe(true);
    const bare = playerRecap(profile({ favourite: null, decks: [], deck: null, mastery: [], battles: [], seasonal: null, pol: { current: null, last: null, best: null } }), history([day('2026-10-20')]), null);
    expect(isPng(await png(await playerRecapImage(bare, 'example.test')))).toBe(true);
  });

  it('draws a clan recap, with and without races and history', async () => {
    const full = clanRecap(clan, log, clanHistory([{ at: '2026-10-19T00:00:00Z', tag: 'X', name: 'X', kind: 'joined' }]), NOW);
    expect(isPng(await png(await clanRecapImage(full, 'example.test')))).toBe(true);
    expect(isPng(await png(await clanRecapImage(clanRecap(clan, [], null, NOW), 'example.test')))).toBe(true);
  });
});
