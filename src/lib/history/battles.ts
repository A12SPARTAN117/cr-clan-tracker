import 'server-only';
import { desc, eq } from 'drizzle-orm';
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
