import { cacheLife, cacheTag } from 'next/cache';
import { packCards, type Packed } from '@/lib/cardPack';
import { tags } from '@/lib/cr/api';
import { getPlayerProfile, type PlayerProfile } from '@/lib/player/profile';
import { limitRequest } from '@/lib/ratelimit';
import { checkTag } from '@/lib/tags';

/** The full profile, packed, cached per player like the page (a minute). */
async function fullProfile(tag: string): Promise<Packed<PlayerProfile> | null> {
  'use cache';
  cacheTag(tags.player(tag));
  const p = await getPlayerProfile(tag);
  if (p) cacheLife('crLive');
  else cacheLife('crError');
  return p ? packCards(p) : null;
}

/**
 * A player's full profile (battles with both decks, collection, badges, mastery, achievements),
 * for the profile page's tabs other than Overview: the page itself only carries what Overview
 * shows. The CDN keeps it for a minute, like the page.
 */
export async function GET(req: Request, ctx: RouteContext<'/api/player/[tag]'>) {
  const limited = limitRequest(req, 'summary');
  if (limited) return limited;
  const c = checkTag(decodeURIComponent((await ctx.params).tag).slice(0, 20));
  if (c.kind !== 'valid') return Response.json(null, { status: 400 });
  const p = await fullProfile(c.tag);
  if (!p) return Response.json(null, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  return Response.json(p, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=840' } });
}
