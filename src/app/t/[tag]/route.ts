import { redirect } from 'next/navigation';
import { getClan, getPlayer } from '@/lib/cr/api';
import { checkTag } from '@/lib/tags';

/**
 * Search routing: a tag could belong to a player or a clan, so ask the API about both
 * and send the visitor to whichever exists. Player and clan tags share one namespace, so a tag
 * can match both; then the visitor picks. Unknown tags land on the player-not-found state.
 */
export async function GET(_req: Request, ctx: RouteContext<'/t/[tag]'>) {
  const { tag: raw } = await ctx.params;
  const c = checkTag(decodeURIComponent(raw));
  if (c.kind !== 'valid') redirect(`/player/${encodeURIComponent(raw)}`);
  const [player, clan] = await Promise.all([getPlayer(c.tag), getClan(c.tag)]);
  if (player.ok && clan.ok) redirect(`/t/${c.tag}/pick`);
  if (player.ok) redirect(`/player/${c.tag}`);
  if (clan.ok) redirect(`/clan/${c.tag}`);
  redirect(`/player/${c.tag}`);
}
