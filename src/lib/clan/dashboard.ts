import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getBattleLog, getClan, getCurrentRiverRace, getPlayer, getRiverRaceLog, tags } from '../cr/api';
import type { ApiRole, Battle, Clan, CurrentRiverRace, RiverRaceLogEntry } from '../cr/types';
import { getClanHistory, type RosterEvent } from '../history';
import { parseApiDate } from '../format';
import { warDay } from '../war';
import { factorScores, type FactorScores, type ScoreInputs } from './score';

/** A war-day cell: decks used, null = not in clan, 'pending' = day not played yet, 'untracked' = no per-day snapshot. */
export type DayCell = number | null | 'pending' | 'untracked';

export type WeekHistory = { key: string; label: string; decks: number; fame: number; days: DayCell[] | null } | null;

export type Friendly = { tag: string; name: string; w: number; l: number };

export type DashMember = {
  tag: string;
  name: string;
  role: ApiRole;
  clanRank: number;
  rankMove: number;
  trophies: number;
  league: number | null;
  rating: number | null;
  lastSeen: string;
  hours: number;
  donations: number;
  received: number;
  fame: number;
  decks: number;
  decksToday: number;
  days: DayCell[];
  warWin: number | null;
  warGames: number;
  fWin: number | null;
  fGames: number;
  friendlies: Friendly[];
  tenureDays: number;
  /** 'exact' from our snapshots, 'atLeast' when inferred from the race log. */
  tenureKnown: 'exact' | 'atLeast';
  joined: string | null;
  isNew: boolean;
  hist: WeekHistory[];
  participation: number | null;
  inputs: ScoreInputs;
  factors: FactorScores;
};

export type RaceClanRow = { tag: string; name: string; badgeId: number; fame: number; decksToday: number; us: boolean };

export type PastRace = {
  key: string;
  label: string;
  created: string | null;
  rank: number | null;
  fame: number;
  trophyChange: number | null;
  members: { tag: string; name: string; decks: number; fame: number }[];
};

export type FormerMember = { tag: string; name: string; lastRace: string; decks: number; fame: number };

export type Dashboard = {
  generatedAt: string;
  clan: {
    tag: string;
    name: string;
    badgeId: number;
    type: Clan['type'];
    description: string;
    location: string | null;
    requiredTrophies: number;
    clanScore: number;
    clanWarTrophies: number;
    donationsPerWeek: number;
    members: number;
  };
  war: {
    kind: 'war' | 'training' | 'colosseum';
    day: number;
    label: string;
    nextReset: string;
    decksToday: number;
    decksWeek: number;
    clans: RaceClanRow[];
    raceLabel: string;
  } | null;
  past: PastRace[];
  former: FormerMember[];
  members: DashMember[];
  history: { trackedSince: string; events: RosterEvent[] } | null;
  /** Battle logs only hold ~30 battles; how many members' logs could be read. */
  logsRead: number;
};

const WAR_TYPES = new Set(['riverRacePvP', 'riverRaceDuel', 'riverRaceDuelColosseum']);

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();
const raceKey = (e: RiverRaceLogEntry) => `${e.seasonId}:${e.sectionIndex}`;
const raceLabel = (e: RiverRaceLogEntry) => `S${e.seasonId} · W${e.sectionIndex + 1}`;

function battleStats(log: Battle[] | null, selfTag: string) {
  let warW = 0;
  let warG = 0;
  let fW = 0;
  let fG = 0;
  const fr = new Map<string, Friendly>();
  for (const b of log ?? []) {
    const me = b.team.find((t) => bare(t.tag) === selfTag) ?? b.team[0];
    const opp = b.opponent[0];
    if (!me || !opp) continue;
    const won = me.crowns > opp.crowns;
    if (WAR_TYPES.has(b.type)) {
      warG++;
      if (won) warW++;
    } else if (b.type === 'clanMate') {
      fG++;
      if (won) fW++;
      const k = bare(opp.tag);
      const f = fr.get(k) ?? { tag: k, name: opp.name, w: 0, l: 0 };
      if (won) f.w++;
      else f.l++;
      fr.set(k, f);
    }
  }
  return {
    warWin: warG ? Math.round((warW / warG) * 100) : null,
    warGames: warG,
    fWin: fG ? Math.round((fW / fG) * 100) : null,
    fGames: fG,
    friendlies: [...fr.values()].sort((a, b) => b.w + b.l - (a.w + a.l)),
  };
}

function raceInfo(race: CurrentRiverRace | null, ourTag: string, now: Date) {
  const cal = warDay(now);
  if (!race) return null;
  const idx = race.periodIndex % 7;
  const kind: 'war' | 'training' | 'colosseum' = race.periodType === 'training' ? 'training' : race.periodType === 'colosseum' ? 'colosseum' : 'war';
  const day = kind === 'training' ? Math.min(3, idx + 1) : Math.max(1, Math.min(4, idx - 2));
  const clans: RaceClanRow[] = race.clans
    .map((c) => ({
      tag: bare(c.tag),
      name: c.name,
      badgeId: c.badgeId,
      fame: c.fame,
      decksToday: c.participants.reduce((a, p) => a + p.decksUsedToday, 0),
      us: bare(c.tag) === ourTag,
    }))
    .sort((a, b) => b.fame - a.fame);
  const ours = race.clans.find((c) => bare(c.tag) === ourTag) ?? race.clan;
  return {
    kind,
    day,
    label: kind === 'training' ? `Training day ${day}` : `${kind === 'colosseum' ? 'Colosseum' : 'War'} day ${day}`,
    nextReset: cal.nextReset.toISOString(),
    decksToday: ours.participants.reduce((a, p) => a + p.decksUsedToday, 0),
    decksWeek: ours.participants.reduce((a, p) => a + p.decksUsed, 0),
    clans,
    raceLabel: `Week ${race.sectionIndex + 1}`,
  };
}

async function build(tag: string): Promise<Dashboard | null> {
  const [clanR, raceR, logR, history] = await Promise.all([getClan(tag), getCurrentRiverRace(tag), getRiverRaceLog(tag, 10), getClanHistory(tag)]);
  if (!clanR.ok) return null;
  const clan = clanR.data;
  const ourTag = bare(clan.tag);
  const now = new Date();
  const race = raceR.ok ? raceR.data : null;
  const log = logR.ok ? logR.data.items : [];
  const war = raceInfo(race, ourTag, now);

  const memberTags = clan.memberList.map((m) => bare(m.tag));
  const [players, logs] = await Promise.all([pool(memberTags, 8, (t) => getPlayer(t)), pool(memberTags, 8, (t) => getBattleLog(t))]);

  const ourRaceClan = race ? (race.clans.find((c) => bare(c.tag) === ourTag) ?? race.clan) : null;
  const curParts = new Map((ourRaceClan?.participants ?? []).map((p) => [bare(p.tag), p]));
  const logParts = log.map((e) => {
    const st = e.standings.find((s) => bare(s.clan.tag) === ourTag);
    return { entry: e, standing: st, parts: new Map((st?.clan.participants ?? []).map((p) => [bare(p.tag), p])) };
  });

  const warDayNum = war?.kind === 'training' ? 0 : (war?.day ?? 0);
  const decksPossible = warDayNum * 4;

  const members: DashMember[] = clan.memberList.map((m, i) => {
    const t = bare(m.tag);
    const seen = parseApiDate(m.lastSeen);
    const hours = seen ? Math.max(0, (now.getTime() - seen.getTime()) / 3600_000) : 999;
    const cp = curParts.get(t);
    const decks = cp?.decksUsed ?? 0;
    const decksToday = cp?.decksUsedToday ?? 0;

    // Per-day cells for this week: today is exact; earlier days need snapshots.
    const snapDays = history?.dailyDecks.current?.[t];
    const days: DayCell[] = [0, 1, 2, 3].map((d) => {
      if (war?.kind === 'training' || d + 1 > warDayNum) return 'pending';
      if (d + 1 === warDayNum) return decksToday;
      return snapDays?.[d] ?? 'untracked';
    });

    const hist: WeekHistory[] = logParts.map(({ entry, parts }) => {
      const p = parts.get(t);
      if (!p) return null;
      const snap = history?.dailyDecks[raceKey(entry)]?.[t] ?? null;
      return { key: raceKey(entry), label: raceLabel(entry), decks: p.decksUsed, fame: p.fame, days: snap };
    });
    const present = hist.filter((h): h is NonNullable<WeekHistory> => !!h);
    const participation = present.length ? present.reduce((a, h) => a + h.decks, 0) / (present.length * 16) : null;

    // Tenure: exact from snapshots, otherwise consecutive tracked races (a lower bound).
    let streak = 0;
    while (streak < hist.length && hist[streak]) streak++;
    const first = history?.firstSeen[t];
    const isNewByLog = log.length > 0 && !hist[0];
    const tenureDays = first ? (now.getTime() - new Date(first).getTime()) / 86400_000 : streak * 7;
    const tenureKnown: 'exact' | 'atLeast' = first ? 'exact' : 'atLeast';

    const pl = players[i];
    const pol = pl.ok ? pl.data.currentPathOfLegendSeasonResult : undefined;
    const bs = battleStats(logs[i].ok ? logs[i].data : null, t);
    const last = logParts[0]?.parts.get(t);
    const inputs: ScoreInputs = {
      decks,
      decksPossible,
      lastRaceRatio: last ? last.decksUsed / 16 : null,
      participation,
      donations: m.donations,
      hoursSinceSeen: hours,
      warWin: bs.warWin,
      tenureDays,
    };
    return {
      tag: t,
      name: m.name,
      role: m.role,
      clanRank: m.clanRank,
      rankMove: m.previousClanRank > 0 ? m.previousClanRank - m.clanRank : 0,
      trophies: m.trophies,
      league: pol?.leagueNumber ?? null,
      rating: pol && pol.leagueNumber >= 7 ? pol.trophies : null,
      lastSeen: seen?.toISOString() ?? '',
      hours,
      donations: m.donations,
      received: m.donationsReceived,
      fame: cp?.fame ?? 0,
      decks,
      decksToday,
      days,
      ...bs,
      tenureDays,
      tenureKnown,
      joined: first ?? null,
      isNew: first ? tenureDays < 7 : isNewByLog,
      hist,
      participation,
      inputs,
      factors: factorScores(inputs),
    };
  });

  // Former members: played in a tracked race but are no longer on the roster. Race
  // participant lists also carry everyone who was ever in the clan that season with 0 decks,
  // so only count people who actually played.
  const current = new Set(memberTags);
  const former = new Map<string, FormerMember>();
  const consider = (tagRaw: string, name: string, label: string, decks: number, fame: number) => {
    const t = bare(tagRaw);
    if (current.has(t) || former.has(t) || (decks === 0 && fame === 0)) return;
    former.set(t, { tag: t, name, lastRace: label, decks, fame });
  };
  for (const p of ourRaceClan?.participants ?? []) consider(p.tag, p.name, 'This week', p.decksUsed, p.fame);
  for (const { entry, parts } of logParts) for (const p of parts.values()) consider(p.tag, p.name, raceLabel(entry), p.decksUsed, p.fame);

  const past: PastRace[] = logParts.map(({ entry, standing }) => ({
    key: raceKey(entry),
    label: raceLabel(entry),
    created: parseApiDate(entry.createdDate)?.toISOString() ?? null,
    rank: standing?.rank ?? null,
    fame: standing?.clan.fame ?? 0,
    trophyChange: standing?.trophyChange ?? null,
    members: (standing?.clan.participants ?? [])
      .map((p) => ({ tag: bare(p.tag), name: p.name, decks: p.decksUsed, fame: p.fame }))
      .sort((a, b) => b.decks - a.decks || b.fame - a.fame),
  }));

  return {
    generatedAt: now.toISOString(),
    clan: {
      tag: ourTag,
      name: clan.name,
      badgeId: clan.badgeId,
      type: clan.type,
      description: clan.description,
      location: clan.location?.name ?? null,
      requiredTrophies: clan.requiredTrophies,
      clanScore: clan.clanScore,
      clanWarTrophies: clan.clanWarTrophies,
      donationsPerWeek: clan.donationsPerWeek,
      members: clan.members,
    },
    war,
    past,
    former: [...former.values()],
    members,
    history: history ? { trackedSince: history.trackedSince, events: history.rosterEvents } : null,
    logsRead: logs.filter((l) => l.ok).length,
  };
}

/** Everything the clan dashboard shows, cached per clan (Refresh revalidates the clan tag). */
export async function getDashboard(tag: string): Promise<Dashboard | null> {
  'use cache';
  cacheTag(tags.clan(tag));
  const d = await build(bare(tag));
  if (d) cacheLife('cr');
  else cacheLife('crError');
  return d;
}


