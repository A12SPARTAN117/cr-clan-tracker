import { search, type SearchScope } from '@/lib/search';
import { limitRequest } from '@/lib/ratelimit';

/** Typeahead for the search boxes: GET /api/search?q=…&scope=all|player|clan */
export async function GET(req: Request) {
  const limited = limitRequest(req, 'search');
  if (limited) return limited;
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').slice(0, 40);
  const s = u.searchParams.get('scope');
  const scope: SearchScope = s === 'player' || s === 'clan' ? s : 'all';
  const r = await search(q, scope, 6);
  // A minute of browser/CDN caching: retyping or backspacing reuses the answer.
  return Response.json(
    { ...r, clans: r.clans.slice(0, 6) },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300' } },
  );
}
