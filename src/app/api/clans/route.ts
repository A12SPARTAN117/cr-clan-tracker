import { clanList } from '@/app/clans/data';
import { limitRequest } from '@/lib/ratelimit';

/** A clan list for /clans' name and location filters: GET /api/clans?q=…&loc=… (cached by the CDN). */
export async function GET(req: Request) {
  const limited = limitRequest(req, 'search');
  if (limited) return limited;
  const p = new URL(req.url).searchParams;
  const q = (p.get('q') ?? '').trim().slice(0, 40);
  const loc = Number(p.get('loc')) || null;
  const list = await clanList(q.length >= 3 ? q : '', loc);
  return Response.json(list, { headers: { 'Cache-Control': list.failed ? 'no-store' : 'public, max-age=120, s-maxage=300, stale-while-revalidate=900' } });
}
