'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLazyScene } from './lazy';

/**
 * Embers scenes on the page other than the ambient one. The ambient layer stands down while a
 * page has its own (two full ember scenes at once doubled the GPU work for no visible gain).
 */
let scenes = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
/** True while some page section shows its own embers. */
export const useOwnEmbers = () =>
  useSyncExternalStore(
    subscribe,
    () => scenes > 0,
    () => false,
  );

/**
 * Glowing embers and rune dust drifting up through a header scene (three.js points, animated
 * entirely on the GPU). Embers part around the cursor. Fills its positioned parent.
 * The scene code lives in gl/embers and loads after the page. Decorative, so 30 fps is plenty.
 */
export function EmberField({ count = 260, gold = 0.35, intensity = 1, fps = 30, ambient = false }: { count?: number; gold?: number; intensity?: number; fps?: number; ambient?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ambient) return;
    scenes++;
    notify();
    return () => {
      scenes--;
      notify();
    };
  }, [ambient]);
  useLazyScene(host, () => import('./gl/embers'), (m, el) => m.mountEmbers(el, { count, gold, intensity, fps }), [count, gold, intensity, fps]);
  return <div ref={host} aria-hidden data-fx="embers" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
