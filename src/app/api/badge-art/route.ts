import { connection } from 'next/server';
import { listBadgeArt } from '@/lib/badgeArt';
import { limitRequest } from '@/lib/ratelimit';

/**
 * Every player badge level the site has seen, with its official image link (public data from
 * the Clash Royale API). Read by scripts/asset-checklist.mjs, which saves copies of the levels
 * the site is still missing.
 */
export async function GET(req: Request) {
  const limited = limitRequest(req, 'route');
  if (limited) return limited;
  await connection();
  const rows = await listBadgeArt().catch(() => null);
  if (!rows) return Response.json({ error: 'no database' }, { status: 503 });
  return Response.json({ count: rows.length, rows }, { headers: { 'Cache-Control': 'no-store' } });
}
