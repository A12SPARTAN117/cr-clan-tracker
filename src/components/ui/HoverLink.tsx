'use client';

import Link from 'next/link';
import { useState, type ComponentProps } from 'react';

/**
 * A Link that prefetches when the visitor shows intent (hover, touch, keyboard focus) instead of
 * when it scrolls into view. A plain Link is watched by an IntersectionObserver and prefetched as
 * soon as it's on screen, so a list of 100 rows cost dozens of requests per visit and observer
 * work on every animation frame. The nav uses it too: each prefetch is a billed CDN request, and
 * hovering a link starts its prefetch a moment before the click anyway.
 */
export function HoverLink({ onMouseEnter, onTouchStart, onFocus, prefetch, ...props }: ComponentProps<typeof Link>) {
  const [active, setActive] = useState(false);
  return (
    <Link
      {...props}
      prefetch={active ? (prefetch ?? null) : false}
      onMouseEnter={(e) => {
        setActive(true);
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        setActive(true);
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        setActive(true);
        onFocus?.(e);
      }}
    />
  );
}
