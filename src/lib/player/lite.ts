import type { BattleRow, PlayerProfile } from './profile';

/** The few things the Overview shows about each battle (no decks). */
export type BattleLite = Pick<BattleRow, 'id' | 'kind' | 'hours' | 'result' | 'crowns'> & { opp: { name: string } };

const HEAVY = ['battles', 'collection', 'towers', 'badges', 'mastery', 'achievements', 'decks'] as const;

/**
 * What a profile page needs to show its header, Overview and Insights: the profile without the
 * per-tab lists (both decks of every battle, the collection, badges, mastery, achievements), which
 * were about 95% of the page's data. The other tabs load the full profile when first opened.
 */
export type PlayerLite = Omit<PlayerProfile, (typeof HEAVY)[number]> & { battles: BattleLite[]; cards: { owned: number; total: number } };

export function liteOf(p: PlayerProfile): PlayerLite {
  const lite: Record<string, unknown> = {
    ...p,
    battles: p.battles.map((b): BattleLite => ({ id: b.id, kind: b.kind, hours: b.hours, result: b.result, crowns: b.crowns, opp: { name: b.opp.name } })),
    cards: { owned: p.collection.filter((c) => c.owned).length, total: p.collection.length },
  };
  for (const k of HEAVY) if (k !== 'battles') delete lite[k];
  return lite as PlayerLite;
}
