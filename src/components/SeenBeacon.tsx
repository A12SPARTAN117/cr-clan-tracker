'use client';

import { useEffect } from 'react';

/** Each browser reports a page at most this often. */
const EVERY_MS = 3600_000;

/**
 * Tells the server a player or clan page was opened, so it can keep that tag tracked and store
 * what it saw (history, games, name search). The pages themselves are cached and shared, so they
 * can't do it while rendering. Sent once an hour per tag per browser, after the page has loaded.
 */
export function SeenBeacon({ kind, tag }: { kind: 'player' | 'games' | 'clan' | 'manage'; tag: string }) {
  useEffect(() => {
    const key = `oa-seen:${kind}:${tag}`;
    try {
      if (Date.now() - Number(localStorage.getItem(key) ?? 0) < EVERY_MS) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {}
    const body = JSON.stringify({ kind, tag });
    if (!navigator.sendBeacon?.('/api/seen', new Blob([body], { type: 'application/json' })))
      fetch('/api/seen', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  }, [kind, tag]);
  return null;
}
