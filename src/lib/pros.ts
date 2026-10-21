import 'server-only';
import { cacheLife } from 'next/cache';
import { desc, inArray } from 'drizzle-orm';
import { cardById } from './cards';
import { anyFailed, getPlayer, getPolLeaderboard } from './cr/api';
import { enqueue, getDb, schema } from './db';
import { deckKey, deckLink, deckName, deckStats, toDeckCard, winConOf, type DeckCard } from './decks';
import { pool } from './pool';

/** A top Path of Legends player and the deck they have equipped right now. */
export type Pro = {
  rank: number;
  tag: string;
  name: string;
  rating: number;
  clan: string | null;
  deck: { key: string; name: string; cards: DeckCard[]; tower: { slug: string; name: string; img: string | null } | null; avgElixir: number; cycle: number; link: string } | null;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

/**
 * The global Path of Legends top `limit` and each one's current deck, from their profiles.
 * Cached like other API data (refreshed every few minutes), so the page and the cron share it.
 */
export async function getPros(limit = 100): Promise<Pro[] | null> {
  'use cache';
  const top = await getPolLeaderboard('global', limit);
  if (!top.ok) {
    cacheLife('crError');
    return null;
  }
  const profiles = await pool(top.data.items, 10, (p) => getPlayer(bare(p.tag)));
  if (anyFailed(profiles)) cacheLife('crError');
  else cacheLife('cr');
  return top.data.items.map((p, i): Pro => {
    const r = profiles[i];
    const cur = r?.ok ? r.data.currentDeck : [];
    let deck: Pro['deck'] = null;
    if (cur.length === 8) {
      const cards = cur.map(toDeckCard);
      const t = r?.ok ? r.data.currentDeckSupportCards?.[0] : undefined;
      deck = {
        key: deckKey(cards),
        name: deckName(cards, winConOf(cards)),
        cards,
        tower: t ? { slug: cardById(t.id)?.slug ?? 'tower-princess', name: t.name, img: t.iconUrls.medium ?? null } : null,
        ...deckStats(cards),
        link: deckLink(cards.map((c) => c.id)),
      };
    }
    return { rank: p.rank, tag: bare(p.tag), name: p.name, rating: p.eloRating, clan: p.clan?.name ?? null, deck };
  });
}

/** Records each pro's deck: extends their current stretch, or starts a new one when they switch. Best-effort. */
export function recordPros(pros: Pro[]) {
  const withDeck = pros.filter((p) => p.deck);
  if (!withDeck.length) return;
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    try {
      const now = new Date();
      const rows = await db.select().from(schema.proDecks).where(inArray(schema.proDecks.tag, withDeck.map((p) => p.tag))).orderBy(desc(schema.proDecks.lastSeenAt));
      const latest = new Map<string, (typeof rows)[number]>();
      for (const r of rows) if (!latest.has(r.tag)) latest.set(r.tag, r);
      for (const p of withDeck) {
        const cur = latest.get(p.tag);
        if (cur && cur.deckKey === p.deck!.key)
          await db.update(schema.proDecks).set({ lastSeenAt: now, rank: p.rank, rating: p.rating, name: p.name }).where(inArray(schema.proDecks.id, [cur.id]));
        else await db.insert(schema.proDecks).values({ tag: p.tag, name: p.name, deckKey: p.deck!.key, firstSeenAt: now, lastSeenAt: now, rank: p.rank, rating: p.rating });
      }
    } catch (e) {
      console.warn('[pros] record failed (is migration 0009 applied?):', e instanceof Error ? e.message : e);
    }
  });
}

/** Each pro's deck stretches, newest first (up to 10 a pro): when they started using each deck. */
export type ProStint = { deckKey: string; from: string; to: string };

/** `at`: when this was read (ms), for "switched … ago". */
export async function getProHistory(tags: string[]): Promise<{ at: number; stints: Record<string, ProStint[]> }> {
  const at = Date.now();
  const db = await getDb();
  if (!db || !tags.length) return { at, stints: {} };
  try {
    const rows = await db.select().from(schema.proDecks).where(inArray(schema.proDecks.tag, tags.map(bare))).orderBy(desc(schema.proDecks.lastSeenAt));
    const out: Record<string, ProStint[]> = {};
    for (const r of rows) {
      const list = (out[r.tag] ??= []);
      if (list.length < 10) list.push({ deckKey: r.deckKey, from: r.firstSeenAt.toISOString(), to: r.lastSeenAt.toISOString() });
    }
    return { at, stints: out };
  } catch (e) {
    console.warn('[pros] read history failed (is migration 0009 applied?):', e instanceof Error ? e.message : e);
    return { at, stints: {} };
  }
}
