import { and, asc, gte, sql } from 'drizzle-orm';
import { connection } from 'next/server';
import { getDb, schema } from '@/lib/db';
import { snapshotClan, type SnapshotResult } from '@/lib/history/snapshot';

export const maxDuration = 300;

/**
 * Snapshot every tracked clan that was viewed in the last 30 days, stalest first.
 * Call it every 30 minutes (Vercel Cron, GitHub Actions, a server crontab…) with
 * `Authorization: Bearer $CRON_SECRET`. War days need at least one snapshot shortly
 * before each daily reset (~09:40 UTC) to capture full per-day deck counts.
 */
export async function GET(req: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const db = await getDb();
  if (!db) return Response.json({ error: 'DATABASE_URL is not set' }, { status: 503 });

  const limit = Math.min(200, Number(new URL(req.url).searchParams.get('limit')) || 50);
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
  return Response.json({ tracked: clans.length, snapshotted: results.filter((r) => r.ok).length, results });
}
