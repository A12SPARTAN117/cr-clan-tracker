import { search, type SearchScope } from '@/lib/search';

/** Typeahead for the search boxes: GET /api/search?q=…&scope=all|player|clan */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').slice(0, 40);
  const s = u.searchParams.get('scope');
  const scope: SearchScope = s === 'player' || s === 'clan' ? s : 'all';
  const r = await search(q, scope, 6);
  return Response.json({ ...r, clans: r.clans.slice(0, 6) }, { headers: { 'Cache-Control': 'no-store' } });
}
