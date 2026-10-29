'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Copies this tab has already asked to replace, so an old copy is retried once, never in a loop. */
const tried = new Set<string>();

/**
 * Pages come from a cache that refreshes in the background: after a quiet spell, the first visitor
 * gets the old copy while the server draws a new one. When the data on screen (`at`) is older
 * than `maxMinutes`, this asks for the page again after `delayMs`, by which time the new copy is
 * ready. The page swaps its data in place; nothing on screen resets. Renders nothing.
 */
export function RefreshIfOld({ at, maxMinutes = 20, delayMs = 8000 }: { at: string | null | undefined; maxMinutes?: number; delayMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!at || tried.has(at)) return;
    const t = Date.parse(at);
    if (!Number.isFinite(t) || Date.now() - t < maxMinutes * 60_000) return;
    const id = window.setTimeout(() => {
      tried.add(at);
      router.refresh();
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [at, maxMinutes, delayMs, router]);
  return null;
}

/** How long a tab can sit in the background before its page is asked for again on return. */
const AWAY_MS = 15 * 60_000;

/**
 * A tab left open in the background keeps the numbers it loaded with. Coming back to it after 15
 * minutes or more fetches the page's data again (in place, like Refresh). Renders nothing.
 */
export function RefreshOnReturn() {
  const router = useRouter();
  useEffect(() => {
    let hiddenAt = document.hidden ? Date.now() : 0;
    const onChange = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt >= AWAY_MS) {
        hiddenAt = 0;
        router.refresh();
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, [router]);
  return null;
}
