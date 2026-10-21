import { playerCollection } from '@/lib/player/collection';
import { limitRequest } from '@/lib/ratelimit';
import { checkTag } from '@/lib/tags';

/** Cached like the player data behind it, so reopening the deck builder doesn't refetch. */
const CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

export async function GET(req: Request, ctx: RouteContext<'/api/collection/[tag]'>) {
  const limited = limitRequest(req, 'summary');
  if (limited) return limited;
  const c = checkTag((await ctx.params).tag);
  if (c.kind !== 'valid') return Response.json({ error: 'invalid tag' }, { status: 400 });
  const r = await playerCollection(c.tag);
  if (r.ok) return Response.json(r.data, { headers: { 'Cache-Control': CACHE } });
  if (r.status === 404) return Response.json({ error: 'not found' }, { status: 404 });
  return Response.json({ error: 'unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
}
