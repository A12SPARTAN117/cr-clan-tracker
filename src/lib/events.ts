import 'server-only';
import { eq, inArray } from 'drizzle-orm';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { anyFailed, getEventLeaderboard, getEventLeaderboards, getEventRankIndex, type ApiResult } from './cr/api';
import type { EventRanked, Paged } from './cr/types';
import { enqueue, getDb, schema } from './db';
import { readSnapshot, saveSnapshot } from './snapshots';

/** A board counts as live while its standings moved in this window. */
const LIVE_MS = 48 * 3600_000;
/** A board seen for the first time gets this long to show it moves before it is hidden. */
const GRACE_MS = 2 * 3600_000;

export type EventBoard = { id: number; name: string; data: ApiResult<Paged<EventRanked>> };

/**
 * Whether a board is live, given what was stored at the last check (`prev`) and the top of the
 * board now. Live while it moved in the last 48 hours; a board never seen to move is given two
 * hours from when it was first seen.
 */
export function boardState(prev: { sig: string; firstSeenAt: Date; changedAt: Date | null } | undefined, sig: string, now: number): { live: boolean; changed: boolean } {
  const changed = !!prev && prev.sig !== sig;
  const moved = changed ? now : (prev?.changedAt?.getTime() ?? null);
  const firstSeen = prev?.firstSeenAt.getTime() ?? now;
  return { changed, live: moved != null ? now - moved < LIVE_MS : now - firstSeen < GRACE_MS };
}

/** The newest board of each name (several seasons share one) with its top 100; null if the list failed. */
async function namedBoards(): Promise<EventBoard[] | null> {
  const list = await getEventLeaderboards();
  if (!list.ok) return null;
  const newest = new Map<string, number>();
  for (const e of list.data.items) if (e.name && (newest.get(e.name) ?? 0) < e.id) newest.set(e.name, e.id);
  return Promise.all([...newest].map(async ([name, id]) => ({ id, name, data: await getEventLeaderboard(id, 100) })));
}

/**
 * Event leaderboards for modes that are in the game right now, from the API. The API lists every
 * board it still keeps (seasons of Merge Tactics, 2v2 League and Retro Royale from months ago)
 * with no start or end date, so each check stores the top of every board and a board is live
 * while that keeps changing. Only the cron job calls this (it writes); pages use liveEventBoards.
 * Without a database every named board counts as live. Null when the API couldn't list them.
 */
async function checkLiveBoards(): Promise<EventBoard[] | null> {
  const boards = await namedBoards();
  if (!boards) return null;
  const db = await getDb();
  if (!db) return boards;
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

/** What the cron job stores: the live boards' top 100s, and one tag → [rank, score] index per board. */
type StoredBoards = { boards: EventBoard[] };
const indexKind = (id: number) => `event-index:${id}`;

/**
 * Cron job: works out which boards are live, downloads each live board's full listing (about
 * 10,000 players) and stores both, so player pages and the leaderboards never call the API for them.
 */
export async function refreshEventBoards(): Promise<{ live: string[]; indexed: number } | null> {
  const live = await checkLiveBoards();
  // Keep the last good copy when the API can't list the boards.
  if (!live) return null;
  let indexed = 0;
  const now = new Date();
  for (const b of live) {
    const idx = await getEventRankIndex(b.id);
    if (!idx) continue;
    await saveSnapshot(indexKind(b.id), idx, now);
    indexed++;
  }
  await saveSnapshot('events', { boards: live } satisfies StoredBoards, now);
  revalidateTag('events', 'max');
  return { live: live.map((b) => b.name), indexed };
}

/**
 * The live event boards with their top 100, as the cron job last stored them. With no database
 * (or before the first run) every named board is read from the API, without the live check.
 */
export async function liveEventBoards(): Promise<EventBoard[]> {
  'use cache';
  cacheTag('events');
  const stored = await readSnapshot<StoredBoards>('events');
  if (stored) {
    cacheLife('meta');
    return stored.data.boards;
  }
  const boards = await namedBoards();
  if (!boards) {
    cacheLife('crError');
    return [];
  }
  if (anyFailed(boards.map((b) => b.data))) cacheLife('crError');
  else cacheLife('cr');
  return boards;
}

/** A board's tag → [rank, score] index: the stored one, or (no database) the API's. */
async function loadIndex(id: number): Promise<Record<string, [number, number]> | null> {
  const stored = await readSnapshot<Record<string, [number, number]>>(indexKind(id));
  return stored ? stored.data : getEventRankIndex(id);
}

type RankTable = { id: number; name: string; idx: Map<string, [number, number]> }[];
const RANKS_MS = 10 * 60_000;
const g = globalThis as unknown as { __crRanks?: { at: number; table: Promise<RankTable> } };

async function loadRankTable(): Promise<RankTable> {
  const live = await liveEventBoards();
  const boards = await Promise.all(live.map(async (b) => ({ id: b.id, name: b.name, idx: await loadIndex(b.id) })));
  return boards.flatMap((b) => (b.idx ? [{ id: b.id, name: b.name, idx: new Map(Object.entries(b.idx)) }] : []));
}

/**
 * Every live board's index as plain maps, kept in this server's memory for 10 minutes and shared
 * by all requests. Not a 'use cache' entry: those are stored serialized and decoded on every hit,
 * and decoding seven 10,000-entry indexes on each player view was most of that page's CPU.
 */
function rankTable(): Promise<RankTable> {
  const now = Date.now();
  if (g.__crRanks && now - g.__crRanks.at < RANKS_MS) return g.__crRanks.table;
  const table = loadRankTable();
  g.__crRanks = { at: now, table };
  // A failed load is tried again on the next view.
  table.catch(() => {
    if (g.__crRanks?.table === table) g.__crRanks = undefined;
  });
  return table;
}

/** A player's place on a live event leaderboard; rank null when they're past the ~10,000 the API lists. */
export type EventRank = { id: number; name: string; rank: number | null; score: number | null; listed: number };

/** Where a player stands on every event leaderboard that is live right now. Request time only. */
export async function eventRanksOf(tagRaw: string): Promise<EventRank[]> {
  const tag = tagRaw.replace(/^#/, '').toUpperCase();
  return (await rankTable()).map((b) => {
    const hit = b.idx.get(tag);
    return { id: b.id, name: b.name, rank: hit?.[0] ?? null, score: hit?.[1] ?? null, listed: b.idx.size };
  });
}
