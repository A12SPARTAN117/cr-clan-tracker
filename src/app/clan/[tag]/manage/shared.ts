'use client';

import { useSyncExternalStore } from 'react';
import type { DashMember } from '@/lib/clan/dashboard';
import { assetScore, DEFAULT_WEIGHTS, FACTORS, type Weights } from '@/lib/clan/score';
import { tenureShort } from '@/lib/format';

export type Scored = DashMember & { score: number; def: number; rank: number; defRank: number };

/** Ranks members by score with the current weights and with the defaults (for rank movement). */
export function scoreMembers(members: DashMember[], w: Weights): Scored[] {
  const all = members.map((m) => ({ ...m, score: assetScore(m.factors, w), def: assetScore(m.factors, DEFAULT_WEIGHTS), rank: 0, defRank: 0 }));
  [...all].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).forEach((m, i) => (m.rank = i + 1));
  [...all].sort((a, b) => b.def - a.def || a.name.localeCompare(b.name)).forEach((m, i) => (m.defRank = i + 1));
  return all;
}

export const tenureText = (m: Pick<DashMember, 'tenureDays' | 'tenureKnown' | 'hist'>) => {
  if (m.tenureKnown === 'exact') return tenureShort(m.tenureDays);
  if (m.tenureDays <= 0) return '< 1w';
  // Present in every tracked race: we only know the lower bound.
  const all = m.hist.length > 0 && m.hist.every(Boolean);
  return `${tenureShort(m.tenureDays)}${all ? '+' : ''}`;
};

/* ---------- weights stored per clan on this device ---------- */
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; val: Weights }>();
const key = (tag: string) => `oa-weights:${tag}`;

function readWeights(tag: string): Weights {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key(tag)) ?? localStorage.getItem('oa-weights');
  } catch {}
  const hit = cache.get(tag);
  if (hit && hit.raw === raw) return hit.val;
  let val = DEFAULT_WEIGHTS;
  try {
    const p = raw ? (JSON.parse(raw) as Partial<Weights>) : null;
    if (p) val = Object.fromEntries(FACTORS.map((k) => [k, Math.max(0, Math.min(50, Number(p[k] ?? DEFAULT_WEIGHTS[k])))])) as Weights;
  } catch {}
  cache.set(tag, { raw, val });
  return val;
}

export function saveWeights(tag: string, w: Weights | null) {
  try {
    if (w) localStorage.setItem(key(tag), JSON.stringify(w));
    else localStorage.removeItem(key(tag));
  } catch {}
  listeners.forEach((l) => l());
}

export function useWeights(tag: string): Weights {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => readWeights(tag),
    () => DEFAULT_WEIGHTS,
  );
}

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const esc = (v: string | number | null) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** War MVP awards: who earned the most fame in each finished river race (ties share it). */
export type Mvp = { count: number; last: string; fame: number };

export function mvpOf(past: { label: string; members: { tag: string; fame: number }[] }[]): Map<string, Mvp> {
  const out = new Map<string, Mvp>();
  // Oldest first, so `last` ends on the most recent award.
  for (const race of [...past].reverse()) {
    const top = Math.max(0, ...race.members.map((m) => m.fame));
    if (!top) continue;
    for (const m of race.members.filter((x) => x.fame === top)) {
      const cur = out.get(m.tag);
      out.set(m.tag, { count: (cur?.count ?? 0) + 1, last: race.label, fame: m.fame });
    }
  }
  return out;
}

/** Members who said they can't play war today, per clan and war day, kept on this device. */
const EXCUSED = 'oa-excused';
let exRaw: string | null | undefined;
let exVal: Record<string, string[]> = {};
function readExcused(): Record<string, string[]> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(EXCUSED);
  } catch {}
  if (raw === exRaw) return exVal;
  exRaw = raw;
  try {
    exVal = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    exVal = {};
  }
  return exVal;
}
const EMPTY_LIST: string[] = [];
export function useExcused(key: string | null): string[] {
  const all = useSyncExternalStore(
    (cb) => {
      window.addEventListener('oa-excused', cb);
      return () => window.removeEventListener('oa-excused', cb);
    },
    readExcused,
    () => ({}) as Record<string, string[]>,
  );
  return key ? (all[key] ?? EMPTY_LIST) : EMPTY_LIST;
}
export function setExcused(key: string, tag: string, on: boolean) {
  const all = readExcused();
  const list = (all[key] ?? []).filter((t) => t !== tag);
  // Keep only the last few war days, so the store doesn't grow forever.
  const next = Object.fromEntries([...Object.entries({ ...all, [key]: on ? [...list, tag] : list })].slice(-12));
  try {
    localStorage.setItem(EXCUSED, JSON.stringify(next));
  } catch {}
  window.dispatchEvent(new Event('oa-excused'));
}
