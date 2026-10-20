import { afterAll, describe, expect, it, vi } from 'vitest';
import type { Battle, Clan, CurrentRiverRace, Player } from '@/lib/cr/types';
import { battle, cards, DECKS, MODES, side } from '../fixtures/battles';

/**
 * Clan dashboard and profile on a training day (Wed 14 Oct 2026, 07:00 UTC = training day 2),
 * shaped like the live API: decksUsedToday counts training battles, decksUsed stays 0, and the
 * roster reports expLevel 0 for everyone.
 */
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(new Date('2026-10-14T07:00:00Z'));
afterAll(() => vi.useRealTimers());

const knight = cards(DECKS.knight);
const member = (tag: string, name: string, extra = {}) => ({
  tag: `#${tag}`,
  name,
  role: 'member',
  lastSeen: '20261014T063000.000Z',
  expLevel: 0,
  trophies: 14000,
  clanRank: 1,
  previousClanRank: 1,
  donations: 100,
  donationsReceived: 40,
  ...extra,
});
const clan = {
  tag: '#CLAN',
  name: 'Test Clan',
  type: 'open',
  description: '',
  badgeId: 16000015,
  clanScore: 137471,
  clanWarTrophies: 3140,
  requiredTrophies: 13500,
  donationsPerWeek: 4120,
  members: 2,
  memberList: [member('M1', 'One', { role: 'coLeader' }), member('M2', 'Two', { clanRank: 2 })],
} as unknown as Clan;
const part = (tag: string, decksToday: number) => ({ tag: `#${tag}`, name: tag, fame: 0, repairPoints: 0, boatAttacks: 0, decksUsed: 0, decksUsedToday: decksToday });
const race: CurrentRiverRace = {
  state: 'full',
  periodType: 'training',
  periodIndex: 8,
  sectionIndex: 1,
  clan: { tag: '#CLAN', name: 'Test Clan', badgeId: 1, fame: 0, repairPoints: 0, clanScore: 3140, participants: [part('M1', 4), part('M2', 0)] },
  clans: [
    { tag: '#CLAN', name: 'Test Clan', badgeId: 1, fame: 0, repairPoints: 0, clanScore: 3140, participants: [part('M1', 4), part('M2', 0)] },
    { tag: '#OTHER', name: 'Other', badgeId: 2, fame: 0, repairPoints: 0, clanScore: 3000, participants: [part('O1', 9)] },
  ],
};
const logs: Record<string, Battle[]> = {
  M1: [
    // Tuesday: training. Sunday + Saturday: war (one win, one loss).
    battle('riverRacePvP', MODES.war, new Date('2026-10-13T15:00:00Z'), [side('M1', knight, 1)], [side('X', knight, 0)]),
    battle('riverRacePvP', MODES.war, new Date('2026-10-11T12:00:00Z'), [side('M1', knight, 2)], [side('Y', knight, 1)]),
    battle('riverRaceDuel', MODES.war, new Date('2026-10-10T12:00:00Z'), [side('M1', knight, 0)], [side('Z', knight, 1)]),
    battle('clanMate', MODES.friendly, new Date('2026-10-12T12:00:00Z'), [side('M1', knight, 1)], [side('M2', knight, 0)]),
  ],
  M2: [],
};
const players: Record<string, Partial<Player>> = { M1: { tag: '#M1', name: 'One', expLevel: 71, collectionLevel: 2080 }, M2: { tag: '#M2', name: 'Two', expLevel: 64 } };

vi.mock('@/lib/cr/api', () => ({
  tags: { clan: (t: string) => `clan:${t}`, player: (t: string) => `player:${t}` },
  getClan: async () => ({ ok: true, data: clan }),
  getCurrentRiverRace: async () => ({ ok: true, data: race }),
  getRiverRaceLog: async () => ({ ok: true, data: { items: [] } }),
  getPlayer: async (t: string) => (players[t] ? { ok: true, data: { ...players[t], cards: [], badges: [], achievements: [], currentDeck: [] } } : { ok: false, status: 404, reason: 'notFound' }),
  getBattleLog: async (t: string) => ({ ok: true, data: logs[t] ?? [] }),
  anyFailed: () => false,
}));

describe('clan dashboard on a training day', async () => {
  const { getDashboard } = await import('@/lib/clan/dashboard');
  const d = (await getDashboard('CLAN'))!;
  const one = d.members.find((m) => m.tag === 'M1')!;
  const two = d.members.find((m) => m.tag === 'M2')!;

  it('shows the river race in progress as training', () => {
    expect(d.war).toMatchObject({ kind: 'training', day: 2, label: 'Training day 2' });
    expect(d.war?.warStarts).toBe('2026-10-15T09:40:00.000Z');
  });

  it('does not count training decks as war decks', () => {
    expect(d.war?.decksToday).toBe(0);
    expect(d.war?.trainingDecksToday).toBe(4);
    expect(d.war?.clans.every((c) => c.decksToday === 0)).toBe(true);
    expect(one).toMatchObject({ decks: 0, decksToday: 0, trainingToday: 4 });
    expect(two).toMatchObject({ decks: 0, decksToday: 0, trainingToday: 0 });
    expect(one.days).toEqual(['pending', 'pending', 'pending', 'pending']);
  });

  it('only counts war-day battles in the war win rate', () => {
    expect(one.warGames).toBe(2);
    expect(one.warWin).toBe(50);
    expect(one.trainingGames).toBe(1);
    expect(one.fGames).toBe(1);
    // Nobody is penalised for skipping training: no decks are possible yet.
    expect(one.inputs.decksPossible).toBe(0);
  });

  it('copies roster numbers straight from the API', () => {
    expect(d.clan).toMatchObject({ clanScore: 137471, clanWarTrophies: 3140, requiredTrophies: 13500, donationsPerWeek: 4120, members: 2 });
    expect(one).toMatchObject({ trophies: 14000, donations: 100, received: 40, role: 'coLeader' });
  });
});

describe('clan profile', async () => {
  const { getClanProfile } = await import('@/lib/clan/profile');
  const c = (await getClanProfile('CLAN'))!;

  it('fills King level from player profiles when the roster reports 0', () => {
    expect(c.members.map((m) => [m.tag, m.expLevel])).toEqual([
      ['M1', 71],
      ['M2', 64],
    ]);
  });

  it('takes each member’s collection level from their profile (none when the profile lacks it)', () => {
    expect(c.members.map((m) => [m.tag, m.collectionLevel])).toEqual([
      ['M1', 2080],
      ['M2', null],
    ]);
  });

  it('labels the race as training with the war start time', () => {
    expect(c.race).toMatchObject({ training: true, label: 'Training day 2 / 3', warStarts: '2026-10-15T09:40:00.000Z' });
  });
});
