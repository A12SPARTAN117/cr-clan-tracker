import { describe, expect, it, vi } from 'vitest';
import type { ApiCard, Battle, Player } from '@/lib/cr/types';
import { clanLeague } from '@/lib/clanLeague';
import { currentDeckCards, streakOf } from '@/lib/player/profile';
import { rankByName } from '@/lib/directory';

vi.mock('@/lib/db', () => ({ getDb: vi.fn(async () => null), enqueue: (job: () => Promise<unknown>) => job(), schema: { badgeArt: {} } }));

describe('clan war leagues (lib/clanLeague)', () => {
  it.each([
    [0, 'Bronze I'],
    [199, 'Bronze I'],
    [200, 'Bronze II'],
    [599, 'Bronze III'],
    [600, 'Silver I'],
    [1499, 'Silver III'],
    [1500, 'Gold I'],
    [2999, 'Gold III'],
    [3000, 'Legendary I'],
    [3999, 'Legendary I'],
    [4000, 'Legendary II'],
    [5000, 'Legendary III'],
    [13292, 'Legendary III'],
  ])('%i war trophies → %s', (t, name) => expect(clanLeague(t)?.name).toBe(name));

  it('has no league without war trophies', () => {
    expect(clanLeague(null)).toBeNull();
    expect(clanLeague(undefined)).toBeNull();
    expect(clanLeague(-5)).toBeNull();
  });
});

// ---- battles ----
const ME = '#ME';
function battle(us: number, them: number, type = 'PvP', mode = 'Ladder'): Battle {
  return {
    type,
    battleTime: '20261019T120000.000Z',
    gameMode: { id: 72000006, name: mode },
    team: [{ tag: ME, name: 'me', crowns: us, cards: [] }],
    opponent: [{ tag: '#OPP', name: 'them', crowns: them, cards: [] }],
  };
}

describe('win streak (streakOf), the count shown on Home and the player page', () => {
  it('counts the run of results at the top of the log', () => {
    expect(streakOf([battle(1, 0), battle(3, 0), battle(2, 1), battle(0, 1)])).toBe(3);
    expect(streakOf([battle(0, 2), battle(0, 1), battle(1, 0)])).toBe(-2);
  });
  it('skips friendlies, boat battles and draws', () => {
    expect(streakOf([battle(0, 3, 'clanMate'), battle(1, 1), battle(1, 0), battle(0, 1, 'boatBattle'), battle(2, 0), battle(0, 1)])).toBe(2);
  });
  it('is 0 with no counted battles', () => {
    expect(streakOf([])).toBe(0);
    expect(streakOf([battle(0, 0), battle(1, 0, 'friendly')])).toBe(0);
  });
});

// ---- current deck: evo and hero slots ----
const card = (id: number, name: string, evolutionLevel?: number): ApiCard => ({ id, name, level: 14, maxLevel: 14, rarity: 'common', evolutionLevel, iconUrls: { medium: `https://x/${id}.png` } });
const KNIGHT = 26000000; // evo and hero
const VALK = 26000011; // evo and hero
const BARREL = 28000004; // evo only
const SKARMY = 26000012; // evo only
const GIANT = 26000003; // hero only
const LOG = 28000011; // neither
const HOG = 26000021; // neither
const PRINCESS = 26000026; // evo only

function player(deck: ApiCard[], owned = deck): Player {
  return { tag: ME, name: 'me', cards: owned, currentDeck: deck, badges: [] } as unknown as Player;
}

describe('current deck (currentDeckCards): only the evo/hero slots play as evo or hero', () => {
  it('ignores the evo flag on cards outside slots 1–3 (the "evo that isn\'t in the deck" bug)', () => {
    // The API marks every card whose evo the player owns, here five of them.
    const deck = [card(BARREL, 'Goblin Barrel', 1), card(VALK, 'Valkyrie', 3), card(SKARMY, 'Skeleton Army', 1), card(PRINCESS, 'Princess', 1), card(KNIGHT, 'Knight', 3), card(LOG, 'The Log'), card(HOG, 'Hog Rider'), card(GIANT, 'Giant', 2)];
    const out = currentDeckCards(player(deck), []);
    expect(out.filter((c) => c.evo).map((c) => c.name)).toEqual(['Goblin Barrel', 'Skeleton Army']);
    expect(out.filter((c) => c.hero).map((c) => c.name)).toEqual(['Valkyrie']);
  });

  it('slot 2 is the hero slot, slot 3 prefers the evo, slot 1 is evo only', () => {
    const deck = [card(GIANT, 'Giant', 2), card(KNIGHT, 'Knight', 3), card(VALK, 'Valkyrie', 3), card(LOG, 'The Log'), card(HOG, 'Hog Rider'), card(SKARMY, 'Skeleton Army', 1), card(BARREL, 'Goblin Barrel'), card(PRINCESS, 'Princess')];
    const [s1, s2, s3] = currentDeckCards(player(deck), []);
    expect([s1.evo, s1.hero]).toEqual([false, false]); // Giant has no evo, and slot 1 is not a hero slot
    expect([s2.evo, s2.hero]).toEqual([false, true]);
    expect([s3.evo, s3.hero]).toEqual([true, false]);
  });

  it('uses the forms from the latest battle with this deck when there is one', () => {
    const deck = [card(KNIGHT, 'Knight', 3), card(VALK, 'Valkyrie', 3), card(BARREL, 'Goblin Barrel', 1), card(LOG, 'The Log'), card(HOG, 'Hog Rider'), card(SKARMY, 'Skeleton Army', 1), card(PRINCESS, 'Princess', 1), card(GIANT, 'Giant')];
    const played = battle(1, 0);
    // The same eight cards; the battle says Knight was played as evo, Valkyrie as hero and the
    // Barrel plain, whatever the player has unlocked.
    played.team[0].cards = [card(KNIGHT, 'Knight', 1), card(VALK, 'Valkyrie', 2), card(BARREL, 'Goblin Barrel'), card(LOG, 'The Log'), card(HOG, 'Hog Rider'), card(SKARMY, 'Skeleton Army', 1), card(PRINCESS, 'Princess', 1), card(GIANT, 'Giant')];
    const out = currentDeckCards(player(deck), [played]);
    expect(out.map((c) => (c.evo ? 'E' : c.hero ? 'H' : '-')).join('')).toBe('EH------');
  });

  it("ignores battles with a different deck or someone else's side", () => {
    const deck = [card(KNIGHT, 'Knight', 3), card(VALK, 'Valkyrie', 3), card(BARREL, 'Goblin Barrel', 1), card(LOG, 'The Log'), card(HOG, 'Hog Rider'), card(SKARMY, 'Skeleton Army'), card(PRINCESS, 'Princess'), card(GIANT, 'Giant')];
    const other = battle(1, 0);
    other.team[0].cards = [...deck.slice(0, 7).map((c): ApiCard => ({ ...c, evolutionLevel: undefined })), card(26000001, 'Archers')];
    const out = currentDeckCards(player(deck), [other]);
    // Falls back to unlocks by slot: Knight evo, Valkyrie hero, Barrel evo.
    expect(out.slice(0, 3).map((c) => (c.evo ? 'E' : c.hero ? 'H' : '-')).join('')).toBe('EHE');
  });
});

describe('player name search ranking (rankByName)', () => {
  const rows = [
    { name: 'xXkiraXx', trophies: 9000 },
    { name: 'Kira', trophies: 5000 },
    { name: 'kirabelle', trophies: 7000 },
    { name: 'MysticKiraX', trophies: 14000 },
    { name: 'Bob', trophies: 20000 },
  ];
  it('exact match first, then names starting with it, then by trophies', () => {
    expect(rankByName(rows, 'kira', 10).map((r) => r.name)).toEqual(['Kira', 'kirabelle', 'MysticKiraX', 'xXkiraXx']);
  });
  it('respects the limit and ignores non-matches', () => {
    expect(rankByName(rows, 'KIRA', 2)).toHaveLength(2);
    expect(rankByName(rows, 'zzz', 10)).toEqual([]);
  });
});

describe('compare only spends API calls on real tags (lib/compare)', () => {
  it('reports malformed tags as missing without fetching them', async () => {
    vi.resetModules();
    const getPlayerProfile = vi.fn(async (tag: string) => (void tag, null));
    vi.doMock('@/lib/player/profile', () => ({ getPlayerProfile }));
    vi.doMock('@/lib/clan/profile', () => ({ getClanProfile: vi.fn(async () => null) }));
    const { compare } = await import('@/lib/compare');
    const r = await compare('player', ['../../x', 'QULLYLUC', '<script>', 'QULLYLUC', 'P0', 'UVQJRQQ9L', 'QQQQQQQQ', 'LLLLLLL']);
    // Deduped, capped at four, and only the valid ones fetched.
    expect(getPlayerProfile.mock.calls.map((c) => c[0])).toEqual(['QULLYLUC']);
    expect(r.missing).toEqual(['../../X', '<SCRIPT>', 'P0', 'QULLYLUC']);
    vi.doUnmock('@/lib/player/profile');
    vi.doUnmock('@/lib/clan/profile');
  });
});

describe('badge art recording (lib/badgeArt)', () => {
  it('writes each badge level once per server and skips badges without art', async () => {
    vi.resetModules();
    const values = vi.fn((rows: { name: string; level: number }[]) => (void rows, { onConflictDoNothing: async () => {} }));
    vi.doMock('@/lib/db', () => ({ getDb: async () => ({ insert: () => ({ values }) }), enqueue: (job: () => Promise<unknown>) => job(), schema: { badgeArt: {} } }));
    const { recordBadgeArt } = await import('@/lib/badgeArt');
    const b = (id: string, level: number | null, img: string | null) => ({ id, level, maxLevel: 10, img });
    await recordBadgeArt([b('MasteryKnight', 7, 'https://a/1.png'), b('YearsPlayed', 3, 'https://a/2.png'), b('NoArt', 1, null)]);
    await recordBadgeArt([b('MasteryKnight', 7, 'https://a/1.png'), b('MasteryKnight', 8, 'https://a/3.png')]);
    expect(values.mock.calls.map(([rows]) => rows.map((r) => `${r.name}:${r.level}`))).toEqual([['MasteryKnight:7', 'YearsPlayed:3'], ['MasteryKnight:8']]);
    vi.doUnmock('@/lib/db');
  });
});
