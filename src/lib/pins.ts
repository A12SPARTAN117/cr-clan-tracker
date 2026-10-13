'use client';

import { useSyncExternalStore } from 'react';

/** Pinned player and clan tags, stored on this device only. */
export type Pins = { player: string | null; clan: string | null };

const KEY = 'oa-pins';
const EMPTY: Pins = { player: null, clan: null };
let cacheRaw: string | null | undefined;
let cacheVal: Pins = EMPTY;

function read(): Pins {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const v = raw ? (JSON.parse(raw) as Partial<Pins>) : {};
    cacheVal = { player: v.player ?? null, clan: v.clan ?? null };
  } catch {
    cacheVal = EMPTY;
  }
  return cacheVal;
}

export function setPin(kind: keyof Pins, tag: string | null) {
  const next = { ...read(), [kind]: tag ? tag.replace(/^#/, '').toUpperCase() : null };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event('oa-pins'));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener('oa-pins', cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('oa-pins', cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function usePins(): Pins {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
