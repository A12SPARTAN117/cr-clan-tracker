import type { Clan, RiverRaceLogEntry } from '../cr/types';
import type { ClanHistory } from '../history';

/**
 * A clan's recap over the river races in the API's race log (up to 10), plus roster moves from
 * our own snapshots. Pure, so tests can feed it API shapes.
 */

export type ClanRecap = {
  tag: string;
  name: string;
  badgeId: number;
  warTrophies: number;
  members: number;
  /** Newest first. */
  races: { label: string; rank: number | null; fame: number; trophyChange: number | null }[];
  totalFame: number;
  wins: number;
  /** Current members by fame over the logged races (the War chart's "Fame · last 10 races"). */
  performers: { name: string; fame: number; decks: number; races: number }[];
  /** This week's donations (the API resets them every Monday). */
  donations: { name: string; donations: number } | null;
  /** From our snapshots; null when the clan isn't tracked. */
  roster: { since: string; joined: number; left: number; complete: boolean } | null;
  generatedAt: string;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

/** Roster events window: the race log covers about 10 weeks. */
const WINDOW_DAYS = 70;
/** getClanHistory reads at most this many roster events. */
const EVENT_CAP = 300;

export function clanRecap(clan: Clan, log: RiverRaceLogEntry[], h: ClanHistory | null, now: Date): ClanRecap {
  const ours = bare(clan.tag);
  const standings = log.map((e) => ({ e, st: e.standings.find((s) => bare(s.clan.tag) === ours) }));
  const races = standings.map(({ e, st }) => ({ label: `S${e.seasonId} · W${e.sectionIndex + 1}`, rank: st?.rank ?? null, fame: st?.clan.fame ?? 0, trophyChange: st?.trophyChange ?? null }));

  const current = new Map(clan.memberList.map((m) => [bare(m.tag), m.name]));
  const tally = new Map<string, { name: string; fame: number; decks: number; races: number }>();
  for (const { st } of standings) {
    for (const p of st?.clan.participants ?? []) {
      const t = bare(p.tag);
      const name = current.get(t);
      if (!name) continue;
      const x = tally.get(t) ?? { name, fame: 0, decks: 0, races: 0 };
      x.fame += p.fame;
      x.decks += p.decksUsed;
      x.races++;
      tally.set(t, x);
    }
  }
  const performers = [...tally.values()]
    .filter((x) => x.fame > 0)
    .sort((a, b) => b.fame - a.fame || a.name.localeCompare(b.name))
    .slice(0, 5);

  const top = [...clan.memberList].sort((a, b) => b.donations - a.donations)[0];

  let roster: ClanRecap['roster'] = null;
  if (h) {
    const tracked = new Date(h.trackedSince).getTime();
    const since = Math.max(tracked, now.getTime() - WINDOW_DAYS * 86400_000);
    const inWindow = h.rosterEvents.filter((ev) => new Date(ev.at).getTime() >= since);
    const oldest = h.rosterEvents.at(-1);
    // A full read whose oldest event is still inside the window may have cut some off.
    const complete = h.rosterEvents.length < EVENT_CAP || (!!oldest && new Date(oldest.at).getTime() < since);
    roster = {
      since: new Date(since).toISOString(),
      joined: inWindow.filter((ev) => ev.kind === 'joined').length,
      left: inWindow.filter((ev) => ev.kind === 'left' || ev.kind === 'kicked').length,
      complete,
    };
  }

  return {
    tag: ours,
    name: clan.name,
    badgeId: clan.badgeId,
    warTrophies: clan.clanWarTrophies,
    members: clan.members,
    races,
    totalFame: races.reduce((a, r) => a + r.fame, 0),
    wins: races.filter((r) => r.rank === 1).length,
    performers,
    donations: top && top.donations > 0 ? { name: top.name, donations: top.donations } : null,
    roster,
    generatedAt: now.toISOString(),
  };
}
