'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Portal } from '@/components/fx/Portal';
import { TagSearch } from '@/components/TagSearch';
import { usePins } from '@/lib/pins';

/** Opens the pinned player's goals, or asks whose goals to show. */
export function MyGoals() {
  const router = useRouter();
  const pins = usePins();

  useEffect(() => {
    if (pins.player) router.replace(`/player/${pins.player}/goals`);
  }, [pins.player, router]);

  if (pins.player)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Portal size={40} />
        <span className="label" style={{ color: 'var(--text-2)' }}>
          Opening goals for #{pins.player}…
        </span>
      </div>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
      <TagSearch size="default" scope="player" then="goals" defaultHint="Player name or #tag. Press “Pin as me” on your player page and Goals opens yours next time." />
    </div>
  );
}
