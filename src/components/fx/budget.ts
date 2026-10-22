'use client';

/**
 * How much decoration this device gets:
 * - 'full': every scene, pixel ratio up to 1.5
 * - 'low':  no full-screen ambient scene, fewer particles, 30 fps, pixel ratio 1
 * - 'off':  no WebGL scenes at all (their code is never downloaded), fog drawn once
 * Save-Data means 'off'; four cores or less, or 4 GB of memory or less, means 'low'. The frame
 * watchdog (./ticker) steps a device down for the rest of the session when it can't keep up.
 * Reduced motion is separate: scenes still draw, as one still frame.
 */
export type FxLevel = 'off' | 'low' | 'full';

const KEY = 'oa-fx';
const ORDER: FxLevel[] = ['off', 'low', 'full'];
let cached: FxLevel | null = null;

function detect(): FxLevel {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (nav.connection?.saveData) return 'off';
  let level: FxLevel = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 ? 'low' : 'full';
  try {
    const saved = sessionStorage.getItem(KEY) as FxLevel | null;
    if (saved && ORDER.indexOf(saved) < ORDER.indexOf(level)) level = saved;
  } catch {}
  return level;
}

export function fxLevel(): FxLevel {
  if (typeof window === 'undefined') return 'off';
  return (cached ??= detect());
}

/** Steps the level down once (for the rest of the session). Returns the new level. */
export function stepDown(): FxLevel {
  const next = ORDER[Math.max(0, ORDER.indexOf(fxLevel()) - 1)];
  cached = next;
  try {
    sessionStorage.setItem(KEY, next);
  } catch {}
  return next;
}

/** Pixel ratio for a canvas: capped, because fill cost grows with its square. */
export function fxPixelRatio(): number {
  return Math.min(devicePixelRatio || 1, fxLevel() === 'full' ? 1.5 : 1);
}
