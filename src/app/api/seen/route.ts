import { after } from 'next/server';
import { recordBadgeArt } from '@/lib/badgeArt';
import { getBattleLog, getClan, getPlayer } from '@/lib/cr/api';
import { indexClanMembers, indexPlayers } from '@/lib/directory';
import { saveBattles } from '@/lib/history/battles';
import { trackClan, trackPlayer } from '@/lib/history/snapshot';
import { getPlayerProfile } from '@/lib/player/profile';
import { limitRequest } from '@/lib/ratelimit';
import { checkTag } from '@/lib/tags';
import { onceEvery, TRACK_MS, VIEW_WRITE_MS } from '@/lib/throttle';

/**
 * A player or clan page was opened (sent by components/SeenBeacon, once an hour per tag per
 * browser). Does what those pages did while rendering before they became cached and shared:
 * keeps the tag tracked so its history builds, and stores what was seen (games, name search,
 * badge art). Same gates as before: per player every 15 minutes, rosters and tracking hourly.
 * Reads go through the same cached API calls the page just made, so they rarely cost a call.
 */
export async function POST(req: Request) {
  const limited = limitRequest(req, 'route');
  if (limited) return limited;
  // Only this site's own pages report views.
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host) return new Response(null, { status: 403 });
  let body: { kind?: unknown; tag?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const c = typeof body.tag === 'string' ? checkTag(body.tag.slice(0, 20)) : null;
  if (!c || c.kind !== 'valid') return new Response(null, { status: 400 });
  const tag = c.tag;

  if (body.kind === 'player') {
    after(async () => {
      const r = await getPlayer(tag);
      if (!r.ok) return;
      // Opening a profile starts (or keeps up) its daily snapshots, so history builds from here on.
      await trackPlayer(r.data);
      if (!onceEvery(`seen:${tag}`, VIEW_WRITE_MS)) return;
      const [p, log] = await Promise.all([getPlayerProfile(tag), getBattleLog(tag)]);
      await indexPlayers([{ tag: r.data.tag, name: r.data.name, clanTag: r.data.clan?.tag, clanName: r.data.clan?.name, trophies: r.data.trophies }]);
      if (p) {
        // Everyone they played against goes into the name-search directory too.
        await indexPlayers(p.battles.flatMap((b) => (b.them.tag ? [{ tag: b.them.tag, name: b.them.name, clanName: b.them.clan }] : [])));
        // Each badge level's art, for the asset checklist (the API only shows the level they own).
        await recordBadgeArt(p.badges);
      }
      // Their 1v1 games are kept past the API's ~40, so head-to-head records keep growing.
      if (log.ok) await saveBattles(tag, log.data);
    });
  } else if (body.kind === 'clan' || body.kind === 'manage') {
    const manage = body.kind === 'manage';
    after(async () => {
      // Opening a dashboard starts (or refreshes) history tracking for the clan.
      if (manage) await trackClan(tag).catch((e) => console.error('[history] track failed:', e));
      if (!onceEvery(`index-clan:${tag}`, TRACK_MS)) return;
      const r = await getClan(tag);
      if (r.ok) await indexClanMembers(r.data);
    });
  } else return new Response(null, { status: 400 });
  return new Response(null, { status: 204 });
}
