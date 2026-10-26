import 'server-only';
import { getDb, schema } from './db';

/**
 * Kill switches: features that can be turned off in a hurry (a traffic spike, a bug, the API key
 * running hot) without a redeploy.
 * - effects:        the WebGL scenes (crown, embers, card fan, river race, compare showdown)
 * - compare-clans:  clan comparisons (each clan costs up to 50 member lookups)
 * - recaps:         the shareable recap images
 *
 * To turn one off, add a row with its name to the `site_switches` table (Supabase → Table
 * Editor); delete the row to turn it back on. Each server rereads the table every 30 seconds.
 * `SWITCHES_OFF=effects,recaps` on the host does the same, applied on the next deploy or restart,
 * and works without a database.
 */
export type SwitchName = 'effects' | 'compare-clans' | 'recaps';

const TTL_MS = 30_000;
const g = globalThis as unknown as { __crSwitches?: { at: number; off: Promise<Set<string>> } };

const fromEnv = () =>
  (process.env.SWITCHES_OFF ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

async function read(): Promise<Set<string>> {
  const off = new Set(fromEnv());
  const db = await getDb().catch(() => null);
  if (!db) return off;
  try {
    for (const r of await db.select({ name: schema.siteSwitches.name }).from(schema.siteSwitches)) off.add(r.name);
  } catch (e) {
    console.warn('[switches] read failed (is migration 0013 applied?):', e instanceof Error ? e.message : e);
  }
  return off;
}

/** Every switch that is off right now. */
export function switchesOff(): Promise<Set<string>> {
  const now = Date.now();
  if (!g.__crSwitches || now - g.__crSwitches.at > TTL_MS) g.__crSwitches = { at: now, off: read() };
  return g.__crSwitches.off;
}

export const isOff = async (name: SwitchName) => (await switchesOff()).has(name);
