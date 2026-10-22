import { getModeList } from '@/lib/meta';
import { limitRequest } from '@/lib/ratelimit';

/**
 * One game mode's meta decks and card stats, for the Decks page's mode picker. The same for
 * everyone and rebuilt about hourly, so the CDN keeps it for 10 minutes.
 */
export async function GET(req: Request, ctx: RouteContext<'/api/meta/[mode]'>) {
  const limited = limitRequest(req, 'summary');
  if (limited) return limited;
  const { mode } = await ctx.params;
  const list = await getModeList(decodeURIComponent(mode));
  if (!list) return Response.json({ error: 'unknown mode' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  return Response.json(list, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600' } });
}
