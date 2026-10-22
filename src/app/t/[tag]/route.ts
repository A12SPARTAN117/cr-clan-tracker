import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { getClan, getPlayer } from '@/lib/cr/api';
import { limitRequest } from '@/lib/ratelimit';
import { indexClanMembers, indexPlayers } from '@/lib/directory';
import { checkTag } from '@/lib/tags';
import { onceEvery, TRACK_MS, VIEW_WRITE_MS } from '@/lib/throttle';

/**
 * Search routing: a tag could belong to a player or a clan, so ask the API about both
 * and send the visitor to whichever exists. Player and clan tags share one namespace, so a tag
 * can match both; then the visitor picks. Unknown tags land on the player-not-found state.
 */
export async function GET(req: Request, ctx: RouteContext<'/t/[tag]'>) {
  const limited = limitRequest(req, 'route');
  if (limited) return limited;
  const { tag: raw } = await ctx.params;
  const c = checkTag(decodeURIComponent(raw));
  if (c.kind !== 'valid') redirect(`/player/${encodeURIComponent(raw)}`);
  const [player, clan] = await Promise.all([getPlayer(c.tag), getClan(c.tag)]);
  // Everyone found by tag joins the name directory, so their name finds them next time (and a
  // clan brings its whole roster).
  after(async () => {
    if (player.ok && onceEvery(`seen:${c.tag}`, VIEW_WRITE_MS)) await indexPlayers([{ tag: player.data.tag, name: player.data.name, clanTag: player.data.clan?.tag, clanName: player.data.clan?.name, trophies: player.data.trophies }]);
    if (clan.ok && onceEvery(`index-clan:${c.tag}`, TRACK_MS)) await indexClanMembers(clan.data);
  });
  if (player.ok && clan.ok) redirect(`/t/${c.tag}/pick`);
  if (player.ok) redirect(`/player/${c.tag}`);
  if (clan.ok) redirect(`/clan/${c.tag}`);
  redirect(`/player/${c.tag}`);
}
