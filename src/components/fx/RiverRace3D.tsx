'use client';

import { useRef } from 'react';
import type { RaceBoat } from './gl/river';
import { useLazyScene } from './lazy';

export type { RaceBoat };

/**
 * The current river race as a scene: one lane per clan on flowing water, each clan's boat as
 * far along as its fame (finish line at `finish` fame). Your clan's boat is blue. During
 * training days every boat waits at the start. The scene code lives in gl/river and loads
 * after the page.
 */
export function RiverRace3D({ clans, finish = 10000, training = false, height = 220 }: { clans: RaceBoat[]; finish?: number; training?: boolean; height?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const key = clans.map((c) => `${c.tag}:${c.fame}:${c.us ? 1 : 0}`).join('|') + `|${finish}|${training}`;
  useLazyScene(host, () => import('./gl/river'), (m, el) => m.mountRiver(el, { clans, finish, training }), [key]);

  return (
    <div
      ref={host}
      role="img"
      aria-label={`River race: ${clans.map((c) => `${c.name} ${c.fame} fame`).join(', ')}${training ? ' (training days, the race has not started)' : ''}`}
      data-fx="river"
      style={{ position: 'relative', width: '100%', height, borderRadius: 8, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 60%, rgba(10,72,201,.18), transparent 70%)' }}
    />
  );
}
