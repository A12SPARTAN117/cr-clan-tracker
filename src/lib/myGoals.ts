'use client';

import { useSyncExternalStore } from 'react';
import type { MetricKey } from './player/goals';

/** A player's season goals, keyed by their tag, stored on this device only (like pins and rivals). */
export type Goal = { id: string; metric: MetricKey; target: number; created: string };
type Store = Record<string, Goal[]>;

const KEY = 'oa-goals';
const EMPTY: Store = {};
const NONE: Goal[] = [];
let cacheRaw: string | null | undefined;
let cacheVal: Store = EMPTY;

function read(): Store {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const v = raw ? (JSON.parse(raw) as unknown) : {};
    cacheVal = v && typeof v === 'object' ? (v as Store) : EMPTY;
  } catch {
    cacheVal = EMPTY;
  }
  return cacheVal;
}

const bare = (t: string) => t.replace(/^#/, '').toUpperCase();

function write(next: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event('oa-goals'));
}

export function addGoal(tag: string, metric: MetricKey, target: number) {
  const all = read();
  const t = bare(tag);
  const goal: Goal = { id: `${metric}-${target}-${Date.now()}`, metric, target, created: new Date().toISOString() };
  write({ ...all, [t]: [...(all[t] ?? []).filter((g) => !(g.metric === metric && g.target === target)), goal].slice(-20) });
}

export function removeGoal(tag: string, id: string) {
  const all = read();
  const t = bare(tag);
  write({ ...all, [t]: (all[t] ?? []).filter((g) => g.id !== id) });
}

export function useGoals(tag: string): Goal[] {
  const all = useSyncExternalStore(
    (cb) => {
      const onStorage = (e: StorageEvent) => e.key === KEY && cb();
      window.addEventListener('oa-goals', cb);
      window.addEventListener('storage', onStorage);
      return () => {
        window.removeEventListener('oa-goals', cb);
        window.removeEventListener('storage', onStorage);
      };
    },
    read,
    () => EMPTY,
  );
  return all[bare(tag)] ?? NONE;
}
