import { eventRows, EVENT_NOTE } from '@/app/leaderboards/rows';
import { liveEventBoards } from '@/lib/events';
import { limitRequest } from '@/lib/ratelimit';

/**
 * One live event leaderboard's top 100, for the Leaderboards page's event tab (only the board
 * picked is loaded). Read from what the cron job stored, so the CDN keeps it for 10 minutes.
 */
export async function GET(req: Request, ctx: RouteContext<'/api/events/[id]'>) {
  const limited = limitRequest(req, 'summary');
  if (limited) return limited;
  const id = Number((await ctx.params).id);
  const board = (await liveEventBoards()).find((b) => b.id === id);
  if (!board) return Response.json({ error: 'not a live event board' }, { status: 404, headers: { 'Cache-Control': 'public, max-age=60' } });
  return Response.json(
    { ok: board.data.ok, note: EVENT_NOTE, rows: board.data.ok ? eventRows(board.data.data.items) : [] },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600' } },
  );
}
