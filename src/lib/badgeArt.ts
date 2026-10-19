import 'server-only';
import { enqueue, getDb, schema } from './db';

/**
 * Records the art of every player badge level the site sees. Each badge has its own image per
 * level, and the API only hands out the level a player owns, so the full set fills in as players
 * are looked up. scripts/asset-checklist.mjs reads the record (via /api/badge-art) and saves
 * copies of the levels still missing. Best-effort: never throws, and skips levels this server
 * has already written.
 */

const g = globalThis as unknown as { __crBadgeArt?: Set<string> };
const seen = () => (g.__crBadgeArt ??= new Set());

export function recordBadgeArt(badges: { id: string; level: number | null; maxLevel: number | null; img: string | null }[]) {
  const rows = badges
    .filter((b) => b.img)
    .map((b) => ({ name: b.id, level: b.level ?? 1, maxLevel: b.maxLevel, url: b.img! }))
    .filter((r) => !seen().has(`${r.name}:${r.level}`));
  if (!rows.length) return;
  for (const r of rows) seen().add(`${r.name}:${r.level}`);
  return enqueue(async () => {
    const db = await getDb();
    if (!db) return;
    try {
      await db.insert(schema.badgeArt).values(rows).onConflictDoNothing();
    } catch (e) {
      for (const r of rows) seen().delete(`${r.name}:${r.level}`); // try again next time
      console.warn('[badge-art] record failed (is migration 0003 applied?):', e instanceof Error ? e.message : e);
    }
  });
}

export async function listBadgeArt() {
  const db = await getDb();
  if (!db) return null;
  return db
    .select({ name: schema.badgeArt.name, level: schema.badgeArt.level, maxLevel: schema.badgeArt.maxLevel, url: schema.badgeArt.url, firstSeenAt: schema.badgeArt.firstSeenAt })
    .from(schema.badgeArt);
}
