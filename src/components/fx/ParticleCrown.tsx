'use client';

import { useRef } from 'react';
import { useLazyScene } from './lazy';

/**
 * The Home hero's particle crown. Rotates 0.0035 rad/frame, tilts toward the cursor and
 * scatters into a sphere as `scrollRoot` scrolls out of view (8% lerp). Static under
 * prefers-reduced-motion. The scene code lives in gl/crown and loads after the page.
 */
export function ParticleCrown({ count, scrollRoot }: { count?: number; scrollRoot?: React.RefObject<HTMLElement | null> }) {
  const host = useRef<HTMLDivElement>(null);
  useLazyScene(host, () => import('./gl/crown'), (m, el) => m.mountCrown(el, { count, scrollRoot }), [count, scrollRoot]);
  return <div ref={host} aria-hidden style={{ position: 'absolute', inset: 0 }} />;
}
