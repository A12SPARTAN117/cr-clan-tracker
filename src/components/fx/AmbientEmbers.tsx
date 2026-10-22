'use client';

import { useSyncExternalStore } from 'react';
import { fxLevel } from './budget';
import { EmberField, useOwnEmbers } from './EmberField';

const noop = () => () => {};

/**
 * A faint layer of drifting embers behind every page (one small three.js canvas, 24 fps). Left
 * out on pages with their own ember scene, and on devices below the 'full' effects level.
 */
export function AmbientEmbers() {
  const own = useOwnEmbers();
  // Known only in the browser; the server renders nothing here.
  const full = useSyncExternalStore(
    noop,
    () => fxLevel() === 'full',
    () => false,
  );
  if (own || !full) return null;
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <EmberField count={90} gold={0.3} intensity={0.45} fps={24} ambient />
    </div>
  );
}
