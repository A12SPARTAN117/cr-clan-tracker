import { connection } from 'next/server';
import { listBadgeArt } from '@/lib/badgeArt';
import { cronAuthorized } from '@/lib/cron-auth';
import { limitRequest } from '@/lib/ratelimit';

/**
 * Every player badge level the site has seen, with its official image link (public data from
 * the Clash Royale API). Read by scripts/asset-checklist.mjs, which saves copies of the levels
 * the site is still missing. Behind CRON_SECRET: it's a maintenance tool, not a public API.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const limited = limitRequest(req, 'route');
  if (limited) return limited;
  await connection();
  const rows = await listBadgeArt().catch(() => null);
  if (!rows) return Response.json({ error: 'no database' }, { status: 503 });
  return Response.json({ count: rows.length, rows }, { headers: { 'Cache-Control': 'no-store' } });
}
