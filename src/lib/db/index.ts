import 'server-only';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Database connection, opened lazily and migrated on first use.
 * - DATABASE_URL=postgres://…        any Postgres (Neon, Supabase, RDS…)
 * - DATABASE_URL=pglite:./.data/pg   embedded Postgres for local development, no server needed
 * - unset                            no history: pages show their "Data since" states
 */
// On globalThis: each route is bundled on its own, and module state isn't shared between bundles.
const g = globalThis as unknown as { __crDb?: Promise<Db | null>; __crWrites?: { tail: Promise<unknown>; queued: number } };

export function getDb(): Promise<Db | null> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return Promise.resolve(null);
  // `next build` prerenders in many worker processes at once, and the embedded Postgres can only
  // be opened by one process (several at once corrupt its folder). Builds use no history then.
  if (url.startsWith('pglite:') && process.env.NEXT_PHASE === 'phase-production-build') return Promise.resolve(null);
  if (!g.__crDb) {
    g.__crDb = open(url).catch((e) => {
      console.error('[db] could not open the database:', e instanceof Error ? (e.cause ?? e.message) : e);
      g.__crDb = undefined; // try again on the next request
      return null;
    });
  }
  return g.__crDb;
}

async function open(url: string): Promise<Db> {
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  if (url.startsWith('pglite:')) {
    const { PGlite } = await import('@electric-sql/pglite');
    // Trigram matching for the name-search index (migration 0002).
    const { pg_trgm } = await import('@electric-sql/pglite/contrib/pg_trgm');
    const { drizzle } = await import('drizzle-orm/pglite');
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    const dir = path.resolve(/*turbopackIgnore: true*/ url.slice('pglite:'.length) || './.data/pg');
    mkdirSync(dir, { recursive: true }); // PGlite only creates the last folder
    const client = new PGlite(dir, { extensions: { pg_trgm } });
    const db = drizzle({ client, schema });
    await migrate(db, { migrationsFolder });
    return db as unknown as Db;
  }
  const postgres = (await import('postgres')).default;
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const { migrate } = await import('drizzle-orm/postgres-js/migrator');
  const client = postgres(url, { max: 5, prepare: false, onnotice: () => {} });
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as Db;
}

/**
 * Background database writes go through one queue: the embedded Postgres (PGlite) is
 * single-threaded and crashed under many concurrent upserts, which corrupted its data folder.
 */
const line = (g.__crWrites ??= { tail: Promise.resolve(), queued: 0 });
/** Writes queued since this process started (shown by /api/cron/status). */
export const writeStats = {
  get queued() {
    return line.queued;
  },
};
export function enqueue<T>(job: () => Promise<T>): Promise<T> {
  line.queued++;
  const run = line.tail.then(job);
  line.tail = run.catch(() => {});
  return run;
}

export { schema };
