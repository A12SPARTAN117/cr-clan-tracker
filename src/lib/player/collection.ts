import 'server-only';
import { getPlayer } from '../cr/api';
import { cardById, realLevel } from '../cards';
import type { Collection } from '../builder';

/**
 * A player's cards for the deck builder: one cached API call (the player), no battle log.
 * Fails with the API's status, so a missing player (404) reads differently from an outage.
 */
export async function playerCollection(tag: string): Promise<{ ok: true; data: Collection } | { ok: false; status: number }> {
  const r = await getPlayer(tag);
  if (!r.ok) return { ok: false, status: r.status };
  const p = r.data;
  const cards: Collection['cards'] = {};
  for (const c of p.cards) {
    const info = cardById(c.id);
    const lv = c.evolutionLevel ?? 0;
    // On a player's card, evolutionLevel says what is unlocked: 1 evo, 2 hero, 3 both (as in profile.ts).
    cards[c.id] = {
      level: realLevel(c.level, c.maxLevel),
      evo: !!info?.hasEvolution && (lv === 1 || lv === 3 || (!info.hasHero && lv > 0)),
      hero: !!info?.hasHero && (lv === 2 || lv === 3 || (!info.hasEvolution && lv > 0)),
    };
  }
  const towers: Collection['towers'] = {};
  for (const t of p.supportCards ?? []) towers[t.id] = realLevel(t.level, t.maxLevel);
  return { ok: true, data: { tag: p.tag.replace('#', ''), name: p.name, cards, towers } };
}
