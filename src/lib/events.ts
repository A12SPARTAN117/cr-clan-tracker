import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { connection } from 'next/server';
import { getEventLeaderboard, getEventLeaderboards, type ApiResult } from './cr/api';
import type { EventRanked, Paged } from './cr/types';
import { enqueue, getDb, schema } from './db';

/** A board counts as live while its standings moved in this window. */
const LIVE_MS = 48 * 3600_000;
/** A board seen for the first time gets this long to show it moves before it is hidden. */
const GRACE_MS = 6 * 3600_000;

export type EventBoard = { id: number; name: string; data: ApiResult<Paged<EventRanked>> };

/**
 * Whether a board is live, given what was stored at the last check (`prev`) and the top of the
 * board now. Live while it moved in the last 48 hours; a board never seen to move is given six
 * hours from when it was first seen.
 */
export function boardState(prev: { sig: string; firstSeenAt: Date; changedAt: Date | null } | undefined, sig: string, now: number): { live: boolean; changed: boolean } {
  const changed = !!prev && prev.sig !== sig;
  const moved = changed ? now : (prev?.changedAt?.getTime() ?? null);
  const firstSeen = prev?.firstSeenAt.getTime() ?? now;
  return { changed, live: moved != null ? now - moved < LIVE_MS : now - firstSeen < GRACE_MS };
}

/**
 * Event leaderboards for modes that are in the game right now. The API lists every board it
 * still keeps (seasons of Merge Tactics, 2v2 League and Retro Royale from months ago) with no
 * start or end date, so each check stores the top of every board and a board is live while that
 * keeps changing. Without a database every named board is shown, as before.
 */
export async function liveEventBoards(): Promise<EventBoard[]> {
  const list = await getEventLeaderboards();
  if (!list.ok) return [];
  // Several seasons share a name; keep the newest board per name.
  const newest = new Map<string, number>();
  for (const e of list.data.items) if (e.name && (newest.get(e.name) ?? 0) < e.id) newest.set(e.name, e.id);
  const boards = await Promise.all([...newest].map(async ([name, id]) => ({ id, name, data: await getEventLeaderboard(id, 100) })));

  const db = await getDb();
  if (!db) return boards;
  // Live means live now: this part runs per request, never in a prerender.
  await connection();
  // One queue for every write: the embedded Postgres used in development is single-threaded.
  return enqueue(async () => {
    try {
      const now = Date.now();
      const ids = boards.map((b) => b.id);
      const known = new Map((await db.select().from(schema.eventBoards).where(inArray(schema.eventBoards.id, ids))).map((r) => [r.id, r]));
      const live: EventBoard[] = [];
      for (const b of boards) {
        if (!b.data.ok) continue;
        const sig = b.data.data.items.slice(0, 50).map((p) => `${p.tag}:${p.score}`).join(',');
        const row = known.get(b.id);
        const state = boardState(row, sig, now);
        if (!row) await db.insert(schema.eventBoards).values({ id: b.id, name: b.name, sig }).onConflictDoNothing();
        else if (state.changed) await db.update(schema.eventBoards).set({ sig, changedAt: new Date(now) }).where(eq(schema.eventBoards.id, b.id));
        if (state.live) live.push(b);
      }
      return live;
    } catch (e) {
      console.warn('[events] could not check which boards are live (is migration 0004 applied?):', e instanceof Error ? e.message : e);
      return boards;
    }
  });
}
