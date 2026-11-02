import { describe, expect, it, vi } from 'vitest';
import type { Battle, Clan } from '@/lib/cr/types';
import { battle, cards, DECKS, MODES, side } from '../fixtures/battles';

/**
 * buildMeta right after a season reset: the ranked ladder is empty, so the snapshot is built from
 * the top war clans' members alone (six clans instead of three) instead of not at all.
 */
const state = { warClans: 7 };
const fetched: string[] = [];
const ladder = (tag: string): Battle[] => [battle('PvP', MODES.ladder, new Date(Date.now() - 3600_000), [side(tag, cards(DECKS.hog), 1)], [side(`${tag}x`, cards(DECKS.golem), 0)])];

vi.mock('@/lib/cr/api', () => ({
  getPolLeaderboard: async () => ({ ok: true, data: { items: [] } }),
  getClanWarRankings: async () => ({
    ok: true,
    data: { items: Array.from({ length: state.warClans }, (_, i) => ({ tag: `#C${i}`, name: `Clan ${i}`, rank: i + 1, previousRank: i + 1, members: 1, badgeId: 1 })) },
  }),
  getClan: async (tag: string) => {
    fetched.push(tag);
    return { ok: true, data: { tag: `#${tag}`, name: tag, memberList: [{ tag: `#M${tag}`, name: `M${tag}` }] } as unknown as Clan };
  },
  fetchBattleLog: async (tag: string) => ({ ok: true, data: ladder(tag) }),
}));

describe('buildMeta with an empty ranked ladder', async () => {
  const { buildMeta } = await import('@/lib/meta');

  it('samples the members of the top six war clans', async () => {
    const meta = await buildMeta();
    expect(meta).not.toBeNull();
    expect(fetched).toEqual(['C0', 'C1', 'C2', 'C3', 'C4', 'C5']);
    expect(meta!.players).toBe(6);
    expect(meta!.modes.ladder.battles).toBe(6);
  });

  it('gives up only when there are no clans either', async () => {
    state.warClans = 0;
    expect(await buildMeta()).toBeNull();
  });
});
