import 'server-only';
import { getClan, getPlayer, getPolLeaderboard, searchClans } from './cr/api';
import { findPlayersByName, indexPlayers, rankByName, type DirPlayer } from './directory';
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

export async function search(raw: string, scope: SearchScope = 'all', limit = 20): Promise<SearchResults> {
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
    wantC && name.length >= 3 ? searchClans({ name, limit: 30 }) : null,
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
    // Remember the leaderboard players (at most hourly) so later searches find them too.
    const g = globalThis as unknown as { __crTopIndexed?: number };
    if (top?.ok && Date.now() - (g.__crTopIndexed ?? 0) > 3600_000) {
      g.__crTopIndexed = Date.now();
      void indexPlayers(fromTop);
    }
  }
  if (out.tagPlayer) void indexPlayers([out.tagPlayer]);
  return out;
}
