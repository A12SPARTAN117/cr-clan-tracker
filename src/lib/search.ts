import 'server-only';
import { after, connection } from 'next/server';
import { getClan, getClanRankings, getClanWarRankings, getLocations, getPlayer, getPolLeaderboard, searchClans } from './cr/api';
import { findPlayersByName, indexClanMembers, indexPlayers, rankByName, seedDirectory, type DirPlayer } from './directory';
import { checkTag } from './tags';

/**
 * One search box for everything: player names, player tags, clan names and clan tags.
 * Tags are looked up directly (they can belong to a player, a clan or both); names search
 * the clan API and our player directory (plus the global Path of Legends top 1000).
 */

export type SearchScope = 'all' | 'player' | 'clan';

export type SearchClan = { tag: string; name: string; badgeId: number; members: number; location: string | null; clanWarTrophies: number | null; clanScore: number | null; type: string | null };

export type SearchResults = {
  q: string;
  /** Exact tag hits. */
  tagPlayer: (DirPlayer & { expLevel: number | null }) | null;
  tagClan: SearchClan | null;
  players: DirPlayer[];
  clans: SearchClan[];
  /** The clan API failed (rate limit / outage), so clan results may be missing. */
  clanError: boolean;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

export async function search(raw: string, scope: SearchScope = 'all', limit = 100): Promise<SearchResults> {
  await connection(); // per-request: results depend on the live directory
  // Seed this server's directory (Path of Legends boards, then top clans' rosters) once a day in
  // the background. With a database the rosters are saved too, and the cron job
  // (/api/cron/directory) keeps it fresh on hosts where memory doesn't last.
  // It starts after the response is sent: started during the render, its thousand-odd API calls
  // belonged to this request, and Next.js held the first search open until all of them finished
  // (about three minutes).
  after(() =>
    seedDirectory({
      locations: async () => {
        const r = await getLocations();
        return r.ok ? r.data.items : [];
      },
      board: async (loc) => {
        const r = await getPolLeaderboard(loc, 1000);
        return r.ok ? r.data.items : [];
      },
      clans: async (loc, limit) => {
        const [war, trophy] = await Promise.all([getClanWarRankings(loc, limit), loc === 'global' ? getClanRankings(loc, limit) : null]);
        return [...(war.ok ? war.data.items : []), ...(trophy?.ok ? trophy.data.items : [])].map((c) => bare(c.tag));
      },
      roster: async (tag) => {
        const r = await getClan(tag);
        return r.ok ? r.data : null;
      },
    }),
  );
  const q = raw.trim();
  const out: SearchResults = { q, tagPlayer: null, tagClan: null, players: [], clans: [], clanError: false };
  if (!q) return out;
  const tag = checkTag(q);
  const name = q.replace(/^#/, '');
  const wantP = scope !== 'clan';
  const wantC = scope !== 'player';

  const [player, clan, clans, dir, top] = await Promise.all([
    tag.kind === 'valid' && wantP ? getPlayer(tag.tag) : null,
    tag.kind === 'valid' && wantC ? getClan(tag.tag) : null,
    wantC && name.length >= 3 ? searchClans({ name, limit: Math.min(100, limit) }) : null,
    wantP ? findPlayersByName(name, limit) : [],
    wantP && name.length >= 2 ? getPolLeaderboard('global', 1000) : null,
  ]);

  if (player?.ok) {
    const p = player.data;
    out.tagPlayer = { tag: bare(p.tag), name: p.name, clanTag: p.clan ? bare(p.clan.tag) : null, clanName: p.clan?.name ?? null, trophies: p.trophies, expLevel: p.expLevel };
  }
  if (clan?.ok) {
    const c = clan.data;
    out.tagClan = { tag: bare(c.tag), name: c.name, badgeId: c.badgeId, members: c.members, location: c.location?.name ?? null, clanWarTrophies: c.clanWarTrophies, clanScore: c.clanScore, type: c.type };
  }
  if (clans) {
    out.clanError = !clans.ok;
    if (clans.ok)
      out.clans = clans.data.items.map((c) => ({
        tag: bare(c.tag),
        name: c.name,
        badgeId: c.badgeId,
        members: c.members,
        location: c.location?.name ?? null,
        clanWarTrophies: c.clanWarTrophies ?? null,
        clanScore: c.clanScore ?? null,
        type: c.type ?? null,
      }))
        // Exact name first, then the bigger / stronger clans.
        .sort((a, b) => Number(b.name.toLowerCase() === name.toLowerCase()) - Number(a.name.toLowerCase() === name.toLowerCase()) || (b.clanScore ?? 0) - (a.clanScore ?? 0));
  }
  if (wantP) {
    const fromTop: DirPlayer[] = top?.ok
      ? top.data.items.map((p) => ({ tag: bare(p.tag), name: p.name, clanTag: p.clan ? bare(p.clan.tag) : null, clanName: p.clan?.name ?? null, trophies: null }))
      : [];
    const merged = new Map(dir.map((p) => [p.tag, p]));
    for (const p of rankByName(fromTop, name, limit)) if (!merged.has(p.tag)) merged.set(p.tag, p);
    out.players = rankByName([...merged.values()], name, limit);
  }
  if (out.tagPlayer) void indexPlayers([out.tagPlayer]);
  // A clan found by tag brings its whole roster into the directory.
  if (clan?.ok) void indexClanMembers(clan.data);
  return out;
}
