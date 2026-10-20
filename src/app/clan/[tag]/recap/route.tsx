import { connection, type NextRequest } from 'next/server';
import { getClan, getRiverRaceLog } from '@/lib/cr/api';
import { getClanHistory } from '@/lib/history';
import { clanRecap } from '@/lib/recap/clan';
import { clanRecapImage } from '@/lib/recap/render';
import { recapError, recapPng } from '@/lib/recap/route';
import { checkTag } from '@/lib/tags';

/** The clan's recap over its last river races as a shareable PNG. */
export async function GET(req: NextRequest, ctx: RouteContext<'/clan/[tag]/recap'>) {
  await connection();
  const c = checkTag(decodeURIComponent((await ctx.params).tag));
  if (c.kind !== 'valid') return recapError(404, 'Not a clan tag');
  const [clan, log, h] = await Promise.all([getClan(c.tag), getRiverRaceLog(c.tag, 10), getClanHistory(c.tag)]);
  if (!clan.ok) return recapError(clan.status === 404 ? 404 : 502, clan.status === 404 ? 'Clan not found' : 'The Clash Royale API is not answering');
  // Without the race log every war number would read as zero, so no image beats a wrong one.
  if (!log.ok) return recapError(502, 'The river race log did not load');
  return recapPng(() => clanRecapImage(clanRecap(clan.data, log.data.items, h, new Date()), req.nextUrl.host), `recap-${c.tag}.png`, 'clan');
}
