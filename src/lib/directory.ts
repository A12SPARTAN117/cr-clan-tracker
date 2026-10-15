import 'server-only';
import { desc, like, sql } from 'drizzle-orm';
import { getDb, schema } from './db';

/**
 * Player directory for name search. The official API only finds players by tag, so every
 * roster and profile the site fetches is recorded here. Stored in Postgres when DATABASE_URL
 * is set; otherwise (or if the table is not migrated yet) in this server process's memory.
 */

export type DirPlayer = { tag: string; name: string; clanTag: string | null; clanName: string | null; trophies: number | null };

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();
const MEM_MAX = 250_000;
const g = globalThis as unknown as { __crDir?: Map<string, DirPlayer> };
const mem = () => (g.__crDir ??= new Map());

function remember(rows: DirPlayer[]) {
  const m = mem();
  for (const r of rows) {
    m.delete(r.tag); // re-insert so the newest entries survive trimming
    m.set(r.tag, r);
  }
  if (m.size > MEM_MAX) for (const k of [...m.keys()].slice(0, m.size - MEM_MAX)) m.delete(k);
}

/**
 * Database writes go through one queue: the embedded Postgres (PGlite) is single-threaded and
 * crashed under many concurrent upserts, which corrupted its data folder.
 */
let queue: Promise<unknown> = Promise.resolve();

/**
 * Records players (deduped by tag). Never throws: search is best-effort. `persist: false`
 * keeps them in memory only (used for the bulk leaderboard seed, which is rebuilt daily).
 */
export async function indexPlayers(
  input: { tag: string; name: string; clanTag?: string | null; clanName?: string | null; trophies?: number | null }[],
  { persist = true }: { persist?: boolean } = {},
) {
  const rows: DirPlayer[] = [
    ...new Map(
      input
        .filter((p) => p.tag && p.name)
        .map((p) => [bare(p.tag), { tag: bare(p.tag), name: p.name, clanTag: p.clanTag ? bare(p.clanTag) : null, clanName: p.clanName ?? null, trophies: p.trophies ?? null }]),
    ).values(),
  ];
  if (!rows.length) return;
  remember(rows);
  if (!persist) return;
  const job = queue.then(() => persistRows(rows));
  queue = job.catch(() => {});
  return job;
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
  const found = new Map<string, DirPlayer>();
  const db = await getDb();
  if (db) {
    try {
      const esc = n.replace(/[\\%_]/g, (c) => `\\${c}`);
      const rows = await db
        .select({ tag: schema.players.tag, name: schema.players.name, clanTag: schema.players.clanTag, clanName: schema.players.clanName, trophies: schema.players.trophies })
        .from(schema.players)
        .where(like(schema.players.nameLower, `%${esc}%`))
        .orderBy(desc(schema.players.trophies))
        .limit(500);
      for (const r of rows) found.set(r.tag, r);
    } catch {
      // Table not migrated yet: fall through to memory.
    }
  }
  for (const r of mem().values()) if (!found.has(r.tag) && r.name.toLowerCase().includes(n)) found.set(r.tag, r);
  return rankByName([...found.values()], n, limit);
}

/**
 * Seeds the directory from every Path of Legends leaderboard (global + each country, up to
 * 1,000 players each), at most once a day per server, in the background. The first search
 * after a cold start therefore sees a partial directory; later ones see up to ~200k players.
 */
export function seedDirectory(fetchers: {
  locations: () => Promise<{ id: number; isCountry: boolean }[]>;
  board: (loc: number | 'global') => Promise<{ tag: string; name: string; clan?: { tag: string; name: string } }[]>;
}) {
  const g = globalThis as unknown as { __crSeed?: { at: number; running: boolean } };
  const st = (g.__crSeed ??= { at: 0, running: false });
  if (st.running || Date.now() - st.at < 24 * 3600_000) return;
  st.running = true;
  void (async () => {
    try {
      const locs = [{ id: 'global' as const }, ...(await fetchers.locations()).filter((l) => l.isCountry)];
      let i = 0;
      // A gentle fan-out: the leaderboard calls share the API key with live pages.
      await Promise.all(
        Array.from({ length: 6 }, async () => {
          while (i < locs.length) {
            const loc = locs[i++];
            const items = await fetchers.board(loc.id).catch(() => []);
            await indexPlayers(
              items.map((p) => ({ tag: p.tag, name: p.name, clanTag: p.clan?.tag, clanName: p.clan?.name })),
              { persist: false },
            );
          }
        }),
      );
      st.at = Date.now();
    } finally {
      st.running = false;
    }
  })();
}
