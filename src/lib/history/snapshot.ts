import 'server-only';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { getBattleLog, getClan, getCurrentRiverRace, getPlayer } from '../cr/api';
import type { ApiRole, Player } from '../cr/types';
import { enqueue, getDb, schema } from '../db';
import { warWeekKey } from '../war';
import { indexClanMembers } from '../directory';
import { saveBattles } from './battles';
import { playerDayOf } from './playerDaily';

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
    for (const p of people) {
      const tag = bare(p.tag);
      const clanTag = p.clanTag ? bare(p.clanTag) : null;
      const cur = latest.get(tag);
      if (cur && cur.name === p.name && cur.clanTag === clanTag) await db.update(playerIdentity).set({ lastSeenAt: now, clanName: p.clanName }).where(eq(playerIdentity.id, cur.id));
      else await db.insert(playerIdentity).values({ tag, name: p.name, clanTag, clanName: p.clanName, firstSeenAt: now, lastSeenAt: now });
    }
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
          await tx.insert(clanMembers).values({ clanTag: tag, playerTag: pt, name: m.name, role: m.role, baseline: baseline ? 1 : 0, firstSeenAt: now, lastSeenInClanAt: now });
        }
        if (!baseline) {
          joined++;
          await tx.insert(rosterEvents).values({ clanTag: tag, playerTag: pt, name: m.name, kind: 'joined', at: now });
        }
        continue;
      }
      const was = cur.role as ApiRole;
      if (was !== m.role && RANK[was] != null) {
        roleChanges++;
        await tx.insert(rosterEvents).values({
          clanTag: tag,
          playerTag: pt,
          name: m.name,
          kind: RANK[m.role] > RANK[was] ? 'promoted' : 'demoted',
          detail: `to ${LABEL[m.role]}`,
          at: now,
        });
      }
      await tx
        .update(clanMembers)
        .set({ name: m.name, role: m.role, lastSeenInClanAt: now })
        .where(and(eq(clanMembers.clanTag, tag), eq(clanMembers.playerTag, pt)));
    }

    for (const [pt, m] of active) {
      if (roster.has(pt)) continue;
      left++;
      // The API cannot tell a kick from a leave, so every exit is recorded as "left".
      await tx
        .update(clanMembers)
        .set({ leftAt: now })
        .where(and(eq(clanMembers.clanTag, tag), eq(clanMembers.playerTag, pt), isNull(clanMembers.leftAt)));
      await tx.insert(rosterEvents).values({ clanTag: tag, playerTag: pt, name: m.name, kind: 'left', at: now });
    }

    for (const [pt, m] of roster) {
      await tx
        .insert(memberDaily)
        .values({ clanTag: tag, playerTag: pt, day: today, trophies: m.trophies, donations: m.donations })
        .onConflictDoUpdate({ target: [memberDaily.clanTag, memberDaily.playerTag, memberDaily.day], set: { trophies: m.trophies, donations: m.donations } });
    }
  });

  // War day decks: keep the highest decksUsedToday seen for each member and day.
  let warRows = 0;
  if (raceR.ok && raceR.data.periodType !== 'training') {
    const race = raceR.data;
    const day = Math.max(1, Math.min(4, (race.periodIndex % 7) - 2));
    const week = warWeekKey(now);
    const ours = race.clans.find((c) => bare(c.tag) === tag) ?? race.clan;
    const rows = ours.participants.filter((p) => roster.has(bare(p.tag))).map((p) => ({ clanTag: tag, playerTag: bare(p.tag), week, day, decks: p.decksUsedToday }));
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

/** Marks a clan as tracked (first view of its dashboard) and takes its first snapshot. */
export async function trackClan(tagRaw: string): Promise<void> {
  const tag = bare(tagRaw);
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ tag: trackedClans.tag, last: trackedClans.lastSnapshotAt }).from(trackedClans).where(eq(trackedClans.tag, tag));
  if (existing.length) {
    await db.update(trackedClans).set({ lastViewedAt: new Date() }).where(eq(trackedClans.tag, tag));
    // Viewing keeps data fresh between cron runs (at most every 30 minutes).
    const last = existing[0].last?.getTime() ?? 0;
    if (Date.now() - last > 30 * 60_000) await snapshotClan(tag);
    return;
  }
  await snapshotClan(tag);
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
 * profile the page already loaded (no extra API call). Best-effort: never throws.
 */
export function trackPlayer(p: Player) {
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    const now = new Date();
    try {
      await db
        .insert(trackedPlayers)
        .values({ tag: bare(p.tag), name: p.name, lastViewedAt: now })
        .onConflictDoUpdate({ target: trackedPlayers.tag, set: { name: p.name, lastViewedAt: now } });
      await savePlayerDay(p, now);
    } catch (e) {
      console.warn('[history] track player failed (is migration 0005 applied?):', e instanceof Error ? e.message : e);
    }
  });
}
