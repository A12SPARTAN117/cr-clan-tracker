'use client';

/**
 * Whether the effects kill switch is on (lib/switches, served by /api/switches). Asked once per
 * page load and remembered for 5 minutes in the session, so it adds at most one small request.
 * If the answer can't be fetched, effects stay on.
 */
const KEY = 'oa-switches';
const TTL_MS = 300_000;
let pending: Promise<boolean> | null = null;

async function fetchOff(): Promise<boolean> {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { at: number; off: boolean } | null;
    if (saved && Date.now() - saved.at < TTL_MS) return saved.off;
  } catch {}
  try {
    const r = await fetch('/api/switches');
    if (!r.ok) return false;
    const off = ((await r.json()) as { off?: string[] }).off?.includes('effects') ?? false;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), off }));
    } catch {}
    return off;
  } catch {
    return false;
  }
}

export function effectsSwitchedOff(): Promise<boolean> {
  return (pending ??= fetchOff());
}
