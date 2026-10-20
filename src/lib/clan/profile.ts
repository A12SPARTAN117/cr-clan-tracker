import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { anyFailed, getClan, getCurrentRiverRace, getPlayer, getRiverRaceLog, tags } from '../cr/api';
import type { ApiRole, Clan } from '../cr/types';
import type { RosterEvent } from '../history';
import { parseApiDate } from '../format';
import { pool } from '../pool';
import { nextWarStart } from '../war';

export type ClanProfile = {
  generatedAt: string;
  tag: string;
  name: string;
  description: string;
  badgeId: number;
  type: Clan['type'];
  location: string | null;
  clanScore: number;
  clanWarTrophies: number;
  requiredTrophies: number;
  donationsPerWeek: number;
  members: { tag: string; name: string; role: ApiRole; trophies: number; expLevel: number; collectionLevel: number | null; donations: number; hours: number; clanRank: number }[];
  race: { label: string; training: boolean; warStarts: string; clans: { tag: string; name: string; badgeId: number; fame: number; us: boolean }[] } | null;
  past: { label: string; rank: number | null; fame: number; decksUsed: number; participants: number }[];
  history: { trackedSince: string; events: RosterEvent[] } | null;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();


async function build(tag: string): Promise<{ data: ClanProfile; failed: boolean } | null> {
  const [c, race, log] = await Promise.all([getClan(tag), getCurrentRiverRace(tag), getRiverRaceLog(tag, 10)]);
  if (!c.ok) return null;
  const clan = c.data;
  const ours = bare(clan.tag);
  const now = Date.now();
  let raceInfo: ClanProfile['race'] = null;
  if (race.ok) {
    const r = race.data;
    const idx = r.periodIndex % 7;
    const training = r.periodType === 'training';
    const label = training ? `Training day ${Math.min(3, idx + 1)} / 3` : `${r.periodType === 'colosseum' ? 'Colosseum' : 'War'} day ${Math.max(1, Math.min(4, idx - 2))} / 4`;
    raceInfo = {
      label,
      training,
      warStarts: nextWarStart(new Date(now)).toISOString(),
      clans: r.clans.map((x) => ({ tag: bare(x.tag), name: x.name, badgeId: x.badgeId, fame: x.fame, us: bare(x.tag) === ours })).sort((a, b) => b.fame - a.fame),
    };
  }
  const past = log.ok
    ? log.data.items.map((e) => {
        const st = e.standings.find((s) => bare(s.clan.tag) === ours);
        const parts = st?.clan.participants ?? [];
        return {
          label: `S${e.seasonId} · W${e.sectionIndex + 1}`,
          rank: st?.rank ?? null,
          fame: st?.clan.fame ?? 0,
          decksUsed: parts.reduce((a, p) => a + p.decksUsed, 0),
          participants: parts.filter((p) => p.decksUsed > 0).length,
        };
      })
    : [];
  const data: ClanProfile = {
    generatedAt: new Date(now).toISOString(),
    tag: ours,
    name: clan.name,
    description: clan.description,
    badgeId: clan.badgeId,
    type: clan.type,
    location: clan.location?.name ?? null,
    clanScore: clan.clanScore,
    clanWarTrophies: clan.clanWarTrophies,
    requiredTrophies: clan.requiredTrophies,
    donationsPerWeek: clan.donationsPerWeek,
    members: clan.memberList.map((m) => ({
      tag: bare(m.tag),
      name: m.name,
      role: m.role,
      trophies: m.trophies,
      // The roster has no collection level (and now reports expLevel 0); getMemberLevels fills
      // both in from each member's own profile, without holding up the page.
      expLevel: m.expLevel,
      collectionLevel: null,
      donations: m.donations,
      clanRank: m.clanRank,
      hours: Math.max(0, (now - (parseApiDate(m.lastSeen)?.getTime() ?? now)) / 3600_000),
    })),
    race: raceInfo,
    past,
    history: null,
  };
  return { data, failed: anyFailed([race, log]) };
}

export async function getClanProfile(tag: string): Promise<ClanProfile | null> {
  'use cache';
  cacheTag(tags.clan(tag));
  const b = await build(bare(tag));
  // A partial build (race, log or a profile failed) only lives as long as an error.
  if (b && !b.failed) cacheLife('cr');
  else cacheLife('crError');
  return b?.data ?? null;
}

/** Per member tag: king level and collection level, from each member's own (cached) profile. */
export type MemberLevels = Record<string, { exp: number; coll: number | null }>;

/**
 * Member levels for a clan: one profile call per member (about 50), so pages stream this in
 * after the roster instead of waiting for it. The same cached profiles back the dashboard and
 * player pages.
 */
export async function getMemberLevels(tag: string): Promise<MemberLevels> {
  'use cache';
  cacheTag(tags.clan(tag));
  const c = await getClan(bare(tag));
  if (!c.ok) {
    cacheLife('crError');
    return {};
  }
  const list = c.data.memberList;
  const profiles = await pool(list, 16, (m) => getPlayer(bare(m.tag)));
  if (anyFailed(profiles)) cacheLife('crError');
  else cacheLife('cr');
  return Object.fromEntries(
    list.map((m, i) => {
      const p = profiles[i]?.ok ? profiles[i].data : null;
      return [bare(m.tag), { exp: m.expLevel || (p?.expLevel ?? 0), coll: p?.collectionLevel ?? null }];
    }),
  );
}

/** The profile with member levels filled in (for pages that need them all at once, like Compare). */
export function withLevels(c: ClanProfile, levels: MemberLevels): ClanProfile {
  return { ...c, members: c.members.map((m) => ({ ...m, expLevel: levels[m.tag]?.exp || m.expLevel, collectionLevel: levels[m.tag]?.coll ?? m.collectionLevel })) };
}
