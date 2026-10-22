import { and, asc, gte, isNull, lt, or, sql } from 'drizzle-orm';
import { connection } from 'next/server';
import { cronAuthorized } from '@/lib/cron-auth';
import { getDb, schema } from '@/lib/db';
import { snapshotClan, snapshotPlayer, type SnapshotResult } from '@/lib/history/snapshot';

export const maxDuration = 300;

/** Pause between player snapshots, so the daily sweep takes a small share of the API rate limit. */
const PLAYER_PACE_MS = 250;

/**
 * Snapshot every tracked clan that was viewed in the last 30 days, stalest first, then give each
 * tracked player viewed in the last 30 days their one snapshot of the day (UTC).
 * Call it every 30 minutes (Vercel Cron, GitHub Actions, a server crontab…) with
 * `Authorization: Bearer $CRON_SECRET`. War days need at least one snapshot shortly
 * before each daily reset (~09:40 UTC) to capture full per-day deck counts.
 */
export async function GET(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const db = await getDb();
  if (!db) return Response.json({ error: 'DATABASE_URL is not set' }, { status: 503 });

  const params = new URL(req.url).searchParams;
  const limit = Math.min(200, Number(params.get('limit')) || 50);
  const playerLimit = Math.min(500, Number(params.get('players')) || 150);
  const since = new Date(Date.now() - 30 * 86400_000);
  const clans = await db
    .select({ tag: schema.trackedClans.tag })
    .from(schema.trackedClans)
    .where(and(gte(schema.trackedClans.lastViewedAt, since)))
    .orderBy(asc(sql`coalesce(${schema.trackedClans.lastSnapshotAt}, 'epoch'::timestamptz)`))
    .limit(limit);

  const started = Date.now();
  const results: SnapshotResult[] = [];
  for (const c of clans) {
    // Stay inside the function's time budget; the rest get picked up next run.
    if (Date.now() - started > 240_000) break;
    try {
      results.push(await snapshotClan(c.tag));
    } catch (e) {
      results.push({ tag: c.tag, ok: false, reason: e instanceof Error ? e.message : 'failed' });
    }
  }

  // Players: one snapshot a day each. Anyone not done yet today, stalest first; the rest wait
  // for the next run (48 runs a day leave plenty of room).
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const players = await db
    .select({ tag: schema.trackedPlayers.tag })
    .from(schema.trackedPlayers)
    .where(and(gte(schema.trackedPlayers.lastViewedAt, since), or(isNull(schema.trackedPlayers.lastSnapshotAt), lt(schema.trackedPlayers.lastSnapshotAt, today))))
    .orderBy(asc(sql`coalesce(${schema.trackedPlayers.lastSnapshotAt}, 'epoch'::timestamptz)`))
    .limit(playerLimit);
  const playerResults: SnapshotResult[] = [];
  for (const p of players) {
    if (Date.now() - started > 240_000) break;
    try {
      playerResults.push(await snapshotPlayer(p.tag));
    } catch (e) {
      playerResults.push({ tag: p.tag, ok: false, reason: e instanceof Error ? e.message : 'failed' });
    }
    await new Promise((r) => setTimeout(r, PLAYER_PACE_MS));
  }

  return Response.json({
    tracked: clans.length,
    snapshotted: results.filter((r) => r.ok).length,
    results,
    players: { due: players.length, snapshotted: playerResults.filter((r) => r.ok).length, failed: playerResults.filter((r) => !r.ok) },
  });
}
