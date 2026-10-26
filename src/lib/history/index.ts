import 'server-only';
import { and, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { getDb, schema } from '../db';
import type { PlayerDay } from './playerDaily';

/**
 * Clan and player history built from our own snapshots (the official API is current-state
 * only). Every reader returns null when there is no database or the clan isn't tracked yet,
 * and pages fall back to their "Data since" / partial states.
 *
 * These reads are uncached themselves: callers either run them inside their own 'use cache'
 * (the player page) or at request time after connection().
 */

const { trackedClans, clanMembers, rosterEvents, memberDaily, warDays, trackedPlayers, playerDaily } = schema;

export type RosterEventKind = 'joined' | 'left' | 'kicked' | 'promoted' | 'demoted';

export type RosterEvent = {
  at: string; // ISO
  tag: string;
  name: string;
  kind: RosterEventKind;
  /** e.g. "to Elder" for promotions. */
  detail?: string;
};

export type ClanHistory = {
  /** When this clan was first snapshotted. */
  trackedSince: string;
  /** Member tag → when they joined (ISO). Only for members who joined after tracking began. */
  firstSeen: Record<string, string>;
  /** Members already in the clan at the first snapshot (join date unknown). */
  baseline: string[];
  /** Member tag → name, for everyone on the stored roster (to name leavers not yet snapshotted). */
  names?: Record<string, string>;
  rosterEvents: RosterEvent[];
  /** Race week (YYYY-MM-DD of its Thursday) → member tag → decks per war day (null = no snapshot). */
  dailyDecks: Record<string, Record<string, (number | null)[]>>;
  /** Member tag → trophies about a week ago (oldest snapshot in the last 7 days). */
  trophiesWeekAgo: Record<string, number>;
};

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export async function getClanHistory(tagRaw: string): Promise<ClanHistory | null> {
  const tag = bare(tagRaw);
  const db = await getDb();
  if (!db) return null;
  try {
    const [tracked] = await db.select().from(trackedClans).where(eq(trackedClans.tag, tag));
    if (!tracked) return null;
    const now = new Date();
    const weeksBack = isoDay(new Date(now.getTime() - 11 * 7 * 86400_000));
    const weekAgo = isoDay(new Date(now.getTime() - 7 * 86400_000));
    const [members, events, decks, daily] = await Promise.all([
      db.select().from(clanMembers).where(and(eq(clanMembers.clanTag, tag), isNull(clanMembers.leftAt))),
      db.select().from(rosterEvents).where(eq(rosterEvents.clanTag, tag)).orderBy(desc(rosterEvents.at)).limit(300),
      db.select().from(warDays).where(and(eq(warDays.clanTag, tag), gte(warDays.week, weeksBack))),
      db.select().from(memberDaily).where(and(eq(memberDaily.clanTag, tag), gte(memberDaily.day, weekAgo))).orderBy(memberDaily.day),
    ]);

    const firstSeen: Record<string, string> = {};
    const baseline: string[] = [];
    const names: Record<string, string> = {};
    for (const m of members) {
      names[m.playerTag] = m.name;
      if (m.baseline) baseline.push(m.playerTag);
      else firstSeen[m.playerTag] = m.firstSeenAt.toISOString();
    }

    const dailyDecks: ClanHistory['dailyDecks'] = {};
    for (const r of decks) {
      const wk = (dailyDecks[r.week] ??= {});
      const row = (wk[r.playerTag] ??= [null, null, null, null]);
      row[r.day - 1] = r.decks;
    }

    const trophiesWeekAgo: Record<string, number> = {};
    for (const r of daily) if (!(r.playerTag in trophiesWeekAgo)) trophiesWeekAgo[r.playerTag] = r.trophies;

    return {
      trackedSince: tracked.trackedSince.toISOString(),
      firstSeen,
      baseline,
      names,
      rosterEvents: events.map((e) => ({ at: e.at.toISOString(), tag: e.playerTag, name: e.name, kind: e.kind as RosterEventKind, detail: e.detail ?? undefined })),
      dailyDecks,
      trophiesWeekAgo,
    };
  } catch (e) {
    console.error('[history] clan read failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

export type PlayerHistory = {
  /** When this player's own daily snapshots began (first profile view); null if only clan snapshots. */
  trackedSince: string | null;
  /** Clans this player has been seen in, newest stint first. */
  clans: { clanTag: string; clanName: string; role: string; from: string; to: string | null; baseline: boolean }[];
  /** Daily trophies from tracked-clan and tracked-player snapshots, oldest first. */
  trophies: { day: string; trophies: number }[];
  /** Per-day war decks, newest week first. */
  war: { week: string; days: (number | null)[] }[];
  /** The player's own daily profile snapshots, oldest first. */
  days: PlayerDay[];
};

/** How far back a player's daily history is read: every chart and goal fits in it, and the read stays bounded. */
const PLAYER_HISTORY_DAYS = 180;

export async function getPlayerHistory(tagRaw: string): Promise<PlayerHistory | null> {
  const tag = bare(tagRaw);
  const db = await getDb();
  if (!db) return null;
  const from = new Date(Date.now() - PLAYER_HISTORY_DAYS * 86_400_000).toISOString().slice(0, 10);
  try {
    const [stints, [tracked]] = await Promise.all([
      db.select().from(clanMembers).where(eq(clanMembers.playerTag, tag)).orderBy(desc(clanMembers.firstSeenAt)),
      db.select({ since: trackedPlayers.trackedSince }).from(trackedPlayers).where(eq(trackedPlayers.tag, tag)),
    ]);
    if (!stints.length && !tracked) return null;
    const clanTags = [...new Set(stints.map((s) => s.clanTag))];
    const [clans, trophies, war, days] = await Promise.all([
      clanTags.length ? db.select({ tag: trackedClans.tag, name: trackedClans.name }).from(trackedClans).where(inArray(trackedClans.tag, clanTags)) : [],
      db
        .select({ day: memberDaily.day, trophies: memberDaily.trophies })
        .from(memberDaily)
        .where(and(eq(memberDaily.playerTag, tag), gte(memberDaily.day, from)))
        .orderBy(memberDaily.day),
      db
        .select()
        .from(warDays)
        .where(and(eq(warDays.playerTag, tag), gte(warDays.week, from), lte(warDays.day, 4)))
        .orderBy(desc(warDays.week)),
      tracked ? db.select().from(playerDaily).where(and(eq(playerDaily.playerTag, tag), gte(playerDaily.day, from))).orderBy(playerDaily.day) : [],
    ]);
    const names = new Map(clans.map((c) => [c.tag, c.name]));
    // Clan and player snapshots can both hold the same day; keep the highest.
    const byDay = new Map<string, number>();
    for (const t of [...trophies, ...days]) byDay.set(t.day, Math.max(byDay.get(t.day) ?? 0, t.trophies));
    const weeks = new Map<string, (number | null)[]>();
    for (const w of war) {
      const row = weeks.get(w.week) ?? [null, null, null, null];
      row[w.day - 1] = w.decks;
      weeks.set(w.week, row);
    }
    return {
      trackedSince: tracked?.since.toISOString() ?? null,
      clans: stints.map((s) => ({
        clanTag: s.clanTag,
        clanName: names.get(s.clanTag) ?? s.clanTag,
        role: s.role,
        from: s.firstSeenAt.toISOString(),
        to: s.leftAt?.toISOString() ?? null,
        baseline: !!s.baseline,
      })),
      trophies: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, t]) => ({ day, trophies: t })),
      war: [...weeks.entries()].map(([week, days]) => ({ week, days })),
      days,
    };
  } catch (e) {
    console.error('[history] player read failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
