import { revalidateTag } from 'next/cache';
import { connection } from 'next/server';
import { cronAuthorized } from '@/lib/cron-auth';
import { getDb } from '@/lib/db';
import { buildMeta } from '@/lib/meta';
import { recordMeta } from '@/lib/metaHistory';
import { saveSnapshot, snapshotTime } from '@/lib/snapshots';

export const maxDuration = 300;

/** A stored meta younger than this is kept; the job runs every 30 minutes, so meta is rebuilt hourly. */
const META_EVERY_MS = 50 * 60_000;

/**
 * Builds the data that is the same for every visitor and stores it, so pages read it instead of
 * calling the Clash Royale API: the meta decks (about 250 battle logs). Same auth as the other
 * jobs: `Authorization: Bearer $CRON_SECRET`. `?force=1` rebuilds even when the stored copy is fresh.
 */
export async function GET(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await getDb())) return Response.json({ error: 'DATABASE_URL is not set' }, { status: 503 });
  const force = new URL(req.url).searchParams.get('force') === '1';

  const last = await snapshotTime('meta');
  let meta: { built: boolean; generatedAt: string | null; battles?: number } = { built: false, generatedAt: last?.toISOString() ?? null };
  if (force || !last || Date.now() - last.getTime() > META_EVERY_MS) {
    const m = await buildMeta();
    if (m) {
      await saveSnapshot('meta', m, new Date(m.generatedAt));
      // Today's decks, for rising and falling decks.
      await recordMeta(m);
      revalidateTag('meta', 'max');
      meta = { built: true, generatedAt: m.generatedAt, battles: m.battles };
    }
  }
  return Response.json({ meta });
}
