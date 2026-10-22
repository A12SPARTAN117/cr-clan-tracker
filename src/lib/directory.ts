import 'server-only';
import { desc, like, sql } from 'drizzle-orm';
import { enqueue, getDb, schema } from './db';

/**
 * Player directory for name search. The official API only finds players by tag, so every
 * roster and profile the site fetches is recorded here, and the directory job
 * (/api/cron/directory) adds every country's Path of Legends leaderboard. Stored in Postgres;
 * without DATABASE_URL name search only covers the global top 1,000.
 */

export type DirPlayer = { tag: string; name: string; clanTag: string | null; clanName: string | null; trophies: number | null };

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

/** Records players (deduped by tag). Never throws: search is best-effort. */
export async function indexPlayers(input: { tag: string; name: string; clanTag?: string | null; clanName?: string | null; trophies?: number | null }[]) {
  const rows: DirPlayer[] = [
    ...new Map(
      input
        .filter((p) => p.tag && p.name)
        .map((p) => [bare(p.tag), { tag: bare(p.tag), name: p.name, clanTag: p.clanTag ? bare(p.clanTag) : null, clanName: p.clanName ?? null, trophies: p.trophies ?? null }]),
    ).values(),
  ];
  if (!rows.length) return;
  return enqueue(() => persistRows(rows));
}

async function persistRows(rows: DirPlayer[]) {
  const db = await getDb();
  if (!db) return;
  try {
    const now = new Date();
    for (let i = 0; i < rows.length; i += 200) {
      await db
        .insert(schema.players)
        .values(rows.slice(i, i + 200).map((r) => ({ ...r, nameLower: r.name.toLowerCase(), updatedAt: now })))
        .onConflictDoUpdate({
          target: schema.players.tag,
          set: {
            name: sql`excluded.name`,
            nameLower: sql`excluded.name_lower`,
            clanTag: sql`excluded.clan_tag`,
            clanName: sql`excluded.clan_name`,
            trophies: sql`coalesce(excluded.trophies, ${schema.players.trophies})`,
            updatedAt: now,
          },
        });
    }
  } catch (e) {
    console.warn('[directory] index failed (is the players migration applied?):', e instanceof Error ? e.message : e);
  }
}

/** Records every member of a clan roster. */
export function indexClanMembers(clan: { tag: string; name: string; memberList: { tag: string; name: string; trophies: number }[] }) {
  return indexPlayers(clan.memberList.map((m) => ({ tag: m.tag, name: m.name, clanTag: clan.tag, clanName: clan.name, trophies: m.trophies })));
}

/** Case-insensitive name search; exact and prefix matches first, then by trophies. */
export function rankByName<T extends { name: string; trophies: number | null }>(rows: T[], q: string, limit: number): T[] {
  const n = q.trim().toLowerCase();
  const score = (r: T) => {
    const l = r.name.toLowerCase();
    return l === n ? 0 : l.startsWith(n) ? 1 : 2;
  };
  return rows
    .filter((r) => r.name.toLowerCase().includes(n))
    .sort((a, b) => score(a) - score(b) || (b.trophies ?? 0) - (a.trophies ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function findPlayersByName(q: string, limit = 100): Promise<DirPlayer[]> {
  const n = q.trim().toLowerCase();
  if (n.length < 2) return [];
  const db = await getDb();
  if (!db) return [];
  try {
    const esc = n.replace(/[\\%_]/g, (c) => `\\${c}`);
    const rows = await db
      .select({ tag: schema.players.tag, name: schema.players.name, clanTag: schema.players.clanTag, clanName: schema.players.clanName, trophies: schema.players.trophies })
      .from(schema.players)
      .where(like(schema.players.nameLower, `%${esc}%`))
      .orderBy(desc(schema.players.trophies))
      .limit(500);
    return rankByName(rows, n, limit);
  } catch {
    return []; // table not migrated yet
  }
}
