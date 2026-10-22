/**
 * "At most once every `ms` per key" for the best-effort writes a page view triggers (directory
 * entries, stored games, tracking). A profile opened again and again within the window writes
 * nothing; the cron job keeps the stored data current anyway. Per server process: on serverless
 * each instance has its own window, which still bounds the writes.
 */

const g = globalThis as unknown as { __crOnce?: Map<string, number> };
const last = (g.__crOnce ??= new Map());

/** Above this many keys, entries older than an hour (the longest window in use) are dropped. */
const MAX_KEYS = 50_000;
const HOUR = 3600_000;

/** True (and starts a new window) when `key` hasn't passed in the last `ms`. */
export function onceEvery(key: string, ms: number, now = Date.now()): boolean {
  const t = last.get(key);
  if (t !== undefined && now - t < ms) return false;
  if (last.size >= MAX_KEYS) {
    for (const [k, v] of last) if (now - v >= HOUR) last.delete(k);
    if (last.size >= MAX_KEYS) last.clear();
  }
  last.set(key, now);
  return true;
}

/** Window for storing what a view saw (the profile, opponents, games). */
export const VIEW_WRITE_MS = 15 * 60_000;
/** Window for tracking bookkeeping and roster indexing. */
export const TRACK_MS = HOUR;

/** For tests. */
export const resetOnce = () => last.clear();
