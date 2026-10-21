'use client';

import { useSyncExternalStore } from 'react';

/**
 * Rivals a player added by hand, keyed by that player's tag, stored on this device only (like
 * pins). Tags are upper case without the '#'.
 */
export type MyRivals = Record<string, string[]>;

const KEY = 'oa-rivals';
const EMPTY: MyRivals = {};
let cacheRaw: string | null | undefined;
let cacheVal: MyRivals = EMPTY;

function read(): MyRivals {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const v = raw ? (JSON.parse(raw) as unknown) : {};
    cacheVal = v && typeof v === 'object' ? (v as MyRivals) : EMPTY;
  } catch {
    cacheVal = EMPTY;
  }
  return cacheVal;
}

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

/** Adds or removes `rival` from `me`'s rivals. */
export function setRival(me: string, rival: string, on: boolean) {
  const all = read();
  const m = bare(me);
  const r = bare(rival);
  const list = (all[m] ?? []).filter((t) => t !== r);
  const next = { ...all, [m]: on ? [r, ...list].slice(0, 50) : list };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event('oa-rivals'));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener('oa-rivals', cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('oa-rivals', cb);
    window.removeEventListener('storage', onStorage);
  };
}

/** The rivals `me` added on this device (newest first). */
export function useMyRivals(me: string | null): string[] {
  const all = useSyncExternalStore(subscribe, read, () => EMPTY);
  return me ? (all[bare(me)] ?? []) : [];
}
