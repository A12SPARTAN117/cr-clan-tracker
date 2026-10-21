import 'server-only';
import { and, gte, lte, sql } from 'drizzle-orm';
import { cacheLife } from 'next/cache';
import { enqueue, getDb, schema } from './db';
import { getMeta, type MetaSnapshot } from './meta';
import { compareDay, trendsOf, type ModeTrends } from './trends';

/** Decks kept per mode and day: the ones the Decks page can show. */
const KEEP = 80;

/** Stores today's meta (UTC day; later snapshots of the day replace earlier ones). Best-effort. */
export function recordMeta(meta: MetaSnapshot) {
  const day = meta.generatedAt.slice(0, 10);
  const rows = meta.order.flatMap((mode) =>
    meta.modes[mode].decks.slice(0, KEEP).map((d) => ({ day, mode, deckKey: d.key, name: d.name, games: d.games, wins: d.wins, use: d.use })),
  );
  if (!rows.length) return;
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    try {
      for (let i = 0; i < rows.length; i += 200) {
        const part = rows.slice(i, i + 200);
        await db
          .insert(schema.metaDaily)
          .values(part)
          .onConflictDoUpdate({
            target: [schema.metaDaily.day, schema.metaDaily.mode, schema.metaDaily.deckKey],
            set: { name: sql`excluded.name`, games: sql`excluded.games`, wins: sql`excluded.wins`, use: sql`excluded.use` },
          });
      }
    } catch (e) {
      console.warn('[meta] record day failed (is migration 0009 applied?):', e instanceof Error ? e.message : e);
    }
  });
}

/** Rising, falling and new decks per mode, against a stored day about three days back. */
export async function getTrends(meta: MetaSnapshot): Promise<Record<string, ModeTrends>> {
  const db = await getDb();
  if (!db) return {};
  const today = meta.generatedAt.slice(0, 10);
  const from = new Date(Date.parse(today) - 8 * 86_400_000).toISOString().slice(0, 10);
  const yesterday = new Date(Date.parse(today) - 86_400_000).toISOString().slice(0, 10);
  try {
    const rows = await db.select().from(schema.metaDaily).where(and(gte(schema.metaDaily.day, from), lte(schema.metaDaily.day, yesterday)));
    const out: Record<string, ModeTrends> = {};
    for (const mode of meta.order) {
      const mine = rows.filter((r) => r.mode === mode);
      const day = compareDay([...new Set(mine.map((r) => String(r.day)))], today);
      if (!day) continue;
      const then = mine.filter((r) => String(r.day) === day);
      out[mode] = trendsOf(
        meta.modes[mode].decks.map((d) => ({ key: d.key, name: d.name, games: d.games, use: d.use })),
        then.map((r) => ({ deckKey: r.deckKey, name: r.name, games: r.games, use: r.use })),
        day,
      );
    }
    return out;
  } catch (e) {
    console.warn('[meta] read trends failed (is migration 0009 applied?):', e instanceof Error ? e.message : e);
    return {};
  }
}

/** Today's trends for every mode, cached for an hour (snapshots are daily, so they move slowly). */
export async function getMetaTrends(): Promise<Record<string, ModeTrends>> {
  'use cache';
  cacheLife('hours');
  const meta = await getMeta();
  return meta ? getTrends(meta) : {};
}
