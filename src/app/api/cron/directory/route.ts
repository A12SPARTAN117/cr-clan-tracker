import { connection } from 'next/server';
import { getClan, getClanWarRankings, getLocations, getPolLeaderboard } from '@/lib/cr/api';
import { cronAuthorized } from '@/lib/cron-auth';
import { getDb } from '@/lib/db';
import { indexClanMembers, indexPlayers } from '@/lib/directory';

export const maxDuration = 300;

/** Countries per run. Called every 30 minutes, every country is refreshed every few hours. */
const SLICE = 25;

/**
 * Saves a slice of the Path of Legends leaderboards (global + each country, up to 1,000 players
 * each) into the player directory, for name search on hosts where memory doesn't persist
 * (serverless), plus the rosters of each location's top 5 war clans. Same auth as the snapshot job: `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  await connection();
  if (!cronAuthorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await getDb())) return Response.json({ error: 'DATABASE_URL is not set' }, { status: 503 });

  const locs = await getLocations();
  const all: (number | 'global')[] = ['global', ...(locs.ok ? locs.data.items.filter((l) => l.isCountry).map((l) => l.id) : [])];
  const slices = Math.ceil(all.length / SLICE);
  // Rotate by half-hour so consecutive runs take consecutive slices.
  const n = Math.floor(Date.now() / 1_800_000) % slices;
  const slice = all.slice(n * SLICE, n * SLICE + SLICE);

  let players = 0;
  for (const loc of slice) {
    const r = await getPolLeaderboard(loc, 1000);
    if (!r.ok) continue;
    await indexPlayers(r.data.items.map((p) => ({ tag: p.tag, name: p.name, clanTag: p.clan?.tag, clanName: p.clan?.name })));
    players += r.data.items.length;
  }
  // Rosters of each location's top war clans reach players who never rank in Path of Legends.
  let members = 0;
  for (const loc of slice) {
    const r = await getClanWarRankings(loc, 3);
    if (!r.ok) continue;
    for (const c of r.data.items) {
      const clan = await getClan(c.tag.replace('#', ''));
      if (!clan.ok) continue;
      await indexClanMembers(clan.data);
      members += clan.data.memberList.length;
    }
  }
  return Response.json({ slice: n + 1, of: slices, locations: slice.length, players, members });
}
