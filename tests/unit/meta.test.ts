import { afterAll, describe, expect, it, vi } from 'vitest';
import type { Battle, Clan } from '@/lib/cr/types';
import { deckKey, toDeckCard } from '@/lib/decks';
import { battle, cards, DECKS, MODES, side } from '../fixtures/battles';

/**
 * buildMeta on a hand-built sample with known answers. "Now" is Friday 16 Oct 2026 12:00 UTC
 * (war day 2), so a river race battle on Thursday counts and one on Wednesday is training.
 */
const NOW = new Date('2026-10-16T12:00:00Z');
const ago = (h: number) => new Date(NOW.getTime() - h * 3600_000);
const hog = cards(DECKS.hog);
const pekka = cards(DECKS.pekka);
const golem = cards(DECKS.golem);
const knight = cards(DECKS.knight);
const ranked = (h: number, a: ReturnType<typeof side>, b: ReturnType<typeof side>) => battle('pathOfLegend', MODES.ranked, ago(h), [a], [b], { leagueNumber: 7 });

// Two ranked players A and B, and one member D of the top war clan.
const AvsB = ranked(1, side('A', hog, 1, { startingTrophies: 2500 }), side('B', pekka, 0, { startingTrophies: 2450 }));
const logs: Record<string, Battle[]> = {
  A: [
    AvsB,
    ranked(2, side('A', hog, 0, { startingTrophies: 2490 }), side('E', golem, 2, { startingTrophies: 2300 })),
    ranked(30, side('A', hog, 3, { startingTrophies: 2400 }), side('X', golem, 0)), // older than 24h: ignored
  ],
  B: [
    // The A–B battle again, from B's side: must be counted once.
    { ...AvsB, team: AvsB.opponent, opponent: AvsB.team },
    ranked(3, side('B', pekka, 3, { startingTrophies: 2440 }), side('F', knight, 0, { startingTrophies: 2200 })),
  ],
  D: [
    battle('trail', MODES.ladder, ago(5), [side('D', knight, 1)], [side('G', golem, 1)]),
    battle('PvP', MODES.ladder, ago(6), [side('D', knight, 2)], [side('H', hog, 1)]),
    battle('riverRacePvP', MODES.war, new Date('2026-10-15T12:00:00Z'), [side('D', knight, 1)], [side('J', hog, 0)]),
    battle('riverRacePvP', MODES.war, new Date('2026-10-14T12:00:00Z'), [side('D', knight, 1)], [side('K', hog, 0)]), // training day
    battle('friendly', MODES.friendly, ago(1), [side('D', knight, 1)], [side('L', hog, 0)]),
  ],
};

vi.mock('@/lib/cr/api', () => ({
  getPolLeaderboard: async () => ({ ok: true, data: { items: [{ tag: '#A', name: 'A', expLevel: 70, eloRating: 2500, rank: 1 }, { tag: '#B', name: 'B', expLevel: 70, eloRating: 2450, rank: 2 }] } }),
  getClanWarRankings: async () => ({ ok: true, data: { items: [{ tag: '#CLAN', name: 'Clan', rank: 1, previousRank: 1, members: 1, badgeId: 1 }] } }),
  getClan: async () => ({ ok: true, data: { tag: '#CLAN', name: 'Clan', memberList: [{ tag: '#D', name: 'D' }] } as unknown as Clan }),
  getBattleLog: async (tag: string) => ({ ok: true, data: logs[tag] ?? [] }),
}));

// Set the clock now: buildMeta runs while the suite is collected, before any hooks.
vi.useFakeTimers({ toFake: ['Date'] });
vi.setSystemTime(NOW);
afterAll(() => vi.useRealTimers());

const key = (c: ReturnType<typeof cards>) => deckKey(c.map(toDeckCard));

describe('buildMeta aggregation', async () => {
  const { buildMeta } = await import('@/lib/meta');
  const meta = (await buildMeta())!;

  it('samples the ranked top players plus the top war clan members', () => {
    expect(meta.players).toBe(3);
    expect(meta.order.slice(0, 5)).toEqual(['pol', 'uc', 'ladder', 'war', '2v2']);
  });

  it('counts each battle once, within each mode window', () => {
    // Ranked: A–B, A–E, B–F (the 30h-old one is outside the 24h window).
    expect(meta.modes.pol.battles).toBe(3);
    expect(meta.modes.pol.sides).toBe(6);
    expect(meta.modes.uc.battles).toBe(3);
    expect(meta.modes.ladder.battles).toBe(2);
    // Only Thursday's war battle; Wednesday's was a training battle; friendlies never count.
    expect(meta.modes.war.battles).toBe(1);
    expect(meta.battles).toBe(3 + 2 + 1);
  });

  it('computes games, wins, draws, crowns, use and win rates exactly', () => {
    const decks = new Map(meta.modes.pol.decks.map((d) => [d.key, d]));
    // Decks need 2+ games: only Hog (A) and P.E.K.K.A (B) qualify.
    expect([...decks.keys()].sort()).toEqual([key(hog), key(pekka)].sort());

    const h = decks.get(key(hog))!;
    expect(h).toMatchObject({ games: 2, wins: 1, draws: 0 });
    expect(h.win).toBe(50);
    expect(h.use).toBeCloseTo((2 / 6) * 100, 10);
    // Won 1–0 (+1) and lost 0–2 (−2).
    expect(h.crowns).toEqual([0, 1, 0, 0, 1, 0, 0]);
    expect(h.crowns.reduce((a, b) => a + b, 0)).toBe(h.games);

    const p = decks.get(key(pekka))!;
    expect(p).toMatchObject({ games: 2, wins: 1, draws: 0 });
    expect(p.crowns).toEqual([0, 0, 1, 0, 0, 0, 1]);
  });

  it('records players with their best ranked rating', () => {
    const h = meta.modes.pol.decks.find((d) => d.key === key(hog))!;
    expect(h.players).toEqual([{ tag: 'A', name: 'Player A', rating: 2500, games: 2, wins: 1 }]);
  });

  it('groups matchups by the opponent win condition', () => {
    const h = meta.modes.pol.decks.find((d) => d.key === key(hog))!;
    expect(h.matchups.map((m) => [m.vsSlug, m.games, m.wins]).sort()).toEqual([
      ['golem', 1, 0],
      ['pekka', 1, 1],
    ]);
  });

  it('handles draws in ladder', () => {
    const k = meta.modes.ladder.decks.find((d) => d.key === key(knight))!;
    expect(k).toMatchObject({ games: 2, wins: 1, draws: 1, win: 50 });
    expect(k.crowns[3]).toBe(1);
  });

  it('derives deck elixir stats from card data', () => {
    const h = meta.modes.pol.decks.find((d) => d.key === key(hog))!;
    expect(h.avgElixir).toBeCloseTo(21 / 8, 10);
    expect(h.cycle).toBe(6);
  });

  it('card stats add up', () => {
    const m = meta.modes.pol;
    // Every side has 8 cards, so card games sum to 8 × sides.
    expect(m.cards.reduce((a, c) => a + c.games, 0)).toBe(8 * m.sides);
    const log = m.cards.find((c) => c.slug === 'the-log')!;
    expect(log).toMatchObject({ games: 2, wins: 1 });
  });
});
