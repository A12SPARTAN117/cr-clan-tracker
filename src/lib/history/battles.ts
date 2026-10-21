import 'server-only';
import { and, desc, eq, or } from 'drizzle-orm';
import { getBattleLog } from '../cr/api';
import type { Battle } from '../cr/types';
import { enqueue, getDb, schema } from '../db';
import { battleKind } from '../player/profile';
import { h2hGame, rivalsOf, type H2HGame, type Rivals } from '../player/rivals';

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();
/** How far back Rivals reads stored games (newest first). */
const READ_LIMIT = 3000;

const gamesOf = (log: Battle[]) => log.flatMap((b) => h2hGame(b, battleKind(b)) ?? []);

/** Stores a player's 1v1 games from their battle log; games already stored are skipped. Best-effort. */
export function saveBattles(tagRaw: string, log: Battle[]) {
  const tag = bare(tagRaw);
  const rows = gamesOf(log).map((g) => ({ playerTag: tag, battleTime: new Date(g.time), oppTag: g.oppTag, oppName: g.oppName, oppClan: g.oppClan, kind: g.kind, result: g.result, crowns: g.crowns, oppCrowns: g.oppCrowns }));
  if (!rows.length) return;
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    try {
      await db.insert(schema.playerBattles).values(rows).onConflictDoNothing();
    } catch (e) {
      console.warn('[history] save battles failed (is migration 0006 applied?):', e instanceof Error ? e.message : e);
    }
  });
}

/** Head-to-head records: every stored game plus the live battle log. `limit`: how many rivals. */
export async function getRivals(tagRaw: string, limit = 8): Promise<Rivals> {
  const tag = bare(tagRaw);
  const [log, db] = await Promise.all([getBattleLog(tag), getDb()]);
  const live = log.ok ? gamesOf(log.data) : [];
  let stored: H2HGame[] = [];
  if (db) {
    try {
      const rows = await db.select().from(schema.playerBattles).where(eq(schema.playerBattles.playerTag, tag)).orderBy(desc(schema.playerBattles.battleTime)).limit(READ_LIMIT);
      stored = rows.map((r) => ({ time: r.battleTime.toISOString(), oppTag: r.oppTag, oppName: r.oppName, oppClan: r.oppClan, kind: r.kind, result: Math.sign(r.result) as -1 | 0 | 1, crowns: r.crowns, oppCrowns: r.oppCrowns }));
    } catch (e) {
      console.warn('[history] read battles failed (is migration 0006 applied?):', e instanceof Error ? e.message : e);
    }
  }
  return rivalsOf([...live, ...stored], 2, limit);
}

/**
 * Every 1v1 game between `a` and `b`, from `a`'s side: both players' stored games and live logs,
 * so a game shows up even if only one of the two profiles was ever opened here.
 */
export async function getHeadToHead(aRaw: string, bRaw: string): Promise<H2HGame[]> {
  const a = bare(aRaw);
  const b = bare(bRaw);
  const flip = (g: H2HGame, opp: string, oppName: string): H2HGame => ({ ...g, oppTag: opp, oppName, result: -g.result as -1 | 0 | 1, crowns: g.oppCrowns, oppCrowns: g.crowns });
  const [logA, logB, db] = await Promise.all([getBattleLog(a), getBattleLog(b), getDb()]);
  const liveA = logA.ok ? gamesOf(logA.data).filter((g) => g.oppTag === b) : [];
  const liveB = logB.ok ? gamesOf(logB.data).filter((g) => g.oppTag === a) : [];
  let storedA: H2HGame[] = [];
  let storedB: H2HGame[] = [];
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.playerBattles)
        .where(or(and(eq(schema.playerBattles.playerTag, a), eq(schema.playerBattles.oppTag, b)), and(eq(schema.playerBattles.playerTag, b), eq(schema.playerBattles.oppTag, a))))
        .orderBy(desc(schema.playerBattles.battleTime))
        .limit(READ_LIMIT);
      const toGame = (r: (typeof rows)[number]): H2HGame => ({ time: r.battleTime.toISOString(), oppTag: r.oppTag, oppName: r.oppName, oppClan: r.oppClan, kind: r.kind, result: Math.sign(r.result) as -1 | 0 | 1, crowns: r.crowns, oppCrowns: r.oppCrowns });
      storedA = rows.filter((r) => r.playerTag === a).map(toGame);
      storedB = rows.filter((r) => r.playerTag === b).map(toGame);
    } catch (e) {
      console.warn('[history] read head-to-head failed (is migration 0006 applied?):', e instanceof Error ? e.message : e);
    }
  }
  const bName = liveA[0]?.oppName ?? storedA[0]?.oppName ?? b;
  const fromB = [...liveB, ...storedB].map((g) => flip(g, b, bName));
  // One game is the same moment in both logs; keep the first copy of each.
  return [...new Map([...liveA, ...storedA, ...fromB].map((g) => [g.time, g])).values()].sort((x, y) => y.time.localeCompare(x.time));
}
