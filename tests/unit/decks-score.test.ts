import { describe, expect, it } from 'vitest';
import { activityScore, assetScore, DEFAULT_WEIGHTS, factorScores, weightSum, type ScoreInputs } from '@/lib/clan/score';
import { cardBySlug } from '@/lib/cards';
import { deckHref, deckKey, deckLink, deckName, deckStats, toDeckCard, winConOf } from '@/lib/decks';
import { rankByName } from '@/lib/directory';
import { pool } from '@/lib/pool';
import { cards, DECKS } from '../fixtures/battles';

describe('decks', () => {
  const hog = cards(DECKS.hog, { evo: ['cannon'], hero: ['ice-golem'] }).map(toDeckCard);

  it('converts API cards, keeping evo / hero slots', () => {
    const cannon = hog.find((c) => c.slug === 'cannon')!;
    const golem = hog.find((c) => c.slug === 'ice-golem')!;
    expect(cannon).toMatchObject({ evo: true, hero: false, elixir: 3, rarity: 'common' });
    expect(golem).toMatchObject({ evo: false, hero: true, elixir: 2 });
  });

  it('computes average elixir and the 4-card cycle from card data', () => {
    // Hog 4, Log 2, Fireball 4, Musketeer 4, Ice Golem 2, Cannon 3, Skeletons 1, Ice Spirit 1.
    const st = deckStats(hog);
    expect(st.avgElixir).toBeCloseTo(21 / 8, 10);
    expect(st.cycle).toBe(1 + 1 + 2 + 2);
    // Cross-check against cards.json directly.
    const sum = DECKS.hog.reduce((a, s) => a + (cardBySlug(s)!.elixir ?? 0), 0);
    expect(st.avgElixir * 8).toBe(sum);
  });

  it('keys decks independently of card order, but not of evo state', () => {
    const shuffled = [...hog].reverse();
    expect(deckKey(shuffled)).toBe(deckKey(hog));
    const noEvo = cards(DECKS.hog, { hero: ['ice-golem'] }).map(toDeckCard);
    expect(deckKey(noEvo)).not.toBe(deckKey(hog));
  });

  it('names decks after the win condition and the most distinctive support card', () => {
    expect(winConOf(hog)?.slug).toBe('hog-rider');
    expect(deckName(hog, winConOf(hog))).toBe('Hog Rider · The Log');
    const pekka = cards(DECKS.pekka).map(toDeckCard);
    // P.E.K.K.A outranks the other win conditions in this deck; Golden Knight is the champion.
    expect(deckName(pekka, winConOf(pekka))).toBe('P.E.K.K.A · Golden Knight');
  });

  it('builds links', () => {
    expect(deckLink([1, 2, 3])).toBe('https://link.clashroyale.com/deck/en?deck=1;2;3');
    expect(deckHref('1-2e', 'pol')).toBe('/decks/1-2e');
    expect(deckHref('1-2e', 'ladder')).toBe('/decks/1-2e?mode=ladder');
  });
});

describe('asset score', () => {
  const base: ScoreInputs = { decks: 8, decksPossible: 8, lastRaceRatio: null, participation: 1, donations: 300, hoursSinceSeen: 2, warWin: 60, tenureDays: 100 };

  it('scores each factor 0–100', () => {
    const f = factorScores(base);
    expect(f).toEqual({ war: 100, don: 40, act: 100, bat: 67, ten: 27 });
    for (const v of Object.values(f)) expect(v).toBeGreaterThanOrEqual(0);
  });

  it('uses the last race on training days and stays neutral without war battles', () => {
    const f = factorScores({ ...base, decks: 0, decksPossible: 0, lastRaceRatio: 0.5, participation: null, warWin: null });
    expect(f.war).toBe(50);
    expect(f.bat).toBe(50);
  });

  it('decays activity after a day, without jumps', () => {
    expect(activityScore(10)).toBe(100);
    expect(activityScore(48)).toBe(81);
    expect(activityScore(71.99)).toBe(62);
    expect(activityScore(72)).toBe(62);
    expect(activityScore(1000)).toBe(0);
    // Never increases as time passes.
    for (let h = 0; h < 400; h += 0.5) expect(activityScore(h + 0.5)).toBeLessThanOrEqual(activityScore(h));
  });

  it('weights factors', () => {
    expect(weightSum(DEFAULT_WEIGHTS)).toBe(100);
    const f = { war: 100, don: 0, act: 100, bat: 50, ten: 0 };
    expect(assetScore(f, DEFAULT_WEIGHTS)).toBe(Math.round(35 + 20 + 7.5));
  });
});

describe('helpers', () => {
  it('pool keeps order and limits concurrency', async () => {
    let live = 0;
    let peak = 0;
    const out = await pool([5, 1, 4, 2, 3], 2, async (n) => {
      live++;
      peak = Math.max(peak, live);
      await new Promise((r) => setTimeout(r, n));
      live--;
      return n * 10;
    });
    expect(out).toEqual([50, 10, 40, 20, 30]);
    expect(peak).toBe(2);
  });

  it('ranks name matches: exact, prefix, then trophies', () => {
    const rows = [
      { name: 'Super Rosa', trophies: 9000 },
      { name: 'rosa', trophies: 100 },
      { name: 'Rosa Parks', trophies: 14000 },
      { name: 'Bob', trophies: 99999 },
    ];
    expect(rankByName(rows, 'Rosa', 10).map((r) => r.name)).toEqual(['rosa', 'Rosa Parks', 'Super Rosa']);
  });
});

describe('card upgrades', async () => {
  const { upgrades } = await import('@/lib/player/profile');

  it('a maxed common has collected 23,086 copies (matches RoyaleAPI)', () => {
    expect(upgrades('common', 16, 16, 0)).toEqual({ next: null, toMax: 0, collected: 23086 });
  });

  it('uses the modern costs from level 11 up, the same gold for every rarity', () => {
    // A legendary at API level 7 of 8 is real level 15: 20 copies and 120,000 gold to 16.
    expect(upgrades('legendary', 7, 8, 5).next).toEqual({ cards: 20, gold: 120000 });
    // A champion at API level 5 of 6 (real 15).
    expect(upgrades('champion', 5, 6, 0).next).toEqual({ cards: 15, gold: 120000 });
    // A common at level 12: 2,500 copies to 13; til max counts every later step minus copies held.
    const c = upgrades('common', 12, 16, 1000);
    expect(c.next).toEqual({ cards: 2500, gold: 40000 });
    expect(c.toMax).toBe(2500 + 3500 + 5500 + 7500 - 1000);
  });
});
