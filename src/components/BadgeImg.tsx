'use client';

import { useState } from 'react';
import { BADGE_PLACEHOLDER, badgeCopy, badgeCopyNearest } from '@/lib/badgeCopies';

/**
 * A player badge's art: our small saved copy first, then the official image, then our copy of the
 * badge's nearest other level. Each one that fails to load moves on to the next, and the
 * universal placeholder badge comes last, so a badge is never a broken image.
 */
export function BadgeImg({ id, level, official, alt = '' }: { id: string; level: number | null | undefined; official: string | null; alt?: string }) {
  const sources = [...new Set([badgeCopy(id, level), official, badgeCopyNearest(id, level)].filter((x): x is string => !!x))];
  const [step, setStep] = useState(0);
  const src = sources[step] ?? BADGE_PLACEHOLDER;
  // eslint-disable-next-line @next/next/no-img-element -- badge art with local fallbacks
  return <img key={src} src={src} alt={alt} loading="lazy" decoding="async" onError={() => src !== BADGE_PLACEHOLDER && setStep((n) => n + 1)} />;
}
