import { describe, expect, it } from 'vitest';
import { cardBySlug } from '@/lib/cards';
import { achievements, closeness, deckStyle, elixirStats, heatmap, parseDeck, playstyle, tilt } from '@/lib/player/insights';
import type { H2HGame } from '@/lib/player/rivals';

let t = Date.parse('2026-10-20T12:00:00Z');
/** Games are built oldest first and returned newest first, like the site loads them. */
const g = (result: -1 | 0 | 1, x: Partial<H2HGame> = {}): H2HGame => {
  t -= 60_000;
  return { time: new Date(t).toISOString(), oppTag: 'OPP', oppName: 'opp', oppClan: null, kind: 'ranked', result, crowns: result > 0 ? 1 : 0, oppCrowns: result < 0 ? 1 : 0, ...x };
};
const deck = (...slugs: string[]) => slugs.map((s) => cardBySlug(s)!.id).join(',');

describe('close games', () => {
  it('counts one-crown games and draws as close', () => {
    expect(closeness(g(1, { crowns: 2, oppCrowns: 1 }))).toBe('close');
    expect(closeness(g(0, { crowns: 1, oppCrowns: 1 }))).toBe('close');
  });

  it('counts a big crown margin as a blowout unless the winner barely kept a tower', () => {
    expect(closeness(g(1, { crowns: 3, oppCrowns: 0, towers: '7728,4337,4629' }))).toBe('blowout');
    // Won 2–0 but was left with a tower on 354 HP.
    expect(closeness(g(1, { crowns: 2, oppCrowns: 0, towers: '7728,354,4264' }))).toBe('close');
  });

  it('averages elixir leaked and splits the record by close and blowout games', () => {
    const s = elixirStats([g(1, { leak: 1 }), g(-1, { leak: 3 }), g(1, { crowns: 3, oppCrowns: 0, leak: null })]);
    expect(s.leak).toBe(2);
    expect(s.leakGames).toBe(2);
    expect(s.leakWins).toBe(1);
    expect(s.close).toMatchObject({ w: 1, l: 1, games: 2 });
    expect(s.blowout).toMatchObject({ w: 1, l: 0, games: 1 });
  });
});

describe('playstyle', () => {
  it('reads a heavy Golem deck as beatdown and a 2.6 Hog deck as cycle', () => {
    const golem = parseDeck(deck('golem', 'night-witch', 'baby-dragon', 'lumberjack', 'tornado', 'lightning', 'barbarian-barrel', 'mega-minion'))!;
    const hog = parseDeck(deck('hog-rider', 'musketeer', 'ice-golem', 'ice-spirit', 'skeletons', 'cannon', 'fireball', 'the-log'))!;
    const b = deckStyle(golem.slugs, golem.elixir!);
    const c = deckStyle(hog.slugs, hog.elixir!);
    expect(b.Beatdown).toBeGreaterThan(b.Cycle);
    expect(c.Cycle).toBeGreaterThan(c.Beatdown);
  });

  it('picks the main style across games and counts only games with a deck', () => {
    const bait = deck('goblin-barrel', 'princess', 'goblin-gang', 'rocket', 'the-log', 'knight', 'inferno-tower', 'ice-spirit');
    const p = playstyle([g(1, { deck: bait }), g(-1, { deck: bait }), g(1)]);
    expect(p.games).toBe(2);
    expect(p.decks).toBe(1);
    expect(p.main).toBe('Bait');
  });
});

describe('time and tilt', () => {
  it('buckets wins and losses by weekday and hour', () => {
    const cells = heatmap([g(1), g(-1), g(0)], () => ({ day: 2, hour: 21 }));
    expect(cells[2][21]).toEqual({ w: 1, l: 1 });
  });

  it('records how the next game went after three straight losses, and the current run', () => {
    // Oldest → newest: L L L W L L L L, then a friendly win that doesn't count.
    const seq = [g(-1), g(-1), g(-1), g(1), g(-1), g(-1), g(-1), g(-1), g(1, { kind: 'friendly' })].reverse();
    const x = tilt(seq);
    expect(x.next).toMatchObject({ w: 1, l: 1 });
    expect(x.current).toBe(4);
  });
});

describe('achievements', () => {
  it('awards Comeback King for three wins straight after three losses', () => {
    const seq = [g(-1), g(-1), g(-1), g(1), g(1), g(1)].reverse();
    expect(achievements(seq, null).find((a) => a.id === 'comeback')!.earned).toBe(true);
    expect(achievements([g(-1), g(1), g(1), g(1)].reverse(), null).find((a) => a.id === 'comeback')!.earned).toBe(false);
  });

  it('counts Iron Man races back from the latest', () => {
    const a = achievements([], [{ decks: 16 }, { decks: 16 }, { decks: 12 }, { decks: 16 }]).find((x) => x.id === 'iron-man')!;
    expect(a.progress).toBe(2);
    expect(a.earned).toBe(false);
  });

  it('awards Giant Slayer only for a win against a deck 3+ levels higher in total', () => {
    const find = (gs: H2HGame[]) => achievements(gs, null).find((x) => x.id === 'giant-slayer')!.earned;
    expect(find([g(1, { levelGap: 3 })])).toBe(true);
    expect(find([g(1, { levelGap: 2 }), g(-1, { levelGap: 5 })])).toBe(false);
  });
});
