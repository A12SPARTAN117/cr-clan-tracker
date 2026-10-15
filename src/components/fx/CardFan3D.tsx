'use client';

import { useRef } from 'react';
import { useLazyScene } from './lazy';

/**
 * A deck held like a hand of cards: the eight card arts on a 3D arc that bobs gently, follows
 * the cursor and lifts the card under it. Decorative (aria-hidden); the real card grid stays in
 * the DOM next to it. The scene code lives in gl/card-fan and loads after the page.
 */
export function CardFan3D({ images, height = 320 }: { images: string[]; height?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const key = images.join('|');
  useLazyScene(host, () => import('./gl/card-fan'), (m, el) => m.mountCardFan(el, key.split('|').filter(Boolean)), [key]);
  return <div ref={host} aria-hidden data-fx="card-fan" style={{ position: 'relative', width: '100%', height }} />;
}
