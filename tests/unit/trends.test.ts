import { describe, expect, it } from 'vitest';
import { compareDay, trendsOf } from '@/lib/trends';

const now = (key: string, use: number, games = 20) => ({ key, name: key, games, use });
const then = (deckKey: string, use: number, games = 20) => ({ deckKey, name: deckKey, games, use });

describe('deck trends', () => {
  it('finds rising, falling and new decks against an earlier day', () => {
    const t = trendsOf([now('up', 4), now('flat', 3), now('new', 2, 12), now('tiny', 6, 3)], [then('up', 2), then('flat', 2.9), then('down', 3), then('tiny', 1, 3)], '2026-10-17');
    expect(t.rising.map((x) => x.key)).toEqual(['up']);
    expect(t.falling.map((x) => x.key)).toEqual(['down']);
    expect(t.fresh.map((x) => x.key)).toEqual(['new']);
  });

  it('needs enough games and a real move, not noise', () => {
    // 2.0% → 2.4% is only +0.4 points; 5 games then → 0 now is too few to call a fall.
    const t = trendsOf([now('a', 2.4)], [then('a', 2), then('b', 3, 4)], '2026-10-17');
    expect(t.rising).toEqual([]);
    expect(t.falling).toEqual([]);
  });

  it('compares with the stored day closest to three days back, one to eight days old', () => {
    expect(compareDay(['2026-10-20', '2026-10-19', '2026-10-17', '2026-10-10'], '2026-10-20')).toBe('2026-10-17');
    expect(compareDay(['2026-10-20'], '2026-10-20')).toBeNull();
  });
});
