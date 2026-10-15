import { connection } from 'next/server';
import { clanSummary } from '@/lib/summary';
import { limitRequest } from '@/lib/ratelimit';
import { checkTag } from '@/lib/tags';

/** Cached like the API data behind it (5 minutes), so pinned cards don't refetch on every visit. */
const CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

export async function GET(req: Request, ctx: RouteContext<'/api/summary/clan/[tag]'>) {
  await connection();
  const limited = limitRequest(req, 'summary');
  if (limited) return limited;
  const c = checkTag((await ctx.params).tag);
  if (c.kind !== 'valid') return Response.json({ error: 'invalid tag' }, { status: 400 });
  const s = await clanSummary(c.tag, Date.now());
  return s ? Response.json(s, { headers: { 'Cache-Control': CACHE } }) : Response.json({ error: 'not found' }, { status: 404 });
}
