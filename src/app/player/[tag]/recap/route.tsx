import { connection, type NextRequest } from 'next/server';
import { getPlayer } from '@/lib/cr/api';
import { getPlayerHistory } from '@/lib/history';
import { getPlayerProfile } from '@/lib/player/profile';
import { playerRecap, seasonOf } from '@/lib/recap/player';
import { playerRecapImage } from '@/lib/recap/render';
import { recapError, recapPng } from '@/lib/recap/route';
import { checkTag } from '@/lib/tags';

/** The player's season recap as a shareable PNG. */
export async function GET(req: NextRequest, ctx: RouteContext<'/player/[tag]/recap'>) {
  await connection();
  const c = checkTag(decodeURIComponent((await ctx.params).tag));
  if (c.kind !== 'valid') return recapError(404, 'Not a player tag');
  const [raw, p, h] = await Promise.all([getPlayer(c.tag), getPlayerProfile(c.tag), getPlayerHistory(c.tag)]);
  if (!raw.ok) return recapError(raw.status === 404 ? 404 : 502, raw.status === 404 ? 'Player not found' : 'The Clash Royale API is not answering');
  if (!p) return recapError(502, 'The Clash Royale API is not answering');
  return recapPng(() => playerRecapImage(playerRecap(p, h, seasonOf(raw.data.progress)), req.nextUrl.host), `recap-${p.tag}.png`, 'player');
}
