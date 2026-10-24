import 'server-only';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { getBattleLog, getClan, getCurrentRiverRace, getPlayer } from '../cr/api';
import type { ApiRole, Player } from '../cr/types';
import { enqueue, getDb, schema } from '../db';
import { finishDays, warWeekKey } from '../war';
import { indexClanMembers } from '../directory';
import { saveBattles } from './battles';
import { playerDayOf } from './playerDaily';
import { onceEvery, TRACK_MS } from '../throttle';

const { trackedClans, clanMembers, rosterEvents, memberDaily, warDays, trackedPlayers, playerDaily, playerIdentity } = schema;

const RANK: Record<ApiRole, number> = { member: 0, elder: 1, coLeader: 2, leader: 3 };
const LABEL: Record<ApiRole, string> = { member: 'Member', elder: 'Elder', coLeader: 'Co-Leader', leader: 'Leader' };
const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

export type SnapshotResult = { tag: string; ok: boolean; reason?: string; joined?: number; left?: number; roleChanges?: number; warRows?: number };

/**
 * Name and clan history: extends the player's latest stretch while name and clan stay the same,
 * and starts a new one when either changes. Best-effort; callers already run in the write queue.
 */
async function recordIdentities(people: { tag: string; name: string; clanTag: string | null; clanName: string | null }[], now = new Date()) {
  const db = await getDb();
  if (!db || !people.length) return;
  try {
    const tags = people.map((p) => bare(p.tag));
    const rows = await db.select().from(playerIdentity).where(inArray(playerIdentity.tag, tags)).orderBy(desc(playerIdentity.lastSeenAt));
    const latest = new Map<string, (typeof rows)[number]>();
    for (const r of rows) if (!latest.has(r.tag)) latest.set(r.tag, r);
    // Batched: unchanged stretches are extended with one update per clan name (a clan's snapshot
    // has one), new stretches go in one insert. It was a statement per member.
    const extend = new Map<string | null, number[]>();
    const start: (typeof playerIdentity.$inferInsert)[] = [];
    for (const p of people) {
      const tag = bare(p.tag);
      const clanTag = p.clanTag ? bare(p.clanTag) : null;
      const cur = latest.get(tag);
      if (cur && cur.name === p.name && cur.clanTag === clanTag) extend.set(p.clanName, [...(extend.get(p.clanName) ?? []), cur.id]);
      else start.push({ tag, name: p.name, clanTag, clanName: p.clanName, firstSeenAt: now, lastSeenAt: now });
    }
    for (const [clanName, ids] of extend) await db.update(playerIdentity).set({ lastSeenAt: now, clanName }).where(inArray(playerIdentity.id, ids));
    if (start.length) await db.insert(playerIdentity).values(start);
  } catch (e) {
    console.warn('[history] identity record failed (is migration 0008 applied?):', e instanceof Error ? e.message : e);
  }
}

/** A player's names and clans over time, newest first. */
export async function getIdentityHistory(tagRaw: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    return (await db.select().from(playerIdentity).where(eq(playerIdentity.tag, bare(tagRaw))).orderBy(desc(playerIdentity.lastSeenAt)).limit(200)).map((r) => ({
      name: r.name,
      clanTag: r.clanTag,
      clanName: r.clanName,
      from: r.firstSeenAt.toISOString(),
      to: r.lastSeenAt.toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * Records one snapshot of a clan: roster diff (joins, leaves, promotions, demotions),
 * each member's trophies/donations for today, and decks used on the current war day.
 * The first snapshot of a clan is a baseline: everyone present is recorded without events.
 */
export async function snapshotClan(tagRaw: string): Promise<SnapshotResult> {
  const tag = bare(tagRaw);
  const db = await getDb();
  if (!db) return { tag, ok: false, reason: 'no database' };
  const [clanR, raceR] = await Promise.all([getClan(tag), getCurrentRiverRace(tag)]);
  if (!clanR.ok) return { tag, ok: false, reason: `clan: ${clanR.status} ${clanR.reason}` };
  const clan = clanR.data;
  await indexClanMembers(clan);
  await recordIdentities(clan.memberList.map((m) => ({ tag: m.tag, name: m.name, clanTag: clan.tag, clanName: clan.name })));
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const known = await db.select().from(clanMembers).where(eq(clanMembers.clanTag, tag));
  const baseline = known.length === 0;
  const active = new Map(known.filter((m) => !m.leftAt).map((m) => [m.playerTag, m]));
  const former = new Map(known.filter((m) => m.leftAt).map((m) => [m.playerTag, m]));
  const roster = new Map(clan.memberList.map((m) => [bare(m.tag), m]));
  let joined = 0;
  let left = 0;
  let roleChanges = 0;

  const steady: (typeof clanMembers.$inferInsert)[] = [];
  const fresh: (typeof clanMembers.$inferInsert)[] = [];
  const events: (typeof rosterEvents.$inferInsert)[] = [];
  await db.transaction(async (tx) => {
    await tx
      .insert(trackedClans)
      .values({ tag, name: clan.name, lastSnapshotAt: now })
      .onConflictDoUpdate({ target: trackedClans.tag, set: { name: clan.name, lastSnapshotAt: now } });

    for (const [pt, m] of roster) {
      const cur = active.get(pt);
      if (!cur) {
        if (former.has(pt)) {
          // Rejoined: start a new stint.
          await tx
            .update(clanMembers)
            .set({ name: m.name, role: m.role, leftAt: null, firstSeenAt: now, lastSeenInClanAt: now, baseline: 0 })
            .where(and(eq(clanMembers.clanTag, tag), eq(clanMembers.playerTag, pt)));
        } else {
          fresh.push({ clanTag: tag, playerTag: pt, name: m.name, role: m.role, baseline: baseline ? 1 : 0, firstSeenAt: now, lastSeenInClanAt: now });
        }
        if (!baseline) {
          joined++;
          events.push({ clanTag: tag, playerTag: pt, name: m.name, kind: 'joined', at: now });
        }
        continue;
      }
      steady.push({ clanTag: tag, playerTag: pt, name: m.name, role: m.role, lastSeenInClanAt: now });
      const was = cur.role as ApiRole;
      if (was !== m.role && RANK[was] != null) {
        roleChanges++;
        events.push({ clanTag: tag, playerTag: pt, name: m.name, kind: RANK[m.role] > RANK[was] ? 'promoted' : 'demoted', detail: `to ${LABEL[m.role]}`, at: now });
      }
    }
    // New members (a whole roster on the first snapshot) in one insert.
    if (fresh.length) await tx.insert(clanMembers).values(fresh);
    // Everyone still in the clan, in one statement (was one per member).
    if (steady.length)
      await tx
        .insert(clanMembers)
        .values(steady)
        .onConflictDoUpdate({
          target: [clanMembers.clanTag, clanMembers.playerTag],
          set: { name: sql`excluded.name`, role: sql`excluded.role`, lastSeenInClanAt: sql`excluded.last_seen_in_clan_at` },
        });

    for (const [pt, m] of active) {
      if (roster.has(pt)) continue;
      left++;
      // The API cannot tell a kick from a leave, so every exit is recorded as "left".
      await tx
        .update(clanMembers)
        .set({ leftAt: now })
        .where(and(eq(clanMembers.clanTag, tag), eq(clanMembers.playerTag, pt), isNull(clanMembers.leftAt)));
      events.push({ clanTag: tag, playerTag: pt, name: m.name, kind: 'left', at: now });
    }
    if (events.length) await tx.insert(rosterEvents).values(events);

    // Today's trophies and donations for everyone, in one statement (was one per member).
    if (roster.size)
      await tx
        .insert(memberDaily)
        .values([...roster].map(([pt, m]) => ({ clanTag: tag, playerTag: pt, day: today, trophies: m.trophies, donations: m.donations })))
        .onConflictDoUpdate({
          target: [memberDaily.clanTag, memberDaily.playerTag, memberDaily.day],
          set: { trophies: sql`excluded.trophies`, donations: sql`excluded.donations` },
        });
  });

  // War day decks: keep the highest decksUsedToday seen for each member and day.
  let warRows = 0;
  if (raceR.ok && raceR.data.periodType !== 'training') {
    const race = raceR.data;
    const day = Math.max(1, Math.min(4, (race.periodIndex % 7) - 2));
    const week = warWeekKey(now);
    const ours = race.clans.find((c) => bare(c.tag) === tag) ?? race.clan;
    const playing = ours.participants.filter((p) => roster.has(bare(p.tag)));
    const rows = playing.map((p) => ({ clanTag: tag, playerTag: bare(p.tag), week, day, decks: p.decksUsedToday }));
    // Earlier days of this week, completed from each member's total before today (finishDays):
    // the last snapshot before a reset can be hours early, and it misses that day's last decks.
    if (day > 1) {
      const stored = await db.select().from(warDays).where(and(eq(warDays.clanTag, tag), eq(warDays.week, week)));
      const byPlayer = new Map<string, (number | null)[]>();
      for (const r of stored) {
        if (r.day >= day) continue;
        const had = byPlayer.get(r.playerTag) ?? [null, null, null];
        had[r.day - 1] = r.decks;
        byPlayer.set(r.playerTag, had);
      }
      for (const p of playing) {
        const pt = bare(p.tag);
        const had = byPlayer.get(pt) ?? [null, null, null];
        const done = finishDays(had.slice(0, day - 1), day - 1, p.decksUsed - p.decksUsedToday);
        done.forEach((decks, i) => {
          if (decks != null && decks !== had[i]) rows.push({ clanTag: tag, playerTag: pt, week, day: i + 1, decks });
        });
      }
    }
    if (rows.length) {
      await db
        .insert(warDays)
        .values(rows)
        .onConflictDoUpdate({
          target: [warDays.clanTag, warDays.playerTag, warDays.week, warDays.day],
          set: { decks: sql`greatest(${warDays.decks}, excluded.decks)` },
        });
      warRows = rows.length;
    }
  }

  return { tag, ok: true, joined, left, roleChanges, warRows };
}

/** Snapshots taken because of a view are at least this far apart (the cron job's pace). */
const VIEW_SNAPSHOT_MS = 30 * 60_000;

/**
 * Marks a clan as tracked (first view of its dashboard) and takes its first snapshot. Later views
 * take one only when the last is over 30 minutes old (it reuses the roster and race the page just
 * loaded, so it costs no API calls), and bump "last viewed" at most hourly. Repeat views inside
 * the window touch nothing.
 */
export async function trackClan(tagRaw: string): Promise<void> {
  const tag = bare(tagRaw);
  if (!onceEvery(`track-clan:${tag}`, VIEW_SNAPSHOT_MS)) return;
  const db = await getDb();
  if (!db) return;
  const [row] = await db.select({ viewed: trackedClans.lastViewedAt, last: trackedClans.lastSnapshotAt }).from(trackedClans).where(eq(trackedClans.tag, tag));
  if (!row) {
    await snapshotClan(tag);
    return;
  }
  if (Date.now() - row.viewed.getTime() > TRACK_MS) await db.update(trackedClans).set({ lastViewedAt: new Date() }).where(eq(trackedClans.tag, tag));
  if (Date.now() - (row.last?.getTime() ?? 0) > VIEW_SNAPSHOT_MS) await snapshotClan(tag);
}

/** Writes today's row for a tracked player from a profile already fetched. */
async function savePlayerDay(p: Player, now: Date) {
  const db = await getDb();
  if (!db) return;
  await recordIdentities([{ tag: p.tag, name: p.name, clanTag: p.clan?.tag ?? null, clanName: p.clan?.name ?? null }], now);
  const tag = bare(p.tag);
  const { day, ...row } = playerDayOf(p, now.toISOString().slice(0, 10));
  await db.transaction(async (tx) => {
    await tx
      .insert(playerDaily)
      .values({ playerTag: tag, day, ...row })
      .onConflictDoUpdate({ target: [playerDaily.playerTag, playerDaily.day], set: row });
    await tx.update(trackedPlayers).set({ name: p.name, lastSnapshotAt: now }).where(eq(trackedPlayers.tag, tag));
  });
}

/**
 * One daily snapshot of a tracked player's profile (trophies, Path of Legends, wins, battles…),
 * and their 1v1 games from the battle log for Rivals.
 */
export async function snapshotPlayer(tagRaw: string): Promise<SnapshotResult> {
  const tag = bare(tagRaw);
  if (!(await getDb())) return { tag, ok: false, reason: 'no database' };
  const [r, log] = await Promise.all([getPlayer(tag), getBattleLog(tag)]);
  if (!r.ok) return { tag, ok: false, reason: `player: ${r.status} ${r.reason}` };
  await savePlayerDay(r.data, new Date());
  if (log.ok) await saveBattles(tag, log.data);
  return { tag, ok: true };
}

/**
 * Marks a player as tracked when their profile is opened, and records today's snapshot from the
 * profile the page already loaded (no extra API call) if there isn't one yet. "Last viewed" is
 * bumped at most hourly; repeat views within the hour on this server touch nothing. Best-effort.
 */
export function trackPlayer(p: Player) {
  const tag = bare(p.tag);
  if (!onceEvery(`track:${tag}`, TRACK_MS)) return;
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    const now = new Date();
    try {
      const [row] = await db.select({ viewed: trackedPlayers.lastViewedAt, snap: trackedPlayers.lastSnapshotAt }).from(trackedPlayers).where(eq(trackedPlayers.tag, tag));
      if (!row) await db.insert(trackedPlayers).values({ tag, name: p.name, lastViewedAt: now }).onConflictDoNothing();
      else if (now.getTime() - row.viewed.getTime() > TRACK_MS) await db.update(trackedPlayers).set({ name: p.name, lastViewedAt: now }).where(eq(trackedPlayers.tag, tag));
      const today = now.toISOString().slice(0, 10);
      if (!row?.snap || row.snap.toISOString().slice(0, 10) < today) await savePlayerDay(p, now);
    } catch (e) {
      console.warn('[history] track player failed (is migration 0005 applied?):', e instanceof Error ? e.message : e);
    }
  });
}
