import 'server-only';
import { and, desc, eq, notInArray } from 'drizzle-orm';
import { enqueue, getDb, schema } from './db';

/**
 * Stored snapshots of data that is the same for everyone (meta decks, …). The cron job builds and
 * saves them; pages read the newest one. Every function is best-effort: no database, or a table
 * not migrated yet, reads as "nothing stored".
 */

const { sharedSnapshots } = schema;

/** Rows kept per kind: the newest, and the one before it. Some kinds are megabytes each. */
const KEEP = 2;

export type Stored<T> = { generatedAt: Date; data: T };

/** The newest snapshot of `kind`, or null. */
export async function readSnapshot<T>(kind: string): Promise<Stored<T> | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [row] = await db.select().from(sharedSnapshots).where(eq(sharedSnapshots.kind, kind)).orderBy(desc(sharedSnapshots.generatedAt)).limit(1);
    return row ? { generatedAt: row.generatedAt, data: row.data as T } : null;
  } catch (e) {
    console.warn(`[snapshots] read ${kind} failed (is migration 0010 applied?):`, e instanceof Error ? e.message : e);
    return null;
  }
}

/** When the newest snapshot of `kind` was built, or null. */
export async function snapshotTime(kind: string): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const [row] = await db
      .select({ at: sharedSnapshots.generatedAt })
      .from(sharedSnapshots)
      .where(eq(sharedSnapshots.kind, kind))
      .orderBy(desc(sharedSnapshots.generatedAt))
      .limit(1);
    return row?.at ?? null;
  } catch {
    return null;
  }
}

/** Saves a snapshot and drops all but the newest rows of the same kind. */
export function saveSnapshot(kind: string, data: unknown, generatedAt: Date) {
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    try {
      await db.insert(sharedSnapshots).values({ kind, generatedAt, data });
      const keep = await db.select({ id: sharedSnapshots.id }).from(sharedSnapshots).where(eq(sharedSnapshots.kind, kind)).orderBy(desc(sharedSnapshots.generatedAt)).limit(KEEP);
      await db.delete(sharedSnapshots).where(and(eq(sharedSnapshots.kind, kind), notInArray(sharedSnapshots.id, keep.map((r) => r.id))));
    } catch (e) {
      console.warn(`[snapshots] save ${kind} failed (is migration 0010 applied?):`, e instanceof Error ? e.message : e);
    }
  });
}
