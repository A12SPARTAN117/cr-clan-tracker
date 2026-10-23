import { connection } from 'next/server';
import { eventRanksOf } from '@/lib/events';
import { limitRequest } from '@/lib/ratelimit';
import { checkTag } from '@/lib/tags';

/**
 * A player's place on every live event leaderboard, for the profile's Badges tab (loaded when the
 * tab opens, so the cached profile page doesn't wait on it). Rankings move slowly, so the CDN
 * keeps an answer for 10 minutes.
 */
export async function GET(req: Request, ctx: RouteContext<'/api/ranks/[tag]'>) {
  await connection();
  const limited = limitRequest(req, 'summary');
  if (limited) return limited;
  const c = checkTag(decodeURIComponent((await ctx.params).tag).slice(0, 20));
  if (c.kind !== 'valid') return Response.json([], { status: 400 });
  const ranks = await eventRanksOf(c.tag).catch(() => []);
  return Response.json(ranks, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600' } });
}
