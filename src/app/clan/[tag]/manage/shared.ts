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
