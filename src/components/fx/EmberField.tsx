'use client';

import { useRef } from 'react';
import { useLazyScene } from './lazy';

/**
 * Glowing embers and rune dust drifting up through a header scene (three.js points, animated
 * entirely on the GPU). Embers part around the cursor. Fills its positioned parent.
 * The scene code lives in gl/embers and loads after the page.
 */
export function EmberField({ count = 260, gold = 0.35, intensity = 1 }: { count?: number; gold?: number; intensity?: number }) {
  const host = useRef<HTMLDivElement>(null);
  useLazyScene(host, () => import('./gl/embers'), (m, el) => m.mountEmbers(el, { count, gold, intensity }), [count, gold, intensity]);
  return <div ref={host} aria-hidden data-fx="embers" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
