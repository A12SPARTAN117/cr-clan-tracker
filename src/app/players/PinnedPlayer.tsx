'use client';

import Link from 'next/link';
import { usePins } from '@/lib/pins';

export function PinnedPlayer() {
  const { player } = usePins();
  if (!player) return null;
  return (
    <Link href={`/player/${player}`} className="panel ticks" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '18px 20px', color: 'var(--text-1)' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="label-sm">Pinned on this device</span>
        <span style={{ font: '700 20px/1 var(--mono)' }}>#{player}</span>
      </span>
      <span className="link-mono">Open my profile →</span>
    </Link>
  );
}
