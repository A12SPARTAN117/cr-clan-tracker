import { describe, expect, it } from 'vitest';
import {
  COUNTER_CARDS,
  counterReport,
  decodeSlots,
  deckSlots,
  defaultForm,
  encodeSlots,
  fixForms,
  poolDecks,
  slotCards,
  slotFor,
  wilson,
  type Slot,
} from '@/lib/builder';
import { cardBySlug } from '@/lib/cards';
import { deckKey, deckName, deckStats, toDeckCard, winConOf } from '@/lib/decks';
import type { DeckStat, Matchup } from '@/lib/meta';
import { cards, DECKS } from '../fixtures/battles';

const id = (slug: string) => cardBySlug(slug)!.id;

/** A meta deck with known matchups (vs = opposing win condition slug → [games, wins]). */
function metaDeck(slugs: string[], games: number, wins: number, vs: Record<string, [number, number]> = {}, forms: { evo?: string[]; hero?: string[] } = {}): DeckStat {
  const cs = cards(slugs, forms).map(toDeckCard);
  const wc = winConOf(cs);
  const matchups: Matchup[] = Object.entries(vs).map(([slug, [g, w]]) => ({ vs: cardBySlug(slug)!.name, vsSlug: slug, games: g, wins: w }));
  return {
    key: deckKey(cs),
    name: deckName(cs, wc),
    winCon: wc?.slug ?? null,
    cards: cs,
    tower: null,
    games,
    wins,
    draws: 0,
    crowns: [],
    use: 0,
    win: (wins / games) * 100,
    ...deckStats(cs),
    matchups,
    players: [],
  };
}

const built = (slugs: string[], forms: { evo?: string[]; hero?: string[] } = {}) => cards(slugs, forms).map(toDeckCard);

describe('builder slots', () => {
  it('gives slot 1 the evolution, slot 2 the hero and slot 3 either, as in the game', () => {
    // Knight has both an evolution and a hero.
    expect(defaultForm(id('knight'), 0)).toEqual({ evo: true, hero: false });
    expect(defaultForm(id('knight'), 1)).toEqual({ evo: false, hero: true });
    expect(defaultForm(id('knight'), 2)).toEqual({ evo: true, hero: false });
    expect(defaultForm(id('knight'), 3)).toEqual({ evo: false, hero: false });
    // Slot 3 falls back to the hero when the evolution isn't unlocked.
    expect(defaultForm(id('knight'), 2, { evo: false, hero: true })).toEqual({ evo: false, hero: true });
    expect(defaultForm(id('knight'), 0, { evo: false, hero: true })).toEqual({ evo: false, hero: false });
    // A card without an evolution plays plain in the evo slot.
    expect(defaultForm(id('hog-rider'), 0)).toEqual({ evo: false, hero: false });
  });

  it('puts new cards in the special slot they can use, else the first free plain slot', () => {
    const empty: Slot[] = Array(8).fill(null);
    expect(slotFor(empty, id('hog-rider'))).toBe(3);
    const evo = cardBySlug('cannon')!;
    expect(evo.hasEvolution).toBe(true);
    expect(slotFor(empty, evo.id)).toBe(0);
    const full: Slot[] = [null, null, null, ...Array(5).fill({ id: 1, evo: false, hero: false })];
    expect(slotFor(full, id('hog-rider'))).toBe(0);
    expect(slotFor(Array(8).fill({ id: 1, evo: false, hero: false }), id('hog-rider'))).toBe(-1);
  });

  it('drops forms a slot cannot hold after cards move', () => {
    const moved = fixForms([{ id: id('hog-rider'), evo: true, hero: false }, null, null, { id: id('cannon'), evo: true, hero: false }, null, null, null, null]);
    expect(moved[0]).toEqual({ id: id('hog-rider'), evo: false, hero: false });
    expect(moved[3]).toEqual({ id: id('cannon'), evo: false, hero: false });
  });

  it('round-trips share links and ignores junk', () => {
    const slots = deckSlots(built(['cannon', ...DECKS.hog.filter((c) => c !== 'cannon')], { evo: ['cannon'] }));
    expect(decodeSlots(encodeSlots(slots))).toEqual(slots);
    const withGap = [...slots.slice(0, 7), null];
    expect(decodeSlots(encodeSlots(withGap))).toEqual(withGap);
    // Unknown ids, tower troops and duplicates are dropped.
    const knight = { id: id('knight'), evo: false, hero: false };
    expect(decodeSlots(`999.159000000.${id('knight')}.${id('knight')}`)).toEqual([null, null, knight, null, null, null, null, null]);
    expect(decodeSlots('<script>')).toEqual(Array(8).fill(null));
  });

  it('keeps a meta deck in played order with its forms', () => {
    const order = ['cannon', 'ice-golem', 'musketeer', 'hog-rider', 'the-log', 'fireball', 'skeletons', 'ice-spirit'];
    const d = built(order, { evo: ['cannon', 'musketeer'], hero: ['ice-golem'] });
    const slots = deckSlots(d);
    expect(slots.map((s) => s && [s.id, s.evo, s.hero])).toEqual(d.map((c) => [c.id, c.evo, c.hero]));
    expect(slotCards(slots).map((c) => c.slug)).toEqual(order);
    // Same cards and forms → same key as the meta deck.
    expect(deckKey(slotCards(slots))).toBe(deckKey(d));
  });
});

describe('counter ranking', () => {
  // The built deck: Hog Rider cycle.
  const hog = built(DECKS.hog);

  it('ranks decks by their record against the built deck’s win condition, with a game floor', () => {
    const golem = metaDeck(DECKS.golem, 40, 22, { 'hog-rider': [20, 14], pekka: [6, 2] });
    const pekka = metaDeck(DECKS.pekka, 30, 18, { 'hog-rider': [12, 9] });
    // 4 of 4 is not enough games to show.
    const lucky = metaDeck(['x-bow', 'tesla', 'archers', 'the-log', 'fireball', 'skeletons', 'ice-spirit', 'knight'], 10, 7, { 'hog-rider': [4, 4] });
    // Loses to Hog: not a counter.
    const knight = metaDeck(DECKS.knight, 20, 9, { 'hog-rider': [10, 3] });
    const r = counterReport([golem, pekka, lucky, knight], hog);
    expect(r.winCon?.slug).toBe('hog-rider');
    // 14 of 20 (70%) outranks 9 of 12 (75%): the bigger sample is the surer counter.
    expect(r.counters.map((c) => c.deck.key)).toEqual([golem.key, pekka.key]);
    expect(r.counters[0]).toMatchObject({ vs: { games: 20, wins: 14 }, win: 70 });
    expect(r.counters[1]).toMatchObject({ vs: { games: 12, wins: 9 }, win: 75 });
  });

  it('prefers a bigger sample over a perfect tiny one', () => {
    const big = metaDeck(DECKS.golem, 60, 40, { 'hog-rider': [40, 30] });
    const small = metaDeck(DECKS.pekka, 10, 8, { 'hog-rider': [5, 5] });
    const r = counterReport([small, big], hog);
    expect(r.counters.map((c) => c.deck.key)).toEqual([big.key, small.key]);
    expect(wilson(30, 40)).toBeGreaterThan(wilson(5, 5));
  });

  it('treats decks close to the built one as variants, not counters, and reads their matchups', () => {
    // Hog deck with two cards swapped: 6 shared cards.
    const variant = metaDeck(['hog-rider', 'the-log', 'fireball', 'musketeer', 'ice-golem', 'cannon', 'knight', 'archers'], 50, 24, {
      'hog-rider': [8, 6],
      golem: [10, 3],
      pekka: [4, 1],
    });
    const same = metaDeck(DECKS.hog, 30, 16, { golem: [6, 2], 'x-bow': [7, 5] });
    const golem = metaDeck(DECKS.golem, 40, 22, { 'hog-rider': [20, 14] });
    const r = counterReport([variant, same, golem], hog);
    expect(r.exact?.key).toBe(same.key);
    expect(r.close.map((c) => [c.deck.key, c.shared, c.exact])).toEqual([
      [same.key, 8, true],
      [variant.key, 6, false],
    ]);
    // The variant beats Hog decks, but it's a Hog deck itself: not a counter.
    expect(r.counters.map((c) => c.deck.key)).toEqual([golem.key]);
    // Decks like yours went 5–11 against Golem (10 + 6 games); Pekka has only 4 games, X-Bow is a win.
    expect(r.tough).toEqual([{ vs: 'Golem', vsSlug: 'golem', games: 16, wins: 5, decks: 2 }]);
    expect(r.counters[0].likeYours).toEqual({ games: 16, wins: 5 });
  });

  it('matches the exact deck only with the same evo and hero forms', () => {
    const evoHog = metaDeck(DECKS.hog, 30, 16, {}, { evo: ['cannon'] });
    const r = counterReport([evoHog], hog);
    expect(r.exact).toBeNull();
    expect(r.close[0]).toMatchObject({ shared: 8, exact: false });
  });

  it('suggests nothing without a win condition or enough cards', () => {
    const golem = metaDeck(DECKS.golem, 40, 22, { 'hog-rider': [20, 14] });
    const noWc = built(['knight', 'valkyrie', 'wizard', 'arrows', 'skeletons', 'ice-spirit', 'cannon', 'archers']);
    expect(counterReport([golem], noWc)).toMatchObject({ winCon: null, counters: [] });
    const partial = built(['hog-rider', 'the-log']);
    const r = counterReport([golem, metaDeck(DECKS.hog, 30, 16)], partial);
    // Two cards are enough to know the win condition, not to call a deck "like yours".
    expect(r.counters).toHaveLength(1);
    expect(r.close).toEqual([]);
  });

  it('respects a custom game floor and limit', () => {
    const decks = [DECKS.golem, DECKS.pekka, DECKS.knight].map((d, i) => metaDeck(d, 30, 15, { 'hog-rider': [8 + i, 6 + i] }));
    expect(counterReport(decks, hog, { minGames: 10 }).counters).toHaveLength(1);
    expect(counterReport(decks, hog, { limit: 2 }).counters).toHaveLength(2);
  });
});

describe('counter suggestions', () => {
  const hog = built(DECKS.hog);
  const xbow = ['x-bow', 'tesla', 'archers', 'the-log', 'fireball', 'skeletons', 'ice-spirit', 'knight'];

  it('sums a win condition across decks when no single deck has enough games', () => {
    // Three Golem decks with 3 games each vs Hog: none passes the floor alone, together 7 of 9.
    const golems = [0, 1, 2].map((i) => metaDeck([...DECKS.golem.slice(0, 7), ['zap', 'arrows', 'tornado'][i]], 20 + i, 11, { 'hog-rider': [3, i === 0 ? 3 : 2] }));
    const r = counterReport(golems, hog);
    expect(r.counters).toEqual([]);
    expect(r.suggestions[0]).toMatchObject({ basis: 'winCon', vs: { games: 9, wins: 7 }, decks: 3 });
    // The representative is one deck, not all three.
    expect(r.suggestions.filter((x) => x.basis === 'winCon')).toHaveLength(1);
  });

  it('puts decks with their own record first, then falls back to counter cards', () => {
    const proven = metaDeck(DECKS.golem, 40, 22, { 'hog-rider': [20, 14] });
    // No games against Hog, but Tesla and the Log... only Tesla counters Hog; Cannon + Tesla does.
    const buildings = metaDeck(['x-bow', 'tesla', 'cannon', 'the-log', 'fireball', 'skeletons', 'ice-spirit', 'archers'], 30, 18);
    const oneCard = metaDeck(xbow, 50, 30);
    const r = counterReport([oneCard, buildings, proven], hog);
    expect(r.suggestions.map((x) => [x.deck.key, x.basis])).toEqual([
      [proven.key, 'deck'],
      [buildings.key, 'cards'],
    ]);
    expect(r.suggestions[1].counterCards.sort()).toEqual(['Cannon', 'Tesla']);
  });

  it('never suggests a mirror or a variant of the built deck', () => {
    const otherHog = metaDeck(['hog-rider', 'cannon', 'tesla', 'tornado', 'mini-pekka', 'the-log', 'zap', 'skeletons'], 40, 30, { 'hog-rider': [20, 15] });
    expect(counterReport([otherHog], hog).suggestions).toEqual([]);
  });

  it('pools modes: the same deck adds up its games and matchups', () => {
    const a = metaDeck(DECKS.golem, 10, 6, { 'hog-rider': [3, 2] });
    const b = metaDeck(DECKS.golem, 5, 2, { 'hog-rider': [2, 2], pekka: [1, 0] });
    const [p] = poolDecks([[a], [b]]);
    expect(p).toMatchObject({ games: 15, wins: 8 });
    expect(p.matchups).toEqual([
      { vs: 'Hog Rider', vsSlug: 'hog-rider', games: 5, wins: 4 },
      { vs: 'P.E.K.K.A', vsSlug: 'pekka', games: 1, wins: 0 },
    ]);
    // The inputs are left alone.
    expect(a.matchups[0].games).toBe(3);
  });

  it('names only real cards and win conditions in the counter table', () => {
    for (const [wc, list] of Object.entries(COUNTER_CARDS)) {
      expect(cardBySlug(wc), wc).toBeTruthy();
      for (const c of list) expect(cardBySlug(c), `${wc} → ${c}`).toBeTruthy();
    }
  });
});
