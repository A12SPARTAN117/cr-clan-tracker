/**
 * One gate for every call to the Clash Royale API. The site shares a single API key with a rate
 * limit, and several features call it in bursts (the meta snapshot, the directory crawl, page
 * loads), so without a shared pace one burst can trip the key's limit for everyone.
 *
 * - Pacing is a token bucket: up to `burst` calls start at once, then `perSecond` a second.
 * - When the API answers 429, every caller's next start moves past the pause (Retry-After, or
 *   `backoffMs`) and the call is retried once.
 *
 * - Under overload a visitor's call that would wait more than `maxWaitMs` (5 s) isn't queued: it answers
 *   "busy" at once (`onBusy`), so pages say so instead of hanging while the queue grows. Cached data
 *   keeps being served (stale entries while they refresh); only never-seen tags need a call.
 * - Background work (`background: true`: the cron jobs) waits until the queue is short, so it
 *   never stands in front of visitors.
 *
 * Each call works out its own start time and waits on its own timer. It never waits for another
 * request to finish: almost every API call runs inside a "use cache" function, and Next.js
 * forbids cached work from awaiting promises that other requests resolve (it can hang or corrupt
 * cache fills). Background jobs (the directory crawl) pace themselves on top of this, so they
 * can only take a small share of the budget.
 */

export type LimiterOptions = { perSecond?: number; burst?: number; backoffMs?: number; maxWaitMs?: number; now?: () => number };
export type RunOptions<T> = { background?: boolean; onBusy?: () => T };

/** Background calls start only while the queue ahead of them is shorter than this. */
const BACKGROUND_BACKLOG_MS = 1000;
type Answer = { status: number; retryAfter?: number | null };

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

export function createLimiter({ perSecond = 20, burst = 10, backoffMs = 2000, maxWaitMs = Infinity, now = Date.now }: LimiterOptions = {}) {
  const interval = 1000 / perSecond;
  const tolerance = (burst - 1) * interval;
  // GCRA: `tat` is when the bucket would be empty again; a call may start once tat - tolerance has passed.
  let tat = 0;
  let pausedUntil = 0;
  const stats = { started: 0, delayed: 0, throttled429: 0, shed: 0 };

  /** Reserves the next start time for one call; returns how long to wait for it. */
  function reserve(): number {
    const t = now();
    const start = Math.max(t, tat - tolerance, pausedUntil);
    tat = Math.max(tat, start) + interval;
    stats.started++;
    if (start > t) stats.delayed++;
    return start - t;
  }

  /** How long a call starting now would wait (without reserving it). */
  function backlog(): number {
    const t = now();
    return Math.max(0, Math.max(tat - tolerance, pausedUntil) - t);
  }

  /** Runs one API call at its paced time. `call` returns the HTTP status and any Retry-After. */
  async function run<T extends Answer>(call: () => Promise<T>, { background = false, onBusy }: RunOptions<T> = {}): Promise<T> {
    if (background) while (backlog() > BACKGROUND_BACKLOG_MS) await sleep(250);
    else if (onBusy && backlog() > maxWaitMs) {
      stats.shed++;
      return onBusy();
    }
    await sleep(reserve());
    const r = await call();
    if (r.status !== 429) return r;
    stats.throttled429++;
    pausedUntil = Math.max(pausedUntil, now() + (r.retryAfter ? r.retryAfter * 1000 : backoffMs));
    await sleep(reserve());
    return call();
  }

  return { run, reserve, backlog, stats };
}

/** The process-wide gate the API client uses (kept across hot reloads in development). */
const g = globalThis as unknown as { __crLimiter3?: ReturnType<typeof createLimiter> };
// CR_API_RATE: calls a second for this server (default 20), for when the key's real limit is known.
export const limiter = (g.__crLimiter3 ??= createLimiter({ perSecond: Number(process.env.CR_API_RATE) || 20, maxWaitMs: 5000 }));
