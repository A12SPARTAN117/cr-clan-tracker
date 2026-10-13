import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getClan, getCurrentRiverRace, getRiverRaceLog, tags } from '../cr/api';
import type { ApiRole, Clan } from '../cr/types';
import { getClanHistory, type RosterEvent } from '../history';
import { parseApiDate } from '../format';

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
  members: { tag: string; name: string; role: ApiRole; trophies: number; expLevel: number; donations: number; hours: number; clanRank: number }[];
  race: { label: string; clans: { tag: string; name: string; badgeId: number; fame: number; us: boolean }[] } | null;
  past: { label: string; rank: number | null; fame: number; decksUsed: number; participants: number }[];
  history: { trackedSince: string; events: RosterEvent[] } | null;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

async function build(tag: string): Promise<ClanProfile | null> {
  const [c, race, log, history] = await Promise.all([getClan(tag), getCurrentRiverRace(tag), getRiverRaceLog(tag, 10), getClanHistory(tag)]);
  if (!c.ok) return null;
  const clan = c.data;
  const ours = bare(clan.tag);
  const now = Date.now();
  let raceInfo: ClanProfile['race'] = null;
  if (race.ok) {
    const r = race.data;
    const idx = r.periodIndex % 7;
    const label = r.periodType === 'training' ? `Training day ${Math.min(3, idx + 1)}` : `War day ${Math.max(1, Math.min(4, idx - 2))} / 4`;
    raceInfo = {
      label,
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
  return {
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
      expLevel: m.expLevel,
      donations: m.donations,
      clanRank: m.clanRank,
      hours: Math.max(0, (now - (parseApiDate(m.lastSeen)?.getTime() ?? now)) / 3600_000),
    })),
    race: raceInfo,
    past,
    history: history ? { trackedSince: history.trackedSince, events: history.rosterEvents } : null,
  };
}

export async function getClanProfile(tag: string): Promise<ClanProfile | null> {
  'use cache';
  cacheTag(tags.clan(tag));
  const d = await build(bare(tag));
  if (d) cacheLife('cr');
  else cacheLife('crError');
  return d;
}
