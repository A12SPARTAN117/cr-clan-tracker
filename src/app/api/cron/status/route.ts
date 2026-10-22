import { connection } from 'next/server';
import { limiter } from '@/lib/cr/limiter';
import { cronAuthorized } from '@/lib/cron-auth';
import { writeStats } from '@/lib/db';

/**
 * This server's Clash Royale API counters since it started: calls made, calls that had to wait
 * for the shared pace, and 429s; and background database writes queued. A rising 429 count is the signal to lengthen freshness or add a
 * key for background jobs. Per server process (each serverless instance counts on its own).
 * Same auth as the jobs: `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const mem = process.memoryUsage();
  return Response.json(
    { api: limiter.stats, writesQueued: writeStats.queued, uptimeS: Math.round(process.uptime()), rssMb: Math.round(mem.rss / 2 ** 20), heapMb: Math.round(mem.heapUsed / 2 ** 20) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
