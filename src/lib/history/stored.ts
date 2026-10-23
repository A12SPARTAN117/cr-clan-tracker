import 'server-only';
import { eq, lt, sql } from 'drizzle-orm';
import { enqueue, getDb, schema } from '../db';
import type { PlayerLite } from '../player/lite';

/**
 * The last good slim profile of each player whose page was opened (see schema.playerSnapshots).
 * The profile page falls back to it while the Clash Royale API is busy. Best-effort throughout.
 */

const { playerSnapshots } = schema;

export function saveStoredPlayer(tag: string, p: PlayerLite) {
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    try {
      const now = new Date();
      await db
        .insert(playerSnapshots)
        .values({ tag, data: p, savedAt: now })
        .onConflictDoUpdate({ target: playerSnapshots.tag, set: { data: sql`excluded.data`, savedAt: now } });
    } catch (e) {
      console.warn('[stored] save failed (is migration 0011 applied?):', e instanceof Error ? e.message : e);
    }
  });
}

export async function readStoredPlayer(tag: string): Promise<{ p: PlayerLite; savedAt: string } | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [row] = await db.select().from(playerSnapshots).where(eq(playerSnapshots.tag, tag));
    return row ? { p: row.data as PlayerLite, savedAt: row.savedAt.toISOString() } : null;
  } catch {
    return null;
  }
}

/** Drops copies nobody refreshed in 30 days (their pages weren't opened). */
export function pruneStoredPlayers() {
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return 0;
    try {
      const gone = await db.delete(playerSnapshots).where(lt(playerSnapshots.savedAt, new Date(Date.now() - 30 * 86_400_000))).returning({ tag: playerSnapshots.tag });
      return gone.length;
    } catch {
      return 0;
    }
  });
}
